import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../identity/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  tokenId!: string;

  @Column({ type: 'text' })
  token!: string;

  @CreateDateColumn({ name: 'create_at' })
  createAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'is_revoked', default: false })
  isRevoked!: boolean;

  @Column({ name: 'revoked_date', type: 'timestamp', nullable: true })
  revokedDate?: Date;

  @ManyToOne(() => User, (user) => user.refreshTokens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  revoke(): void {
    this.isRevoked = true;
    this.revokedDate = new Date();
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return !this.isRevoked && !this.isExpired();
  }
}
