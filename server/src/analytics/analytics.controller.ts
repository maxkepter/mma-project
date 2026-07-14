import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import {
  AnalyticsQueryDto,
  PredictionQueryDto,
} from './dto/analytics-query.dto';
import { Public } from '../auth/decorators/public.decorator';
import {
  TrendItemDto,
  CycleItemDto,
  CorrelationItemDto,
  PredictionItemDto,
} from './dto/analytics-response.dto';

// Analytics endpoints expose aggregated lottery analysis (trend/cycle/correlation/predictions).
// All are public: they do not require authentication and do not return user-specific data.
// R1: JwtAuthGuard is registered globally via APP_GUARD; do NOT re-declare it here.
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Get('trend')
  async getTrend(@Query() query: AnalyticsQueryDto): Promise<TrendItemDto[]> {
    return this.analyticsService.getTrend(query.limit);
  }

  @Public()
  @Get('cycle')
  async getCycle(@Query() query: AnalyticsQueryDto): Promise<CycleItemDto[]> {
    return this.analyticsService.getCycle(query.limit);
  }

  @Public()
  @Get('correlation')
  async getCorrelation(
    @Query() query: AnalyticsQueryDto,
  ): Promise<CorrelationItemDto[]> {
    return this.analyticsService.getCorrelation(query.limit);
  }

  @Public()
  @Get('predictions')
  async getPredictions(
    @Query() query: PredictionQueryDto,
  ): Promise<PredictionItemDto[]> {
    return this.analyticsService.getPredictions(query.topN);
  }
}
