import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Strategy } from './strategy.entity';

@Entity('strategy_conditions')
export class StrategyCondition {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  type!: string;

  @Column({ nullable: true, type: 'varchar' })
  field?: string;

  @Column({ nullable: true, type: 'varchar' })
  operator?: string;

  /** Stored as JSON string for portability */
  @Column({ nullable: true, type: 'jsonb' })
  value?: any;

  /** 'AND' | 'OR' — only meaningful for non-first conditions */
  @Column({ nullable: true, type: 'varchar' })
  logic?: string;

  /** Kept for legacy / raw passthrough */
  @Column({ nullable: true, type: 'jsonb' })
  parameters?: Record<string, any>;

  @ManyToOne(() => Strategy, (strategy) => strategy.conditions, {
    onDelete: 'CASCADE',
  })
  strategy!: Strategy;
}
