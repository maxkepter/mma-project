import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LotteryResult } from '../entities/lottery-result.entity';
import { LotteryNumber } from '../entities/lottery-number.entity';
import { PrizeLevel } from '../entities/prize-level.enum';
import { DataService } from '../../jobs/data.processor';
import { LotteryResult as RawLotteryResult } from '../../identity/types/LotteryResult';

@Injectable()
export class LotteryCoreService implements OnApplicationBootstrap {
  private readonly dataService = new DataService();

  constructor(
    @InjectRepository(LotteryResult)
    private readonly resultRepo: Repository<LotteryResult>,
    @InjectRepository(LotteryNumber)
    private readonly numberRepo: Repository<LotteryNumber>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedLotteryData();
  }

  async seedLotteryData() {
    console.log('[LotteryCore] Checking for new lottery data from JSON...');
    try {
      try {
        // Cố gắng tải JSON mới nhất từ Github
        await this.dataService.dailyUpdate();
      } catch (dlError) {
        console.warn('[LotteryCore] Download failed (maybe rate limited), using existing local JSON file.', dlError.message);
      }
      const rawData = await this.dataService.getXsmbData();

      // Tìm ngày mới nhất trong DB
      const latestResult = await this.resultRepo.findOne({
        where: {},
        order: { date: 'DESC' },
      });
      const latestDate = latestResult ? new Date(latestResult.date).getTime() : 0;

      // Chỉ lấy những kết quả có ngày lớn hơn ngày mới nhất trong DB
      const newRawData = rawData.filter(r => new Date(r.date).getTime() > latestDate);

      if (newRawData.length === 0) {
        console.log(`[LotteryCore] Database is up to date. No new results to seed.`);
        return;
      }

      console.log(`[LotteryCore] Loaded ${newRawData.length} new results. Saving to database...`);

      // Seed in batches to avoid memory/query limits
      const batchSize = 100;
      for (let i = 0; i < newRawData.length; i += batchSize) {
        const batch = newRawData.slice(i, i + batchSize);
        const entities: LotteryResult[] = [];

        for (const raw of batch) {
          const result = new LotteryResult();
          result.date = new Date(raw.date);
          result.source = 'XSMB';
          result.region = 'North';
          result.numbers = [];

          // Map all prize fields to LotteryNumber entities
          this.addNumber(result, PrizeLevel.Special, raw.special.toString(), 0);
          this.addNumber(result, PrizeLevel.First, raw.prize1.toString(), 0);
          
          this.addNumber(result, PrizeLevel.Second, raw.prize2_1.toString(), 0);
          this.addNumber(result, PrizeLevel.Second, raw.prize2_2.toString(), 1);

          this.addNumber(result, PrizeLevel.Third, raw.prize3_1.toString(), 0);
          this.addNumber(result, PrizeLevel.Third, raw.prize3_2.toString(), 1);
          this.addNumber(result, PrizeLevel.Third, raw.prize3_3.toString(), 2);
          this.addNumber(result, PrizeLevel.Third, raw.prize3_4.toString(), 3);
          this.addNumber(result, PrizeLevel.Third, raw.prize3_5.toString(), 4);
          this.addNumber(result, PrizeLevel.Third, raw.prize3_6.toString(), 5);

          this.addNumber(result, PrizeLevel.Fourth, raw.prize4_1.toString(), 0);
          this.addNumber(result, PrizeLevel.Fourth, raw.prize4_2.toString(), 1);
          this.addNumber(result, PrizeLevel.Fourth, raw.prize4_3.toString(), 2);
          this.addNumber(result, PrizeLevel.Fourth, raw.prize4_4.toString(), 3);

          this.addNumber(result, PrizeLevel.Fifth, raw.prize5_1.toString(), 0);
          this.addNumber(result, PrizeLevel.Fifth, raw.prize5_2.toString(), 1);
          this.addNumber(result, PrizeLevel.Fifth, raw.prize5_3.toString(), 2);
          this.addNumber(result, PrizeLevel.Fifth, raw.prize5_4.toString(), 3);
          this.addNumber(result, PrizeLevel.Fifth, raw.prize5_5.toString(), 4);
          this.addNumber(result, PrizeLevel.Fifth, raw.prize5_6.toString(), 5);

          this.addNumber(result, PrizeLevel.Sixth, raw.prize6_1.toString(), 0);
          this.addNumber(result, PrizeLevel.Sixth, raw.prize6_2.toString(), 1);
          this.addNumber(result, PrizeLevel.Sixth, raw.prize6_3.toString(), 2);

          this.addNumber(result, PrizeLevel.Seventh, raw.prize7_1.toString(), 0);
          this.addNumber(result, PrizeLevel.Seventh, raw.prize7_2.toString(), 1);
          this.addNumber(result, PrizeLevel.Seventh, raw.prize7_3.toString(), 2);
          this.addNumber(result, PrizeLevel.Seventh, raw.prize7_4.toString(), 3);

          entities.push(result);
        }

        await this.resultRepo.save(entities);
        console.log(`[LotteryCore] Seeded batch ${i / batchSize + 1}/${Math.ceil(newRawData.length / batchSize)}`);
      }

      console.log('[LotteryCore] Seeding completed successfully.');
    } catch (error) {
      console.error('[LotteryCore] Failed to seed lottery data:', error);
    }
  }

  private addNumber(result: LotteryResult, prizeLevel: PrizeLevel, value: string, position: number) {
    const num = new LotteryNumber();
    num.prizeLevel = prizeLevel;
    num.value = value;
    num.position = position;
    num.lotteryResult = result;
    result.numbers.push(num);
  }
}
