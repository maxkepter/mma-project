import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { User } from '../identity/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existingUser = await this.userRepository.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    });

    if (existingUser) {
      throw new BadRequestException('Username or email already exists');
    }

    const hashPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      username: dto.username,
      email: dto.email,
      displayName: dto.displayName,
      hashPassword,
    });

    await this.userRepository.save(user);

    return { message: 'Registration successful' };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { username: dto.username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.hashPassword,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refreshTokens(refreshToken: string) {
    let payload: { sub: string; jti: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
      });
    } catch {
      throw new UnauthorizedException('Access Denied');
    }

    const tokenId = payload.jti;
    const userId = payload.sub;

    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { tokenId, userId },
    });

    if (!tokenRecord || !tokenRecord.isValid()) {
      throw new UnauthorizedException('Access Denied');
    }

    const tokenMatches = await bcrypt.compare(refreshToken, tokenRecord.token);

    if (!tokenMatches) {
      throw new UnauthorizedException('Access Denied');
    }

    // Rotate: revoke old token, then issue new pair
    tokenRecord.revoke();
    await this.refreshTokenRepository.save(tokenRecord);

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('Access Denied');
    }

    return this.generateTokens(user);
  }

  async logout(userId: string) {
    const activeTokens = await this.refreshTokenRepository.find({
      where: { userId, isRevoked: false },
    });

    for (const token of activeTokens) {
      token.revoke();
    }

    if (activeTokens.length > 0) {
      await this.refreshTokenRepository.save(activeTokens);
    }

    return { message: 'Logout successful' };
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
    };

    const tokenId = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET || 'fallback-access-secret',
        expiresIn: (process.env.JWT_ACCESS_EXPIRATION ?? '15m') as any,
      }),

      this.jwtService.signAsync(
        { ...payload, jti: tokenId },
        {
          secret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
          expiresIn: (process.env.JWT_REFRESH_EXPIRATION ?? '7d') as any,
        },
      ),
    ]);

    await this.saveRefreshToken(user.id, tokenId, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: payload,
    };
  }

  private async saveRefreshToken(
    userId: string,
    tokenId: string,
    token: string,
  ) {
    const decoded: JwtPayload = this.jwtService.decode(token);
    const expiresAt = new Date((decoded.exp ?? 0) * 1000);
    const hashedToken = await bcrypt.hash(token, 10);

    const refreshTokenEntity = this.refreshTokenRepository.create({
      tokenId,
      token: hashedToken,
      userId,
      expiresAt,
      isRevoked: false,
    });

    await this.refreshTokenRepository.save(refreshTokenEntity);
  }
}
