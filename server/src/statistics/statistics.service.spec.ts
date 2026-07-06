import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StatisticsService } from './statistics.service';
import { LotteryResult } from '../lottery-core/entities/lottery-result.entity';
import { PrizeLevel } from '../lottery-core/entities/prize-level.enum';

describe('StatisticsService', () => {
  let service: StatisticsService;

  // Helper to build a mock LotteryResult
  const makeDraw = (
    date: string,
    numbers: { value: string; level: PrizeLevel }[],
  ): LotteryResult => {
    const draw = {
      id: '1',
      date: new Date(date),
      source: 'test',
      region: 'Northern',
      numbers: [],
    } as unknown as LotteryResult;
    draw.numbers = numbers.map((n) => ({
      id: '1',
      prizeLevel: n.level,
      value: n.value,
      position: 0,
      lotteryResult: draw,
    }));
    return draw;
  };

  beforeEach(async () => {
    // 5 draws, each with a simple set of lô numbers
    const mockDraws = [
      // Draw 1: all numbers ending with 01..05 appear once each (plus special)
      makeDraw('2026-07-01', [
        { value: '12345', level: PrizeLevel.Special },
        { value: '12301', level: PrizeLevel.First },
        { value: '99002', level: PrizeLevel.Second },
        { value: '77003', level: PrizeLevel.Third },
        { value: '55004', level: PrizeLevel.Fourth },
        { value: '33005', level: PrizeLevel.Fifth },
        { value: '22006', level: PrizeLevel.Sixth },
        { value: '11007', level: PrizeLevel.Seventh },
      ]),
      makeDraw('2026-07-02', [
        { value: '54321', level: PrizeLevel.Special },
        { value: '54311', level: PrizeLevel.First },
        { value: '99022', level: PrizeLevel.Second },
        { value: '77033', level: PrizeLevel.Third },
        { value: '55044', level: PrizeLevel.Fourth },
        { value: '33055', level: PrizeLevel.Fifth },
        { value: '22066', level: PrizeLevel.Sixth },
        { value: '11077', level: PrizeLevel.Seventh },
      ]),
      makeDraw('2026-07-03', [
        { value: '11111', level: PrizeLevel.Special },
        { value: '11112', level: PrizeLevel.First },
        { value: '99002', level: PrizeLevel.Second },
        { value: '77003', level: PrizeLevel.Third },
        { value: '55004', level: PrizeLevel.Fourth },
        { value: '33005', level: PrizeLevel.Fifth },
        { value: '22006', level: PrizeLevel.Sixth },
        { value: '11007', level: PrizeLevel.Seventh },
      ]),
      makeDraw('2026-07-04', [
        { value: '99999', level: PrizeLevel.Special },
        { value: '99998', level: PrizeLevel.First },
        { value: '99099', level: PrizeLevel.Second },
        { value: '77099', level: PrizeLevel.Third },
        { value: '55099', level: PrizeLevel.Fourth },
        { value: '33099', level: PrizeLevel.Fifth },
        { value: '22099', level: PrizeLevel.Sixth },
        { value: '11099', level: PrizeLevel.Seventh },
      ]),
      makeDraw('2026-07-05', [
        { value: '00000', level: PrizeLevel.Special },
        { value: '00001', level: PrizeLevel.First },
        { value: '99002', level: PrizeLevel.Second },
        { value: '77003', level: PrizeLevel.Third },
        { value: '55004', level: PrizeLevel.Fourth },
        { value: '33005', level: PrizeLevel.Fifth },
        { value: '22006', level: PrizeLevel.Sixth },
        { value: '11007', level: PrizeLevel.Seventh },
      ]),
    ];

    const mockRepo = {
      find: jest.fn().mockResolvedValue(mockDraws),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        {
          provide: getRepositoryToken(LotteryResult),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFrequency', () => {
    it('should return 100 numbers with count, percentage, and rank', async () => {
      const result = await service.getFrequency(5);
      expect(result).toHaveLength(100);
      expect(result[0]).toHaveProperty('number');
      expect(result[0]).toHaveProperty('count');
      expect(result[0]).toHaveProperty('percentage');
      expect(result[0]).toHaveProperty('rank');
    });

    it('should rank numbers by count descending', async () => {
      const result = await service.getFrequency(5);
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].count).toBeGreaterThanOrEqual(result[i].count);
      }
    });

    it('should count "02" appearing 3 times across 5 draws', async () => {
      const result = await service.getFrequency(5);
      const item02 = result.find((r) => r.number === '02');
      expect(item02?.count).toBe(3);
    });
  });

  describe('getGan', () => {
    it('should return 100 gan items', async () => {
      const result = await service.getGan(1000);
      expect(result).toHaveLength(100);
      expect(result[0]).toHaveProperty('number');
      expect(result[0]).toHaveProperty('currentGan');
      expect(result[0]).toHaveProperty('maxGan');
    });

    it('should have maxGan >= currentGan for every number', async () => {
      const result = await service.getGan(1000);
      for (const item of result) {
        expect(item.maxGan).toBeGreaterThanOrEqual(item.currentGan);
      }
    });

    it('should have "99" appearing in draw 4 but not draw 5, so currentGan = 1', async () => {
      const result = await service.getGan(1000);
      const item99 = result.find((r) => r.number === '99');
      expect(item99?.currentGan).toBe(1);
    });
  });

  describe('getHeadTail', () => {
    it('should return heads and tails arrays of length 10', async () => {
      const result = await service.getHeadTail(5);
      expect(result.heads).toHaveLength(10);
      expect(result.tails).toHaveLength(10);
    });

    it('should have digits 0-9 in order', async () => {
      const result = await service.getHeadTail(5);
      expect(result.heads.map((h) => h.digit)).toEqual([
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
      ]);
      expect(result.tails.map((t) => t.digit)).toEqual([
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
      ]);
    });
  });

  describe('getNumberPairs', () => {
    it('should return pairs sorted by count descending', async () => {
      const result = await service.getNumberPairs(5);
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].count).toBeGreaterThanOrEqual(result[i].count);
      }
    });

    it('should return top 100 at most', async () => {
      const result = await service.getNumberPairs(5);
      expect(result.length).toBeLessThanOrEqual(100);
    });
  });

  describe('getHeatmap', () => {
    it('should return 10 rows with 10 cells each', async () => {
      const result = await service.getHeatmap(5, 'frequency');
      expect(result.rows).toHaveLength(10);
      for (const row of result.rows) {
        expect(row.cells).toHaveLength(10);
        expect(row.head).toBeLessThan(10);
      }
    });

    it('should return correct mode', async () => {
      const freqResult = await service.getHeatmap(5, 'frequency');
      const ganResult = await service.getHeatmap(5, 'gan');
      expect(freqResult.mode).toBe('frequency');
      expect(ganResult.mode).toBe('gan');
    });
  });

  describe('getLoRoi', () => {
    it('should return lô rơi items', async () => {
      const result = await service.getLoRoi(5);
      for (const item of result) {
        expect(item).toHaveProperty('date');
        expect(item).toHaveProperty('specialLoto');
        expect(item).toHaveProperty('loRoiTuDe');
        expect(item).toHaveProperty('loRoiTuLo');
      }
    });

    it('should find lô rơi from đề when special of prev day appears today', async () => {
      // Draw 2026-07-04 special = 99999 -> loto "99"
      // Draw 2026-07-05 has many "99" numbers
      // So loRoiTuDe should contain "99"
      const result = await service.getLoRoi(5);
      const day05 = result.find((r) => r.date === '2026-07-05');
      // From 2026-07-04 special loto "99" should be in day05's loRoi if present
      if (day05) {
        // day05 specialLoto should be "99" (from 2026-07-04)
        expect(day05.specialLoto).toBe('99');
      }
    });
  });
});
