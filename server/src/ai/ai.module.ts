import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIInsight } from './entities/ai-insight.entity';
import { ChatConversation } from './entities/chat-conversation.entity';
import { ChatMessage } from './entities/chat-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AIInsight, ChatConversation, ChatMessage]),
  ],
  exports: [TypeOrmModule],
})
export class AiModule {}
