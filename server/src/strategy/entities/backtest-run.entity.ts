import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { BacktestResult } from './backtest-result.entity';
import { Strategy } from './strategy.entity';

@Entity('backtest_runs')
export class BacktestRun {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date' })
  endDate!: Date;

  @Column({ type: 'float', default: 0 })
  winRate!: number;

  @Column({ type: 'float', default: 0 })
  profit!: number;

  @Column(() => BacktestResult)
  result!: BacktestResult;

  @ManyToOne(() => Strategy, (strategy) => strategy.backtestRuns, { onDelete: 'CASCADE' })
  strategy!: Strategy;
}
