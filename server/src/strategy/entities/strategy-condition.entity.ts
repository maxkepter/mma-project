import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Strategy } from './strategy.entity';

@Entity('strategy_conditions')
export class StrategyCondition {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  type!: string;

  @Column({ type: 'jsonb' })
  parameters!: Record<string, any>;

  @ManyToOne(() => Strategy, (strategy) => strategy.conditions, { onDelete: 'CASCADE' })
  strategy!: Strategy;
}
