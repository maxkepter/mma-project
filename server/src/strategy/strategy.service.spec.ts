import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { StrategyService } from './strategy.service';
import { Strategy } from './entities/strategy.entity';
import { StrategyCondition } from './entities/strategy-condition.entity';
import { BacktestRun } from './entities/backtest-run.entity';
import { LotteryResult } from '../lottery-core/entities/lottery-result.entity';

const mockStrategyRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
});

const mockBacktestRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

const mockLotteryResultRepo = () => ({
  find: jest.fn(),
});

describe('StrategyService', () => {
  let service: StrategyService;
  let strategyRepo: ReturnType<typeof mockStrategyRepo>;
  let backtestRepo: ReturnType<typeof mockBacktestRepo>;
  let lotteryResultRepo: ReturnType<typeof mockLotteryResultRepo>;

  const userId = 'user-123';
  const strategyId = 'strategy-abc';

  const makeStrategy = (overrides = {}): Strategy =>
    ({
      id: strategyId,
      userId,
      name: 'Test Strategy',
      description: 'Test description',
      createdAt: new Date(),
      conditions: [],
      backtestRuns: [],
      ...overrides,
    }) as unknown as Strategy;

  beforeEach(async () => {
    strategyRepo = mockStrategyRepo();
    backtestRepo = mockBacktestRepo();
    lotteryResultRepo = mockLotteryResultRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StrategyService,
        { provide: getRepositoryToken(Strategy), useValue: strategyRepo },
        { provide: getRepositoryToken(BacktestRun), useValue: backtestRepo },
        {
          provide: getRepositoryToken(LotteryResult),
          useValue: lotteryResultRepo,
        },
      ],
    }).compile();

    service = module.get<StrategyService>(StrategyService);
  });

  describe('runBacktest', () => {
    beforeEach(() => {
      strategyRepo.findOne.mockResolvedValue(makeStrategy());
      lotteryResultRepo.find.mockResolvedValue([]);
    });

    it('should default to 30 days when no params provided', async () => {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      backtestRepo.create.mockReturnValue({});

      const result = await service.runBacktest(userId, strategyId, {});

      expect(backtestRepo.create).toHaveBeenCalled();
      const created = backtestRepo.create.mock.calls[0][0];
      // startDate should be ~30 days ago
      const diffDays =
        Math.abs(today.getTime() - new Date(created.startDate).getTime()) /
        (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(29);
      expect(diffDays).toBeLessThanOrEqual(31);
    });

    it('should respect days param (1-99)', async () => {
      backtestRepo.create.mockReturnValue({});

      const result = await service.runBacktest(userId, strategyId, {
        days: '7',
      });

      const created = backtestRepo.create.mock.calls[0][0];
      const diffDays =
        Math.abs(new Date().getTime() - new Date(created.startDate).getTime()) /
        (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(6);
      expect(diffDays).toBeLessThanOrEqual(8);
    });

    it('should clamp days to 1-99', async () => {
      backtestRepo.create.mockReturnValue({});

      // days > 99 should be clamped to 99
      await service.runBacktest(userId, strategyId, { days: '200' });
      const created99 = backtestRepo.create.mock.calls[0][0];
      const diffDays99 =
        (new Date().getTime() - new Date(created99.startDate).getTime()) /
        (1000 * 60 * 60 * 24);
      expect(diffDays99).toBeGreaterThanOrEqual(98);
      expect(diffDays99).toBeLessThanOrEqual(100);

      // days < 1 should be clamped to 1
      await service.runBacktest(userId, strategyId, { days: '-5' });
      const created1 = backtestRepo.create.mock.calls[1][0]; // capture 2nd call separately
      const diffDays1 =
        (new Date().getTime() - new Date(created1.startDate).getTime()) /
        (1000 * 60 * 60 * 24);
      expect(diffDays1).toBeLessThanOrEqual(2);
    });

    it('should accept numeric days (number type)', async () => {
      backtestRepo.create.mockReturnValue({});

      // days as number (from app)
      await service.runBacktest(userId, strategyId, {
        days: 90,
      });

      const created = backtestRepo.create.mock.calls[0][0];
      const diffDays =
        Math.abs(new Date().getTime() - new Date(created.startDate).getTime()) /
        (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(89);
      expect(diffDays).toBeLessThanOrEqual(91);
    });

    it('should NOT persist to DB when save flag is absent (preview-only)', async () => {
      backtestRepo.create.mockReturnValue({});
      backtestRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.runBacktest(userId, strategyId, {
        days: '7',
      });

      expect(backtestRepo.save).not.toHaveBeenCalled();
      const created = backtestRepo.create.mock.calls[0][0];
      expect(created.saved).toBe(false);
      expect(result).toBeDefined();
    });

    it('should persist to DB when save=true', async () => {
      backtestRepo.create.mockReturnValue({});
      backtestRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      await service.runBacktest(userId, strategyId, {
        days: '7',
        save: true,
        name: 'My run',
      });

      expect(backtestRepo.save).toHaveBeenCalledTimes(1);
      const created = backtestRepo.create.mock.calls[0][0];
      expect(created.saved).toBe(true);
      expect(created.name).toBe('My run');
    });
  });

  describe('saveBacktestRun', () => {
    const runId = 'run-xyz';

    it('should set saved=true', async () => {
      strategyRepo.findOne.mockResolvedValue(makeStrategy());
      const existingRun = {
        id: runId,
        saved: false,
        name: undefined,
      } as BacktestRun;
      backtestRepo.findOne.mockResolvedValue(existingRun);
      backtestRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.saveBacktestRun(userId, strategyId, runId, {
        saved: true,
      });

      expect(existingRun.saved).toBe(true);
    });

    it('should DELETE from DB when saved=false', async () => {
      strategyRepo.findOne.mockResolvedValue(makeStrategy());
      const existingRun = { id: runId, saved: true } as BacktestRun;
      backtestRepo.findOne.mockResolvedValue(existingRun);
      backtestRepo.remove.mockResolvedValue(existingRun);

      const result = await service.saveBacktestRun(userId, strategyId, runId, {
        saved: false,
      });

      expect(backtestRepo.remove).toHaveBeenCalledWith(existingRun);
      expect(backtestRepo.save).not.toHaveBeenCalled();
      expect(result.saved).toBe(false);
    });

    it('should throw NotFoundException if run does not exist', async () => {
      strategyRepo.findOne.mockResolvedValue(makeStrategy());
      backtestRepo.findOne.mockResolvedValue(null);

      await expect(
        service.saveBacktestRun(userId, strategyId, 'nonexistent', {
          saved: true,
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if strategy belongs to another user', async () => {
      strategyRepo.findOne.mockRejectedValue(
        new ForbiddenException('Access denied'),
      );

      await expect(
        service.saveBacktestRun('other-user', strategyId, runId, {
          saved: true,
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('runBacktest with conditions (real-data shape)', () => {
    // Builds a fake draw day: LotteryNumber.value is full string (5-digit)
    // so that .slice(-2) yields the 2-digit loto.
    const mkDraw = (dateStr: string, special: string, ...lotos: string[]) => {
      const date = new Date(dateStr);
      const numbers: any[] = [
        { prizeLevel: 'Special', value: special, position: 0 },
        ...lotos.map((v, i) => ({
          prizeLevel: 'First',
          value: v,
          position: i + 1,
        })),
      ];
      return { date, source: 'default', numbers } as any;
    };

    beforeEach(() => {
      backtestRepo.create.mockImplementation((e: any) => e);
    });

    it('bets non-zero when condition matches a real loto count', async () => {
      // 10 days history, all containing loto "45"
      const today = new Date();
      const fmt = (d: Date) => d.toISOString().slice(0, 10);

      const draws: any[] = [];
      // 5 history days: each has loto "45"
      for (let i = 5; i > 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        draws.push(mkDraw(fmt(d), '12345')); // special "45"
      }
      // 2 backtest days: one has loto "45" as special, one has "99"
      const d1 = new Date(today);
      d1.setDate(today.getDate() - 2);
      draws.push(mkDraw(fmt(d1), '12345')); // special "45" → hit

      const d2 = new Date(today);
      d2.setDate(today.getDate() - 1);
      draws.push(mkDraw(fmt(d2), '99999')); // special "99" → miss

      lotteryResultRepo.find.mockResolvedValue(draws);

      const cond = {
        id: 'c1',
        type: 'frequency',
        field: 'count',
        operator: 'gte',
        value: 3,
        logic: 'AND',
      } as any;

      strategyRepo.findOne.mockResolvedValue(
        makeStrategy({ conditions: [cond] }),
      );

      const run = (await service.runBacktest(userId, strategyId, {
        days: 3,
      })) as any;

      console.log('DEBUG runBacktest result:', {
        totalBets: run.result.totalBets,
        wonBets: run.result.wonBets,
        winRate: run.winRate,
        profit: run.profit,
      });

      expect(run.result.totalBets).toBeGreaterThan(0);
      expect(run.result.wonBets).toBeGreaterThan(0);
    });

    it('returns zero bets when condition uses unknown field', async () => {
      const today = new Date();
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      const draws: any[] = [];
      for (let i = 3; i > 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        draws.push(mkDraw(fmt(d), '12345'));
      }
      lotteryResultRepo.find.mockResolvedValue(draws);

      const cond = {
        id: 'c1',
        type: 'frequency',
        field: 'unknown_field_xyz',
        operator: 'gte',
        value: 0,
      } as any;
      strategyRepo.findOne.mockResolvedValue(
        makeStrategy({ conditions: [cond] }),
      );

      const run = (await service.runBacktest(userId, strategyId, {
        days: 2,
      })) as any;

      expect(run.result.totalBets).toBe(0);
    });

    it('handles random conditions — table of results', async () => {
      const today = new Date();
      const fmt = (d: Date) => d.toISOString().slice(0, 10);

      // Fixed seed draws: 10 history days with various lotos
      const draws: any[] = [];
      // day -10 to -1: history
      const specials = [
        '12345',
        '67890',
        '11223',
        '33445',
        '55667',
        '77889',
        '99001',
        '22334',
        '44556',
        '66778',
      ];
      for (let i = 10; i >= 1; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        draws.push(mkDraw(fmt(d), specials[10 - i]));
      }
      // day 0: backtest result (special = 45)
      const d0 = new Date(today);
      draws.push(mkDraw(fmt(d0), '12345')); // last 2 = "45" → WIN

      lotteryResultRepo.find.mockResolvedValue(draws);

      const table: {
        cond: string;
        totalBets: number;
        wonBets: number;
        winRate: number;
      }[] = [];

      const cases = [
        { desc: 'count >= 1', field: 'count', op: 'gte', val: 1 },
        { desc: 'count >= 3', field: 'count', op: 'gte', val: 3 },
        { desc: 'gap > 5', field: 'gap', op: 'gt', val: 5 },
        { desc: 'gap > 3', field: 'gap', op: 'gt', val: 3 },
        { desc: 'gap <= 3', field: 'gap', op: 'lte', val: 3 },
        { desc: 'count == 0', field: 'count', op: 'eq', val: 0 },
        {
          desc: 'gap == 999 (never appeared)',
          field: 'gap',
          op: 'eq',
          val: 999,
        },
        {
          desc: 'count >= 1 AND gap > 2',
          field: 'count',
          op: 'gte',
          val: 1,
          logic: 'AND',
        },
        {
          desc: 'count == 0 OR gap == 1',
          field: 'count',
          op: 'eq',
          val: 0,
          logic: 'OR',
        },
      ];

      for (const c of cases) {
        const cond = {
          id: 'c1',
          type: 'frequency',
          field: c.field,
          operator: c.op,
          value: c.val,
          logic: c.logic,
        } as any;
        strategyRepo.findOne.mockResolvedValue(
          makeStrategy({ conditions: [cond] }),
        );

        const run = (await service.runBacktest(userId, strategyId, {
          days: 1,
        })) as any;
        table.push({
          cond: c.desc,
          totalBets: run.result.totalBets,
          wonBets: run.result.wonBets,
          winRate: run.winRate,
        });
      }

      // Pretty print
      const header =
        '| Condition                     | totalBets | wonBets | winRate |';
      const sep =
        '|-------------------------------|-----------|---------|---------|';
      const rows = table.map(
        (r) =>
          `| ${r.cond.padEnd(30)} | ${String(r.totalBets).padStart(9)} | ${String(r.wonBets).padStart(7)} | ${r.winRate.toFixed(1).padStart(6)}% |`,
      );

      const fullTable =
        '\n=== Backtest Results Table ===\n' +
        header +
        '\n' +
        sep +
        '\n' +
        rows.join('\n');
      require('fs').writeFileSync('backtest-table.txt', fullTable + '\n');

      // Sanity: at least one non-zero result
      const nonZero = table.filter((r) => r.totalBets > 0);
      expect(nonZero.length).toBeGreaterThan(0);
    });
  });
});
