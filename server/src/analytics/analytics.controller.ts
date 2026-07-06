import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import {
  AnalyticsQueryDto,
  PredictionQueryDto,
} from './dto/analytics-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  TrendItemDto,
  CycleItemDto,
  CorrelationItemDto,
  PredictionItemDto,
} from './dto/analytics-response.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('trend')
  async getTrend(@Query() query: AnalyticsQueryDto): Promise<TrendItemDto[]> {
    return this.analyticsService.getTrend(query.limit);
  }

  @Get('cycle')
  async getCycle(@Query() query: AnalyticsQueryDto): Promise<CycleItemDto[]> {
    return this.analyticsService.getCycle(query.limit);
  }

  @Get('correlation')
  async getCorrelation(
    @Query() query: AnalyticsQueryDto,
  ): Promise<CorrelationItemDto[]> {
    return this.analyticsService.getCorrelation(query.limit);
  }

  @Get('predictions')
  async getPredictions(
    @Query() query: PredictionQueryDto,
  ): Promise<PredictionItemDto[]> {
    return this.analyticsService.getPredictions(query.topN);
  }
}
