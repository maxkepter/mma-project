import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../identity/entities/user.entity';
import { BetStatus } from './bet-status.enum';
import { BetResult } from './bet-result.entity';

@Entity('bet_entries')
export class BetEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  number!: string;

  @Column({ type: 'float' })
  amount!: number;

  @Column({ type: 'date' })
  betDate!: Date;

  @Column()
  userId!: string;

  @Column({ type: 'enum', enum: BetStatus, default: BetStatus.Pending })
  status!: BetStatus;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @OneToOne(() => BetResult, (result) => result.betEntry, { cascade: true, nullable: true })
  @JoinColumn()
  result?: BetResult;
}
