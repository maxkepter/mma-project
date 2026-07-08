import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BetEntry } from './entities/bet-entry.entity';
import { BetStatus } from './entities/bet-status.enum';
import { CreateBetDto } from './dto/create-bet.dto';

@Injectable()
export class JournalService {
  constructor(
    @InjectRepository(BetEntry)
    private readonly betEntryRepository: Repository<BetEntry>,
  ) {}

  async createBet(userId: string, dto: CreateBetDto) {
    const bet = this.betEntryRepository.create({
      userId,
      number: dto.number,
      amount: dto.amount,
      betDate: new Date(dto.betDate),
      status: BetStatus.Pending,
    });
    return this.betEntryRepository.save(bet);
  }

  async getPortfolio(userId: string) {
    const pendingBets = await this.betEntryRepository.find({
      where: { userId, status: BetStatus.Pending },
      order: { betDate: 'DESC' },
    });

    const totalInvestment = pendingBets.reduce(
      (sum, bet) => sum + bet.amount,
      0,
    );

    return {
      totalInvestment,
      bets: pendingBets,
    };
  }

  async getHistory(userId: string) {
    const historyBets = await this.betEntryRepository.find({
      where: [
        { userId, status: BetStatus.Won },
        { userId, status: BetStatus.Lost },
      ],
      relations: ['result'],
      order: { betDate: 'DESC' },
    });

    const totalPayout = historyBets.reduce(
      (sum, bet) => sum + (bet.result?.payout || 0),
      0,
    );
    const totalSpent = historyBets.reduce((sum, bet) => sum + bet.amount, 0);

    return {
      totalSpent,
      totalPayout,
      profit: totalPayout - totalSpent,
      bets: historyBets,
    };
  }

  async cancelBet(userId: string, id: string) {
    const bet = await this.betEntryRepository.findOne({
      where: { id, userId },
    });

    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    if (bet.status !== BetStatus.Pending) {
      throw new Error('Cannot cancel a completed bet');
    }

    await this.betEntryRepository.remove(bet);
    return { success: true };
  }
}
