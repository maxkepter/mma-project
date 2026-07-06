import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { LotteryNumber } from './lottery-number.entity';

@Entity('lottery_results')
export class LotteryResult {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'date' })
  date!: Date;

  @Column()
  source!: string;

  @Column()
  region!: string;

  @OneToMany(() => LotteryNumber, (number) => number.lotteryResult, {
    cascade: true,
  })
  numbers!: LotteryNumber[];
}
