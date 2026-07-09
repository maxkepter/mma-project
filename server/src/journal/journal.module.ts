import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BetEntry } from './entities/bet-entry.entity';
import { BetResult } from './entities/bet-result.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BetEntry, BetResult])],
  exports: [TypeOrmModule, TypeOrmModule.forFeature([BetEntry, BetResult])],
})
export class JournalModule {}
