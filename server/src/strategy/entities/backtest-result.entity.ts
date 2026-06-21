import { Column } from 'typeorm';

export class BacktestResult {
  @Column({ default: 0 })
  totalBets!: number;

  @Column({ default: 0 })
  wonBets!: number;

  @Column({ default: 0 })
  lostBets!: number;

  @Column({ type: 'float', default: 0 })
  totalProfit!: number;
}
