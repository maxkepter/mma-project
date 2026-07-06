import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  username!: string;

  @Column()
  hashPassword!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  displayName!: string;

  @CreateDateColumn()
  createAt!: Date;
}
