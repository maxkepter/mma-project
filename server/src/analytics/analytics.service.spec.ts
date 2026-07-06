import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { StatisticsService } from '../statistics/statistics.service';
import { LotteryResult } from '../lottery-core/entities/lottery-result.entity';
import { PrizeLevel } from '../lottery-core/entities/prize-level.enum';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const makeDraw = (date: string, values: string[]): LotteryResult => {
    const draw = {
      id: '1',
      date: new Date(date),
      source: 'test',
      region: 'Northern',
      numbers: [],
    } as unknown as LotteryResult;
    draw.numbers = values.map((value) => ({
      id: '1',
      prizeLevel: PrizeLevel.Seventh,
      value,
      position: 0,
      lotteryResult: draw,
    }));
    return draw;
  };

  beforeEach(async () => {
    // Create 10 draws where each number 00-09 appears exactly once per draw
    const mockDraws: LotteryResult[] = [];
    for (let d = 0; d < 10; d++) {
      const dateStr = `2026-07-0${d + 1}`;
      const values = Array.from({ length: 10 }, (_, i) => `000${i}0${i}`);
      mockDraws.push(makeDraw(dateStr, values));
    }

    const mockRepo = {
      find: jest.fn().mockImplementation(({ order, take }) => {
        const sorted = [...mockDraws];
        if (order?.date === 'ASC')
          sorted.sort((a, b) => a.date.getTime() - b.date.getTime());
        else sorted.sort((a, b) => b.date.getTime() - a.date.getTime());
        return Promise.resolve(sorted.slice(0, take ?? sorted.length));
      }),
    };

    const mockStatsService = {
      getFrequency: jest.fn().mockResolvedValue(
        Array.from({ length: 100 }, (_, i) => ({
          number: i.toString().padStart(2, '0'),
          count: i < 10 ? 10 : 1,
          percentage: 0,
          rank: i,
        })),
      ),
      getGan: jest.fn().mockResolvedValue(
        Array.from({ length: 100 }, (_, i) => ({
          number: i.toString().padStart(2, '0'),
          currentGan: i < 10 ? 0 : i * 2,
          maxGan: 100,
          lastSeenDate: '2026-07-10',
        })),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(LotteryResult), useValue: mockRepo },
        { provide: StatisticsService, useValue: mockStatsService },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTrend', () => {
    it('should return 100 trend items', async () => {
      const result = await service.getTrend(90);
      expect(result).toHaveLength(100);
    });

    it('should have up/down/stable trend values', async () => {
      const result = await service.getTrend(90);
      for (const item of result) {
        expect(['up', 'down', 'stable']).toContain(item.trend);
      }
    });

    it('should have all required fields', async () => {
      const result = await service.getTrend(90);
      for (const item of result) {
        expect(item).toHaveProperty('number');
        expect(item).toHaveProperty('trend');
        expect(item).toHaveProperty('slope');
        expect(item).toHaveProperty('recentFreq');
        expect(item).toHaveProperty('mediumFreq');
        expect(item).toHaveProperty('longFreq');
      }
    });
  });

  describe('getCycle', () => {
    it('should return 100 cycle items', async () => {
      const result = await service.getCycle(500);
      expect(result).toHaveLength(100);
    });

    it('should have all required fields', async () => {
      const result = await service.getCycle(500);
      for (const item of result) {
        expect(item).toHaveProperty('number');
        expect(item).toHaveProperty('averageCycle');
        expect(item).toHaveProperty('maxCycle');
        expect(item).toHaveProperty('currentOverdue');
        expect(item).toHaveProperty('isOverdue');
        expect(item).toHaveProperty('lastSeenDate');
      }
    });

    it('should mark numbers with overdue ratio >= 1.0 as overdue', async () => {
      const result = await service.getCycle(500);
      for (const item of result) {
        if (item.isOverdue) {
          expect(item.currentOverdue).toBeGreaterThanOrEqual(1.0);
        }
      }
    });
  });

  describe('getCorrelation', () => {
    it('should return correlation items with required fields', async () => {
      const result = await service.getCorrelation(300);
      for (const item of result) {
        expect(item).toHaveProperty('numberA');
        expect(item).toHaveProperty('numberB');
        expect(item).toHaveProperty('correlationCoefficient');
        expect(item).toHaveProperty('coOccurrenceCount');
        expect(item).toHaveProperty('coOccurrencePercentage');
      }
    });

    it('should filter out pairs with |r| <= 0.05', async () => {
      const result = await service.getCorrelation(300);
      for (const item of result) {
        expect(Math.abs(item.correlationCoefficient)).toBeGreaterThan(0.05);
      }
    });

    it('should return at most 100 pairs', async () => {
      const result = await service.getCorrelation(300);
      expect(result.length).toBeLessThanOrEqual(100);
    });
  });

  describe('getPredictions', () => {
    it('should return topN predictions', async () => {
      const result = await service.getPredictions(10);
      expect(result).toHaveLength(10);
    });

    it('should be sorted by score descending', async () => {
      const result = await service.getPredictions(10);
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
      }
    });

    it('should have all required fields per prediction', async () => {
      const result = await service.getPredictions(10);
      for (const item of result) {
        expect(item).toHaveProperty('number');
        expect(item).toHaveProperty('score');
        expect(item).toHaveProperty('confidence');
        expect(item).toHaveProperty('frequencyFactor');
        expect(item).toHaveProperty('overdueFactor');
        expect(item).toHaveProperty('trendFactor');
        expect(item).toHaveProperty('reasoning');
        expect(['high', 'medium', 'low']).toContain(item.confidence);
      }
    });

    it('should cap confidence at topN returned items', async () => {
      const result = await service.getPredictions(5);
      expect(result).toHaveLength(5);
    });
  });
});
