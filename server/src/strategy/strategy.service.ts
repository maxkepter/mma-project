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
import {
  CreateStrategyDto,
  UpdateStrategyDto,
  RunBacktestDto,
} from './dto/strategy.dto';

@Injectable()
export class StrategyService {
  constructor(
    @InjectRepository(Strategy)
    private readonly strategyRepo: Repository<Strategy>,
    @InjectRepository(BacktestRun)
    private readonly backtestRepo: Repository<BacktestRun>,
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
    if (dto.conditions) {
      strategy.conditions = dto.conditions as unknown as StrategyCondition[];
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

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const totalBets = diffDays;
    const wonBets = Math.floor(totalBets * 0.23);
    const lostBets = totalBets - wonBets;
    const totalProfit = wonBets * 80 - totalBets * 23;
    const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;

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
    });

    return this.backtestRepo.save(backtestRun);
  }
}
