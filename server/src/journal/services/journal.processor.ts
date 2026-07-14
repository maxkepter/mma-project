import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { BetEntry } from '../entities/bet-entry.entity';
import { BetResult } from '../entities/bet-result.entity';
import { BetStatus } from '../entities/bet-status.enum';
import { LotteryResult } from '../../lottery-core/entities/lottery-result.entity';

@Injectable()
export class JournalProcessor {
  private readonly logger = new Logger(JournalProcessor.name);

  constructor(
    @InjectRepository(BetEntry)
    private readonly betEntryRepository: Repository<BetEntry>,
    @InjectRepository(LotteryResult)
    private readonly lotteryResultRepository: Repository<LotteryResult>,
    @InjectRepository(BetResult)
    private readonly betResultRepository: Repository<BetResult>,
  ) {}

  @Cron('35 18 * * *', {
    name: 'daily-bet-processor',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async processDailyBets() {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const pendingBets = await this.betEntryRepository.find({
      where: {
        status: BetStatus.Pending,
        betDate: LessThanOrEqual(today),
      },
    });

    if (pendingBets.length === 0) {
      this.logger.log('not found any pending bets.');
      return;
    }

    this.logger.log(`found ${pendingBets.length} pending bets to process.`);

    const dates = [
      ...new Set(
        pendingBets.map((b) => new Date(b.betDate).toISOString().split('T')[0]),
      ),
    ];
    const resultsMap = new Map<string, LotteryResult>();

    for (const dateStr of dates) {
      const date = new Date(dateStr);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const lottoResult = await this.lotteryResultRepository.findOne({
        where: {
          date: LessThanOrEqual(endOfDay),
        },
        relations: ['numbers'],
        order: { date: 'DESC' },
      });

      if (
        lottoResult &&
        new Date(lottoResult.date) >= startOfDay &&
        new Date(lottoResult.date) <= endOfDay
      ) {
        resultsMap.set(dateStr, lottoResult);
      }
    }

    let processedCount = 0;
    for (const bet of pendingBets) {
      const dateStr = new Date(bet.betDate).toISOString().split('T')[0];
      const lottoResult = resultsMap.get(dateStr);

      if (
        !lottoResult ||
        !lottoResult.numbers ||
        lottoResult.numbers.length === 0
      ) {
        continue;
      }

      await this.processSingleBet(bet, lottoResult);
      processedCount++;
    }

    this.logger.log(
      `found ${processedCount}/${pendingBets.length} pending bets processed.`,
    );
  }

  private async processSingleBet(bet: BetEntry, lottoResult: LotteryResult) {
    let isWin = false;
    let payout = 0;
    let actualNumber = '';

    const all2Digits = lottoResult.numbers.map((n) => n.value.slice(-2));
    const specialNumberRaw = lottoResult.numbers.find(
      (n) => n.prizeLevel === 'Special',
    );
    const special2Digits = specialNumberRaw
      ? specialNumberRaw.value.slice(-2)
      : null;

    const hits = all2Digits.filter((n) => n === bet.number).length;
    if (hits > 0) {
      isWin = true;
      const points = bet.amount / 23000;
      payout = points * 80000 * hits;
      actualNumber = `${bet.number} (${hits} nháy)`;
    }

    if (!isWin) {
      actualNumber = special2Digits || 'no special number';
    }

    const result = this.betResultRepository.create({
      actualNumber,
      isWin,
      payout,
      betEntry: bet,
    });

    await this.betResultRepository.save(result);

    bet.status = isWin ? BetStatus.Won : BetStatus.Lost;
    bet.result = result;
    await this.betEntryRepository.save(bet);
  }
}
