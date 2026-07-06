import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../identity/entities/user.entity';
import { StrategyCondition } from './strategy-condition.entity';
import { BacktestRun } from './backtest-run.entity';

@Entity('strategies')
export class Strategy {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column()
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @OneToMany(() => StrategyCondition, (condition) => condition.strategy, {
    cascade: true,
  })
  conditions!: StrategyCondition[];

  @OneToMany(() => BacktestRun, (run) => run.strategy, { cascade: true })
  backtestRuns!: BacktestRun[];
}
