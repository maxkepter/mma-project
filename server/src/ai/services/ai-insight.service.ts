import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIInsight } from '../entities/ai-insight.entity';
import { StatisticsService } from '../../statistics/statistics.service';
import { AnalyticsService } from '../../analytics/analytics.service';
import axios from 'axios';

export interface GenerateInsightDto {
  targetDate?: string;
  region?: string;
}

export interface AIInsightResponse {
  id: string;
  content: string;
  confidenceScore: number;
  createdAt: Date;
}

@Injectable()
export class AIInsightService {
  constructor(
    @InjectRepository(AIInsight)
    private readonly insightRepo: Repository<AIInsight>,
    private readonly statisticsService: StatisticsService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  /**
   * UC-11: Nhan phan tich AI
   * Lay thong ke hot numbers, gan, chu ky, prediction tu Statistics/Analytics,
   * gui sang Python AI service de sinh nhan dinh tieng Viet.
   */
  async generateInsight(dto: GenerateInsightDto): Promise<AIInsightResponse> {
    const [frequency, gan, predictions] = await Promise.all([
      this.statisticsService.getFrequency(100),
      this.statisticsService.getGan(1000),
      this.analyticsService.getPredictions(10),
    ]);

    // Top hot numbers (frequency)
    const hotNumbers = frequency.slice(0, 10).map((f) => ({
      number: f.number,
      count: f.count,
    }));

    // Top overdue numbers
    const overdueNumbers = gan
      .filter((g) => g.currentGan > 10)
      .sort((a, b) => b.currentGan - a.currentGan)
      .slice(0, 10)
      .map((g) => ({
        number: g.number,
        currentGan: g.currentGan,
      }));

    // Top predictions
    const topPredictions = predictions.map((p) => ({
      number: p.number,
      score: p.score,
      confidence: p.confidence,
    }));

    // Build prompt payload
    const payload = {
      hotNumbers,
      overdueNumbers,
      predictions: topPredictions,
      targetDate: dto.targetDate ?? new Date().toISOString().split('T')[0],
    };

    let content = '';
    let confidenceScore = 0.5;

    const aiServiceUrl = process.env.AI_SERVICE_URL;
    if (aiServiceUrl) {
      try {
        const response = await axios.post(
          `${aiServiceUrl}/analyze`,
          {
            data: JSON.stringify(payload),
            context:
              'Hay dong vai la mot chuyen gia phan tich xo so chuyen nghiep. Dua ra nhan dinh chi tiet bang tieng Viet.',
          },
          { timeout: 30000 },
        );
        content =
          response.data?.result ??
          response.data?.content ??
          JSON.stringify(response.data);
        confidenceScore = response.data?.confidence ?? 0.8;
      } catch {
        content = this.generateFallbackInsight(payload);
        confidenceScore = 0.4;
      }
    } else {
      content = this.generateFallbackInsight(payload);
      confidenceScore = 0.5;
    }

    const insight = this.insightRepo.create({
      content,
      confidenceScore,
    });
    const saved = await this.insightRepo.save(insight);

    return {
      id: saved.id,
      content: saved.content,
      confidenceScore: saved.confidenceScore,
      createdAt: saved.createdAt,
    };
  }

  async getInsights(limit: number = 10): Promise<AIInsightResponse[]> {
    const insights = await this.insightRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return insights.map((i) => ({
      id: i.id,
      content: i.content,
      confidenceScore: i.confidenceScore,
      createdAt: i.createdAt,
    }));
  }

  async getLatestInsight(): Promise<AIInsightResponse | null> {
    const insight = await this.insightRepo.findOne({
      order: { createdAt: 'DESC' },
    });
    if (!insight) return null;
    return {
      id: insight.id,
      content: insight.content,
      confidenceScore: insight.confidenceScore,
      createdAt: insight.createdAt,
    };
  }

  private generateFallbackInsight(payload: {
    hotNumbers: { number: string; count: number }[];
    overdueNumbers: { number: string; currentGan: number }[];
    predictions: { number: string; score: number; confidence: string }[];
    targetDate: string;
  }): string {
    const { hotNumbers, overdueNumbers, predictions, targetDate } = payload;
    const lines: string[] = [];
    lines.push(`Phan tich xo so ngay ${targetDate}:`);
    lines.push(`- Cac so nhieu: ${hotNumbers.map((n) => n.number).join(', ')}`);
    lines.push(
      `- Cac so gan: ${overdueNumbers.map((n) => `${n.number}(${n.currentGan} ngay)`).join(', ')}`,
    );
    lines.push(
      `- Du bao: ${predictions.map((p) => `${p.number}(${p.confidence})`).join(', ')}`,
    );
    lines.push('');
    lines.push('Luu y: Day la phan tich co so, khong dam bao chinh xac.');
    return lines.join('\n');
  }
}
