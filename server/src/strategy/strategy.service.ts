import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Strategy } from './entities/strategy.entity';
import { StrategyCondition } from './entities/strategy-condition.entity';
import { BacktestRun } from './entities/backtest-run.entity';
import { BacktestResult } from './entities/backtest-result.entity';
import { LotteryResult } from '../lottery-core/entities/lottery-result.entity';
import { PrizeLevel } from '../lottery-core/entities/prize-level.enum';
import {
  CreateStrategyDto,
  UpdateStrategyDto,
  RunBacktestDto,
  SaveBacktestRunDto,
} from './dto/strategy.dto';

// ponytail: simplified — no live stats computation, conditions + history only
function evaluateCondition(
  metricVal: number,
  op: string,
  condVal: number | number[],
): boolean {
  switch (op) {
    case 'eq':
      return metricVal === condVal;
    case 'gt':
      return metricVal > (condVal as number);
    case 'gte':
      return metricVal >= (condVal as number);
    case 'lt':
      return metricVal < (condVal as number);
    case 'lte':
      return metricVal <= (condVal as number);
    case 'between':
      return (
        Array.isArray(condVal) &&
        metricVal >= condVal[0] &&
        metricVal <= condVal[1]
      );
    case 'in':
      return Array.isArray(condVal) && condVal.includes(metricVal);
    default:
      return false;
  }
}

@Injectable()
export class StrategyService {
  constructor(
    @InjectRepository(Strategy)
    private readonly strategyRepo: Repository<Strategy>,
    @InjectRepository(BacktestRun)
    private readonly backtestRepo: Repository<BacktestRun>,
    @InjectRepository(LotteryResult)
    private readonly lotteryResultRepo: Repository<LotteryResult>,
  ) {}

  async create(userId: string, dto: CreateStrategyDto): Promise<Strategy> {
    const strategy = this.strategyRepo.create({
      userId,
      ...dto,
    });
    return this.strategyRepo.save(strategy);
  }

  async findAll(userId: string): Promise<Strategy[]> {
    return this.strategyRepo.find({
      where: { userId },
      relations: ['conditions'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Strategy> {
    const strategy = await this.strategyRepo.findOne({
      where: { id },
      relations: ['conditions', 'backtestRuns'],
      order: { backtestRuns: { startDate: 'DESC' } },
    });

    if (!strategy) {
      throw new NotFoundException('Strategy not found');
    }
    if (strategy.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return strategy;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateStrategyDto,
  ): Promise<Strategy> {
    const strategy = await this.findOne(userId, id);

    if (dto.name !== undefined) strategy.name = dto.name;
    if (dto.description !== undefined) strategy.description = dto.description;
    if (dto.conditions !== undefined) {
      // Replace all existing conditions (cascade insert + orphanRemoval handles cleanup)
      const mapped = dto.conditions.map((c) => {
        const existing = strategy.conditions.find((ec) => ec.id === c.id);
        return {
          ...(existing ?? {}),
          type: c.type,
          field: c.field,
          operator: c.operator,
          value: c.value,
          logic: c.logic,
          parameters: c.parameters,
        } as StrategyCondition;
      });
      strategy.conditions = mapped;
    }

    return this.strategyRepo.save(strategy);
  }

  async remove(userId: string, id: string): Promise<void> {
    const strategy = await this.findOne(userId, id);
    await this.strategyRepo.remove(strategy);
  }

  async runBacktest(
    userId: string,
    id: string,
    dto: RunBacktestDto,
  ): Promise<BacktestRun> {
    const strategy = await this.findOne(userId, id);

    const days =
      dto.days && !isNaN(Number(dto.days))
        ? Math.min(99, Math.max(1, Number(dto.days)))
        : null;

    const end = new Date();
    const start = new Date();
    if (days) {
      start.setDate(start.getDate() - days);
    } else if (dto.startDate && dto.endDate) {
      start.setTime(new Date(dto.startDate).getTime());
      end.setTime(new Date(dto.endDate).getTime());
    } else {
      start.setDate(start.getDate() - 30);
    }

    // Load history from DB (start - 100 days to ensure we have enough history)
    const historyStart = new Date(start);
    historyStart.setDate(historyStart.getDate() - 100);

    const allResults = await this.lotteryResultRepo.find({
      relations: ['numbers'],
      order: { date: 'ASC' },
    });

    // Filter to needed range
    const resultsInRange = allResults.filter(
      (r) => r.date >= historyStart && r.date <= end,
    );

    if (resultsInRange.length === 0) {
      // No lottery data: return zero results
      const result = new BacktestResult();
      result.totalBets = 0;
      result.wonBets = 0;
      result.lostBets = 0;
      result.totalProfit = 0;
      const backtestRun = this.backtestRepo.create({
        strategy,
        startDate: start,
        endDate: end,
        winRate: 0,
        profit: 0,
        result,
        saved: false,
      });
      return this.backtestRepo.save(backtestRun);
    }

    let totalBets = 0;
    let wonBets = 0;

    // Backtest each day in [start, end]
    for (const currentResult of resultsInRange) {
      if (currentResult.date < start || currentResult.date > end) continue;

      // Build history: draws strictly before currentResult.date
      const historyDraws = resultsInRange.filter(
        (r) => r.date < currentResult.date,
      );
      if (historyDraws.length === 0) continue;

      // Get special prize (2 last digits)
      const specialPrize = currentResult.numbers.find(
        (n) => n.prizeLevel === PrizeLevel.Special,
      );
      if (!specialPrize) continue;
      const specialValue = specialPrize.value;
      const last2 = specialValue.slice(-2);

      // Evaluate each loto number 00-99
      const betNumbers: string[] = [];
      for (let n = 0; n < 100; n++) {
        const num = n.toString().padStart(2, '0');

        // Compute stats from historyDraws (use .slice(-2) — codebase convention)
        let count = 0;
        let lastAppearedIndex = -1;
        historyDraws.forEach((r, idx) => {
          const found = r.numbers.find((ln) => ln.value.slice(-2) === num);
          if (found) {
            count++;
            lastAppearedIndex = idx;
          }
        });
        const gap =
          lastAppearedIndex === -1
            ? 999
            : historyDraws.length - lastAppearedIndex;

        // Evaluate conditions
        if (strategy.conditions.length === 0) continue;

        let match = false;
        strategy.conditions.forEach((cond, idx) => {
          // Parse cond.value: handle JSONB string (from raw JSONB or double-encoded)
          let condVal: number | number[] | null = cond.value;
          if (typeof condVal === 'string') {
            try {
              condVal = JSON.parse(condVal);
            } catch {
              // raw string number "5" → convert to number
              const asNum = Number(condVal);
              condVal = isNaN(asNum) ? null : asNum;
            }
          }
          if (condVal === null || condVal === undefined) return;

          let metricVal = 0;
          switch (cond.field) {
            case 'count':
              metricVal = count;
              break;
            case 'gap':
              metricVal = gap;
              break;
            case 'frequency':
              metricVal = count;
              break;
            default:
              return; // unknown field: skip
          }
          const condMatch = evaluateCondition(
            metricVal,
            cond.operator ?? 'eq',
            condVal,
          );
          if (idx === 0) {
            match = condMatch;
          } else if (cond.logic === 'OR') {
            match = match || condMatch;
          } else {
            match = match && condMatch;
          }
        });

        if (match) betNumbers.push(num);
      }

      // Record bets
      totalBets += betNumbers.length;
      if (betNumbers.includes(last2)) wonBets++;
    }

    const lostBets = totalBets - wonBets;
    const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;
    const totalProfit = wonBets * 80 - totalBets * 23;

    const result = new BacktestResult();
    result.totalBets = totalBets;
    result.wonBets = wonBets;
    result.lostBets = lostBets;
    result.totalProfit = totalProfit;

    const backtestRun = this.backtestRepo.create({
      strategy,
      startDate: start,
      endDate: end,
      winRate,
      profit: totalProfit,
      result,
      saved: false,
    });

    return this.backtestRepo.save(backtestRun);
  }

  async saveBacktestRun(
    userId: string,
    strategyId: string,
    runId: string,
    dto: SaveBacktestRunDto,
  ): Promise<BacktestRun> {
    // Verify access
    await this.findOne(userId, strategyId);

    const run = await this.backtestRepo.findOne({ where: { id: runId } });
    if (!run) throw new NotFoundException('Backtest run not found');

    run.saved = dto.saved;
    if (dto.name !== undefined) run.name = dto.name;

    return this.backtestRepo.save(run);
  }
}
