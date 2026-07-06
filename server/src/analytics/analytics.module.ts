import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { StatisticsModule } from '../statistics/statistics.module';
import { LotteryCoreModule } from '../lottery-core/lottery-core.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [StatisticsModule, LotteryCoreModule, AuthModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
