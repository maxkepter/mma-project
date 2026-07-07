import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Strategy } from './entities/strategy.entity';
import { StrategyCondition } from './entities/strategy-condition.entity';
import { BacktestRun } from './entities/backtest-run.entity';
import { LotteryCoreModule } from '../lottery-core/lottery-core.module';
import { StrategyService } from './strategy.service';
import { StrategyController } from './strategy.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Strategy, StrategyCondition, BacktestRun]),
    LotteryCoreModule,
  ],
  providers: [StrategyService],
  controllers: [StrategyController],
  exports: [TypeOrmModule, StrategyService],
})
export class StrategyModule {}
