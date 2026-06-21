import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Gender } from './gender.enum';

@Entity('death_records')
export class DeathRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  age!: number;

  @Column({ type: 'enum', enum: Gender })
  gender!: Gender;

  @Column({ type: 'date' })
  birthDate!: Date;

  @Column({ type: 'date' })
  deathDate!: Date;

  @Column({ type: 'text' })
  causeOfDeath!: string;

  @Column()
  source!: string;
}
