import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LotteryResult } from '../lottery-core/entities/lottery-result.entity';
import { StatisticsService } from '../statistics/statistics.service';
import {
  TrendItemDto,
  CycleItemDto,
  CorrelationItemDto,
  PredictionItemDto,
} from './dto/analytics-response.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(LotteryResult)
    private readonly lotteryResultRepo: Repository<LotteryResult>,
    private readonly statisticsService: StatisticsService,
  ) {}

  /**
   * UC-07: Phan tich xu huong
   * So sanh tan suat ngan han (10 ky), trung binh (30 ky), dai han (90 ky).
   * Slope = (recent - long) / long — duong la tang, am la giam.
   */
  async getTrend(limit: number = 90): Promise<TrendItemDto[]> {
    const [recent, medium, long] = await Promise.all([
      this.getFrequencyWindow(10),
      this.getFrequencyWindow(30),
      this.getFrequencyWindow(Math.min(limit, 90)),
    ]);

    const items: TrendItemDto[] = [];

    for (let i = 0; i < 100; i++) {
      const num = i.toString().padStart(2, '0');
      const recentFreq = recent.get(num) ?? 0;
      const mediumFreq = medium.get(num) ?? 0;
      const longFreq = long.get(num) ?? 0;

      // Normalize by window size to get daily frequency rate
      const recentRate = recentFreq / 10;
      const longRate = longFreq / Math.min(limit, 90);

      const slope = longRate > 0 ? (recentRate - longRate) / longRate : 0;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (slope > 0.2) trend = 'up';
      else if (slope < -0.2) trend = 'down';

      items.push({
        number: num,
        trend,
        slope: Math.round(slope * 1000) / 1000,
        recentFreq,
        mediumFreq,
        longFreq,
      });
    }

    return items;
  }

  /**
   * UC-08: Phan tich chu ky
   * Tinh khoang trung binh giua cac lan xuat hien cua moi so.
   */
  async getCycle(limit: number = 500): Promise<CycleItemDto[]> {
    const draws = await this.lotteryResultRepo.find({
      relations: ['numbers'],
      order: { date: 'DESC' },
      take: limit,
    });
    // Reverse de duyet tu cu den moi (can thiet cho tinh khoang cach giua cac lan xuat hien)
    draws.reverse();

    const appearanceMap = new Map<string, number[]>();

    // Build appearance list for each number
    for (let d = 0; d < draws.length; d++) {
      const draw = draws[d];
      for (const num of draw.numbers) {
        const loto = num.value.slice(-2);
        if (!appearanceMap.has(loto)) appearanceMap.set(loto, []);
        appearanceMap.get(loto)!.push(d);
      }
    }

    // Gan data from StatisticsService
    const gan = await this.statisticsService.getGan(Math.min(limit, 1000));
    const ganMap = new Map(gan.map((g) => [g.number, g]));

    const items: CycleItemDto[] = [];

    for (let i = 0; i < 100; i++) {
      const num = i.toString().padStart(2, '0');
      const appearances = appearanceMap.get(num) ?? [];

      if (appearances.length < 2) {
        const g = ganMap.get(num);
        items.push({
          number: num,
          averageCycle: 0,
          maxCycle: 0,
          currentOverdue: g ? g.currentGan / 1 : 0, // default 1 day cycle
          isOverdue: false,
          lastSeenDate: g?.lastSeenDate ?? null,
        });
        continue;
      }

      // Calculate gaps
      const gaps: number[] = [];
      for (let j = 1; j < appearances.length; j++) {
        gaps.push(appearances[j] - appearances[j - 1]);
      }

      const averageCycle =
        Math.round((gaps.reduce((a, b) => a + b, 0) / gaps.length) * 100) / 100;
      const maxCycle = Math.max(...gaps);

      const g = ganMap.get(num);
      const currentOverdue =
        averageCycle > 0 ? (g?.currentGan ?? 0) / averageCycle : 0;

      items.push({
        number: num,
        averageCycle,
        maxCycle,
        currentOverdue: Math.round(currentOverdue * 100) / 100,
        isOverdue: currentOverdue >= 1.0,
        lastSeenDate: g?.lastSeenDate ?? null,
      });
    }

    return items;
  }

  /**
   * UC-09: Phan tich tuong quan
   * Tinh he so tuong quan Pearson cho cac cap so.
   */
  async getCorrelation(limit: number = 300): Promise<CorrelationItemDto[]> {
    const draws = await this.lotteryResultRepo.find({
      relations: ['numbers'],
      order: { date: 'DESC' },
      take: limit,
    });
    draws.reverse();

    // Binary presence matrix
    const presence = new Array<Map<string, 0 | 1>>(draws.length);
    for (let d = 0; d < draws.length; d++) {
      const set = new Set(draws[d].numbers.map((n) => n.value.slice(-2)));
      presence[d] = new Map();
      for (let i = 0; i < 100; i++) {
        const num = i.toString().padStart(2, '0');
        presence[d].set(num, set.has(num) ? 1 : 0);
      }
    }

    const results: CorrelationItemDto[] = [];

    // Only compute for top pairs to avoid O(100^2) = 4950 pairs
    // Compute all pairs but filter by significance
    for (let a = 0; a < 100; a++) {
      for (let b = a + 1; b < 100; b++) {
        const numA = a.toString().padStart(2, '0');
        const numB = b.toString().padStart(2, '0');

        const x = presence.map((row) => row.get(numA) ?? 0);
        const y = presence.map((row) => row.get(numB) ?? 0);

        const { r, coCount, coPct } = this.pearsonCorrelation(x, y, limit);

        // Only include if meaningful correlation
        if (Math.abs(r) > 0.05) {
          results.push({
            numberA: numA,
            numberB: numB,
            correlationCoefficient: Math.round(r * 1000) / 1000,
            coOccurrenceCount: coCount,
            coOccurrencePercentage: Math.round(coPct * 100) / 100,
          });
        }
      }
    }

    // Sort by absolute correlation desc, return top 100
    return results
      .sort(
        (a, b) =>
          Math.abs(b.correlationCoefficient) -
          Math.abs(a.correlationCoefficient),
      )
      .slice(0, 100);
  }

  /**
   * UC-10: Du bao
   * Weighted scoring: frequency (30%) + overdue (50%) + momentum (20%).
   */
  async getPredictions(topN: number = 10): Promise<PredictionItemDto[]> {
    const [freq, cycle, trend] = await Promise.all([
      this.statisticsService.getFrequency(100),
      this.getCycle(500),
      this.getTrend(90),
    ]);

    const freqMap = new Map(freq.map((f) => [f.number, f.count]));
    const maxFreq = Math.max(...freq.map((f) => f.count), 1);
    const trendMap = new Map(trend.map((t) => [t.number, t]));
    const cycleMap = new Map(cycle.map((c) => [c.number, c]));

    const predictions: PredictionItemDto[] = [];

    for (let i = 0; i < 100; i++) {
      const num = i.toString().padStart(2, '0');

      // Frequency factor (normalized 0-1)
      const freqFactor = (freqMap.get(num) ?? 0) / maxFreq;

      // Overdue factor: Gaussian centered at 1.5x average cycle
      const cyc = cycleMap.get(num);
      const overdueRatio = cyc?.currentOverdue ?? 0;
      let overdueFactor = 0;
      if (overdueRatio >= 1.0 && overdueRatio < 2.5) {
        overdueFactor = Math.exp(-Math.pow(overdueRatio - 1.5, 2) / 0.5);
      } else if (overdueRatio >= 2.5) {
        overdueFactor = overdueRatio < 3.5 ? 0.2 : 0.05; // deep gan penalty
      }

      // Momentum factor from trend
      const tr = trendMap.get(num);
      const momentumFactor = tr ? (tr.slope + 1) / 2 : 0.5; // normalize -1..1 to 0..1

      const score =
        0.3 * freqFactor + 0.5 * overdueFactor + 0.2 * momentumFactor;

      let confidence: 'high' | 'medium' | 'low' = 'low';
      if (score > 0.7) confidence = 'high';
      else if (score > 0.5) confidence = 'medium';

      // Build reasoning in Vietnamese
      const reasons: string[] = [];
      if (freqFactor > 0.7) reasons.push('tan suat cao');
      if (overdueRatio >= 1.0)
        reasons.push(`gan ${Math.round(overdueRatio * 100)}%`);
      if (tr?.trend === 'up') reasons.push('xu huong tang');
      if (tr?.trend === 'down') reasons.push('xu huong giam');

      predictions.push({
        number: num,
        score: Math.round(score * 1000) / 1000,
        confidence,
        frequencyFactor: Math.round(freqFactor * 1000) / 1000,
        overdueFactor: Math.round(overdueFactor * 1000) / 1000,
        trendFactor: Math.round(momentumFactor * 1000) / 1000,
        reasoning:
          reasons.length > 0 ? reasons.join(', ') : 'khong co yeu to dac biet',
      });
    }

    return predictions.sort((a, b) => b.score - a.score).slice(0, topN);
  }

  // --- Private helpers ---

  private async getFrequencyWindow(
    window: number,
  ): Promise<Map<string, number>> {
    const draws = await this.lotteryResultRepo.find({
      relations: ['numbers'],
      order: { date: 'DESC' },
      take: window,
    });

    const freqMap = new Map<string, number>();
    for (const draw of draws) {
      for (const num of draw.numbers) {
        const loto = num.value.slice(-2);
        freqMap.set(loto, (freqMap.get(loto) ?? 0) + 1);
      }
    }
    return freqMap;
  }

  private pearsonCorrelation(
    x: number[],
    y: number[],
    n: number,
  ): {
    r: number;
    coCount: number;
    coPct: number;
  } {
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.reduce((a, b) => a + b * b, 0);
    const sumY2 = y.reduce((a, b) => a + b * b, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
    );

    const r = denominator === 0 ? 0 : numerator / denominator;

    // Co-occurrence count
    const coCount = x.reduce(
      (acc, xi, i) => acc + (xi === 1 && y[i] === 1 ? 1 : 0),
      0,
    );
    const coPct = (n > 0 ? coCount / n : 0) * 100;

    return { r, coCount, coPct };
  }
}
