import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Strategy } from './entities/strategy.entity';
import { StrategyCondition } from './entities/strategy-condition.entity';
import { BacktestRun } from './entities/backtest-run.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Strategy, StrategyCondition, BacktestRun])],
  exports: [TypeOrmModule],
})
export class StrategyModule {}
