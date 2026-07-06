import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { LotteryCoreModule } from '../lottery-core/lottery-core.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [LotteryCoreModule, AuthModule],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
