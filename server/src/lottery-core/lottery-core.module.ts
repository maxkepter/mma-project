import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LotteryResult } from './entities/lottery-result.entity';
import { LotteryNumber } from './entities/lottery-number.entity';
import { LotteryCoreService } from './services/lottery-core.service';
import { LotteryCoreController } from './lottery-core.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LotteryResult, LotteryNumber])],
  controllers: [LotteryCoreController],
  providers: [LotteryCoreService],
  exports: [TypeOrmModule, LotteryCoreService],
})
export class LotteryCoreModule {}
