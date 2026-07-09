import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIInsight } from './entities/ai-insight.entity';
import { ChatConversation } from './entities/chat-conversation.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { AIController } from './ai.controller';
import { AIInsightService } from './services/ai-insight.service';
import { StatisticsModule } from '../statistics/statistics.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AuthModule } from '../auth/auth.module';
import { StrategyModule } from '../strategy/strategy.module';
import { JournalModule } from '../journal/journal.module';
import { NewsModule } from '../news/news.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AIInsight, ChatConversation, ChatMessage]),
    StatisticsModule,
    AnalyticsModule,
    AuthModule,
    StrategyModule,
    JournalModule,
    NewsModule,
  ],
  controllers: [AIController],
  providers: [AIInsightService],
  exports: [TypeOrmModule, AIInsightService],
})
export class AiModule {}
