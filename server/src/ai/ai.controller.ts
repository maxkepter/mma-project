import { Controller, Get, Post, Query, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { AIInsightService } from './services/ai-insight.service';
import type { GenerateInsightDto } from './services/ai-insight.service';
import { Public } from '../auth/decorators/public.decorator';
import { ChatAssistantDto } from './dto/chat-assistant.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';

@Controller('ai')
export class AIController {
  constructor(private readonly insightService: AIInsightService) {}

  @Get('insights')
  @Public()
  async getInsights(@Query('limit') limit?: string) {
    return this.insightService.getInsights(limit ? parseInt(limit, 10) : 10);
  }

  @Get('insights/latest')
  @Public()
  async getLatestInsight() {
    return this.insightService.getLatestInsight();
  }

  @Get('insights/daily')
  @Public()
  async getDailyInsights(@Query('days') days?: string) {
    return this.insightService.getDailyInsights(days ? parseInt(days, 10) : 7);
  }

  @Post('insights/generate')
  @Public()
  async generateInsight(@Body() dto: GenerateInsightDto) {
    return this.insightService.generateInsight(dto);
  }

  @Post('chat-assistant')
  async chatAssistant(@CurrentUser() user: JwtPayload, @Body() dto: ChatAssistantDto) {
    return this.insightService.chatAssistant(user.sub, dto);
  }

  @Get('conversations')
  async getConversations(@CurrentUser() user: JwtPayload) {
    return this.insightService.getConversations(user.sub);
  }

  @Get('conversations/:id/messages')
  async getConversationMessages(@CurrentUser() user: JwtPayload, @Param('id') conversationId: string) {
    return this.insightService.getConversationMessages(user.sub, conversationId);
  }

  @Delete('conversations/:id')
  async deleteConversation(@CurrentUser() user: JwtPayload, @Param('id') conversationId: string) {
    return this.insightService.deleteConversation(user.sub, conversationId);
  }
}
