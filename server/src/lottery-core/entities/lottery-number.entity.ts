import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { PrizeLevel } from './prize-level.enum';
import { LotteryResult } from './lottery-result.entity';

@Entity('lottery_numbers')
export class LotteryNumber {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: PrizeLevel })
  prizeLevel!: PrizeLevel;

  @Column()
  value!: string;

  @Column()
  position!: number;

  @ManyToOne(() => LotteryResult, (result) => result.numbers, {
    onDelete: 'CASCADE',
  })
  lotteryResult!: LotteryResult;
}
