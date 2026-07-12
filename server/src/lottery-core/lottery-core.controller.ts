import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Public } from '../auth/decorators/public.decorator';
import { LotteryResult } from './entities/lottery-result.entity';
import { PrizeLevel } from './entities/prize-level.enum';
import { LotteryResultDetailDto, PrizeGroupDto } from './dto/lottery.dto';

const PRIZE_ORDER: PrizeLevel[] = [
  PrizeLevel.Special,
  PrizeLevel.First,
  PrizeLevel.Second,
  PrizeLevel.Third,
  PrizeLevel.Fourth,
  PrizeLevel.Fifth,
  PrizeLevel.Sixth,
  PrizeLevel.Seventh,
];

// Helper: ISO yyyy-mm-dd from a Date (UTC-normalized to avoid TZ drift)
function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function groupPrizes(
  result: LotteryResult,
  order: PrizeLevel[],
): PrizeGroupDto[] {
  return order
    .map((level) => ({
      prizeLevel: level,
      values: result.numbers
        .filter((n) => n.prizeLevel === level)
        .sort((a, b) => a.position - b.position)
        .map((n) => n.value),
    }))
    .filter((g) => g.values.length > 0);
}

// XSMB results are public information — historical lottery draws are not user-specific.
// R1: JwtAuthGuard is registered globally via APP_GUARD; do NOT re-declare it here.
@Controller('lottery')
export class LotteryCoreController {
  constructor(
    @InjectRepository(LotteryResult)
    private readonly resultRepo: Repository<LotteryResult>,
  ) {}

  @Public()
  @Get('latest')
  async getLatest(): Promise<LotteryResultDetailDto> {
    const result = await this.resultRepo.findOne({
      where: { region: 'North' },
      order: { date: 'DESC' },
      relations: ['numbers'],
    });
    if (!result) {
      throw new NotFoundException('No lottery results available');
    }
    return this.toDetail(result);
  }

  @Public()
  @Get('by-date/:date')
  async getByDate(
    @Param('date') date: string,
  ): Promise<LotteryResultDetailDto> {
    // Accept yyyy-mm-dd only — reject malformed input before hitting the DB.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new NotFoundException('Invalid date format. Expected yyyy-mm-dd');
    }
    const result = await this.resultRepo.findOne({
      where: { region: 'North', date: new Date(date) },
      relations: ['numbers'],
    });
    if (!result) {
      throw new NotFoundException(`No lottery result for ${date}`);
    }
    return this.toDetail(result);
  }

  private toDetail(result: LotteryResult): LotteryResultDetailDto {
    return {
      id: result.id,
      date: isoDate(new Date(result.date)),
      region: result.region,
      source: result.source,
      prizes: groupPrizes(result, PRIZE_ORDER),
    };
  }
}
