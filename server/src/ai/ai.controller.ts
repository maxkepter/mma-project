import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AIInsightService } from './services/ai-insight.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(private readonly insightService: AIInsightService) {}

  @Get('insights')
  async getInsights(@Query('limit') limit?: string) {
    return this.insightService.getInsights(limit ? parseInt(limit, 10) : 10);
  }

  @Get('insights/latest')
  async getLatestInsight() {
    return this.insightService.getLatestInsight();
  }

  @Get('insights/daily')
  async getDailyInsights(@Query('days') days?: string) {
    return this.insightService.getDailyInsights(days ? parseInt(days, 10) : 7);
  }
}
