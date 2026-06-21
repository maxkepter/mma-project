import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LotteryResult } from './entities/lottery-result.entity';
import { LotteryNumber } from './entities/lottery-number.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LotteryResult, LotteryNumber])],
  exports: [TypeOrmModule],
})
export class LotteryCoreModule {}
