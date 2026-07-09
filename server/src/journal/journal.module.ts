import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JournalService } from './journal.service';
import { JournalProcessor } from './services/journal.processor';
import { JournalController } from './journal.controller';
import { LotteryCoreModule } from '../lottery-core/lottery-core.module';
import { BetEntry } from './entities/bet-entry.entity';
import { BetResult } from './entities/bet-result.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BetEntry, BetResult]), LotteryCoreModule],
  providers: [JournalService, JournalProcessor],
  controllers: [JournalController],
  exports: [TypeOrmModule, JournalService],
})
export class JournalModule {}
