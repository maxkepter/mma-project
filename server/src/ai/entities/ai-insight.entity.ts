import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('ai_insights')
export class AIInsight {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'float' })
  confidenceScore!: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  targetDate?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
