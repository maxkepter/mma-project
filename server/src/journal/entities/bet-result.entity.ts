import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { BetEntry } from './bet-entry.entity';

@Entity('bet_results')
export class BetResult {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  actualNumber!: string;

  @Column()
  isWin!: boolean;

  @Column({ type: 'float', default: 0 })
  payout!: number;

  @OneToOne(() => BetEntry, (entry) => entry.result)
  betEntry!: BetEntry;
}
