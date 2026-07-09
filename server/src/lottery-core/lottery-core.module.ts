import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LotteryResult } from './entities/lottery-result.entity';
import { LotteryNumber } from './entities/lottery-number.entity';
import { LotteryCoreService } from './services/lottery-core.service';

@Module({
  imports: [TypeOrmModule.forFeature([LotteryResult, LotteryNumber])],
  providers: [LotteryCoreService],
  exports: [TypeOrmModule, LotteryCoreService],
})
export class LotteryCoreModule {}
