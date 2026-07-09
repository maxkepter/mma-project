import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { AIInsight } from '../entities/ai-insight.entity';
import { ChatConversation } from '../entities/chat-conversation.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { Strategy } from '../../strategy/entities/strategy.entity';
import { BetEntry } from '../../journal/entities/bet-entry.entity';
import { NewsArticle } from '../../news/entities/news-article.entity';
import { StatisticsService } from '../../statistics/statistics.service';
import { AnalyticsService } from '../../analytics/analytics.service';
import { ChatAssistantDto } from '../dto/chat-assistant.dto';
import axios from 'axios';

export interface GenerateInsightDto {
  targetDate?: string;
  region?: string;
}

export interface AIInsightResponse {
  id: string;
  content: string;
  confidenceScore: number;
  createdAt: Date;
  targetDate?: string;
}

@Injectable()
export class AIInsightService {
  constructor(
    @InjectRepository(AIInsight)
    private readonly insightRepo: Repository<AIInsight>,
    @InjectRepository(ChatConversation)
    private readonly conversationRepo: Repository<ChatConversation>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
    @InjectRepository(Strategy)
    private readonly strategyRepo: Repository<Strategy>,
    @InjectRepository(BetEntry)
    private readonly betEntryRepo: Repository<BetEntry>,
    @InjectRepository(NewsArticle)
    private readonly newsRepo: Repository<NewsArticle>,
    private readonly statisticsService: StatisticsService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  /**
   * UC-11: Nhan phan tich AI
   * Lay thong ke hot numbers, gan, chu ky, prediction tu Statistics/Analytics,
   * gui sang Python AI service de sinh nhan dinh tieng Viet.
   */
  async generateInsight(dto: GenerateInsightDto): Promise<AIInsightResponse> {
    const targetDate = dto.targetDate ?? new Date().toISOString().split('T')[0];

    // Check if insight already exists for this targetDate to avoid duplicate calls
    const existingInsight = await this.insightRepo.findOne({
      where: { targetDate },
    });
    if (existingInsight) {
      return {
        id: existingInsight.id,
        content: existingInsight.content,
        confidenceScore: existingInsight.confidenceScore,
        createdAt: existingInsight.createdAt,
        targetDate: existingInsight.targetDate,
      };
    }

    const [frequency, gan, predictions] = await Promise.all([
      this.statisticsService.getFrequency(100),
      this.statisticsService.getGan(1000),
      this.analyticsService.getPredictions(10),
    ]);

    // Top hot numbers (frequency)
    const hotNumbers = frequency.slice(0, 10).map((f) => ({
      number: f.number,
      count: f.count,
    }));

    // Top overdue numbers
    const overdueNumbers = gan
      .filter((g) => g.currentGan > 10)
      .sort((a, b) => b.currentGan - a.currentGan)
      .slice(0, 10)
      .map((g) => ({
        number: g.number,
        currentGan: g.currentGan,
      }));

    // Top predictions
    const topPredictions = predictions.map((p) => ({
      number: p.number,
      score: p.score,
      confidence: p.confidence,
    }));

    // Build prompt payload
    const payload = {
      hotNumbers,
      overdueNumbers,
      predictions: topPredictions,
      targetDate,
    };

    let content = '';
    let confidenceScore = 0.5;
    let isFallback = false;

    const aiServiceUrl = process.env.AI_SERVICE_URL;
    if (aiServiceUrl) {
      try {
        const response = await axios.post(
          `${aiServiceUrl}/analyze`,
          {
            data: JSON.stringify(payload),
            context:
              'Hay dong vai la mot chuyen gia phan tich xo so chuyen nghiep. Dua ra nhan dinh chi tiet bang tieng Viet.',
          },
          { timeout: 30000 },
        );
        content =
          response.data?.result ??
          response.data?.content ??
          JSON.stringify(response.data);
        confidenceScore = response.data?.confidence ?? 0.8;
      } catch {
        content = this.generateFallbackInsight(payload);
        confidenceScore = 0.4;
        isFallback = true;
      }
    } else {
      content = this.generateFallbackInsight(payload);
      confidenceScore = 0.5;
      isFallback = true;
    }

    if (!isFallback) {
      const insight = this.insightRepo.create({
        content,
        confidenceScore,
        targetDate,
      });
      const saved = await this.insightRepo.save(insight);

      return {
        id: saved.id,
        content: saved.content,
        confidenceScore: saved.confidenceScore,
        createdAt: saved.createdAt,
        targetDate: saved.targetDate,
      };
    } else {
      // Don't save fallback to DB so the user can retry later
      return {
        id: `fallback-${Date.now()}`,
        content,
        confidenceScore,
        createdAt: new Date(),
        targetDate,
      };
    }
  }

  async getInsights(limit: number = 10): Promise<AIInsightResponse[]> {
    const insights = await this.insightRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return insights.map((i) => ({
      id: i.id,
      content: i.content,
      confidenceScore: i.confidenceScore,
      createdAt: i.createdAt,
      targetDate: i.targetDate,
    }));
  }

  async getLatestInsight(): Promise<AIInsightResponse | null> {
    const [insight] = await this.insightRepo.find({
      order: { createdAt: 'DESC' },
      take: 1,
    });
    if (!insight) return null;
    return {
      id: insight.id,
      content: insight.content,
      confidenceScore: insight.confidenceScore,
      createdAt: insight.createdAt,
      targetDate: insight.targetDate,
    };
  }

  async getDailyInsights(days: number = 7): Promise<AIInsightResponse[]> {
    const insights = await this.insightRepo.find({
      order: { targetDate: 'DESC', createdAt: 'DESC' },
      take: days,
    });
    return insights.map((i) => ({
      id: i.id,
      content: i.content,
      confidenceScore: i.confidenceScore,
      createdAt: i.createdAt,
      targetDate: i.targetDate,
    }));
  }

  @Cron('0 0 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  async handleDailyInsightCron() {
    // Backfill: dam bao 7 ngay gan nhat deu co insight
    await this.backfillMissingInsights(7);

    // Tao insight cho ngay moi (hom nay)
    const target = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }),
    );
    const today = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
    await this.generateInsight({ targetDate: today });
  }

  /**
   * Kiem tra trong N ngay gan nhat, ngay nao chua co insight thi tu dong tao.
   * Dam bao lich su insight luon day du khi sang ngay moi.
   */
  async backfillMissingInsights(days: number = 7): Promise<void> {
    const now = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }),
    );
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Lay tap targetDate da co insight
    const existing = await this.insightRepo
      .createQueryBuilder('i')
      .select('DISTINCT i.targetDate', 'targetDate')
      .where('i.targetDate IS NOT NULL')
      .getRawMany<{ targetDate: string }>();
    const existingDates = new Set(existing.map((e) => e.targetDate));

    // Liet ke N ngay gan nhat (tinh ca hom nay) theo mui gio VN
    const missing: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!existingDates.has(dateStr)) missing.push(dateStr);
    }

    // Tao insight cho cac ngay thieu (theo thu tu cu -> moi)
    missing.reverse();
    for (const dateStr of missing) {
      try {
        await this.generateInsight({ targetDate: dateStr });
        // Delay 15s to avoid Gemini Free Tier rate limit (15 RPM)
        await new Promise((resolve) => setTimeout(resolve, 15000));
      } catch {
        // Bo qua loi tung ngay de khong chan cac ngay sau
      }
    }

    if (missing.length) {
      console.log(
        `[AIInsight] Backfilled ${missing.length} ngay: ${missing.join(', ')} (today=${todayStr})`,
      );
    }
  }

  private generateFallbackInsight(payload: {
    hotNumbers: { number: string; count: number }[];
    overdueNumbers: { number: string; currentGan: number }[];
    predictions: { number: string; score: number; confidence: string }[];
    targetDate: string;
  }): string {
    const { hotNumbers, overdueNumbers, predictions, targetDate } = payload;
    const lines: string[] = [];
    lines.push(`Phan tich xo so ngay ${targetDate}:`);
    lines.push(`- Cac so nhieu: ${hotNumbers.map((n) => n.number).join(', ')}`);
    lines.push(
      `- Cac so gan: ${overdueNumbers.map((n) => `${n.number}(${n.currentGan} ngay)`).join(', ')}`,
    );
    lines.push(
      `- Du bao: ${predictions.map((p) => `${p.number}(${p.confidence})`).join(', ')}`,
    );
    lines.push('');
    lines.push('Luu y: Day la phan tich co so, khong dam bao chinh xac.');
    return lines.join('\n');
  }

  /**
   * UC-26: Trao đổi với AI Assistant
   * Thu thập ngữ cảnh (chiến lược, nhật ký, thống kê, tin tức) và gửi sang AI Service.
   */
  async chatAssistant(userId: string, dto: ChatAssistantDto) {
    let conversation: ChatConversation;
    let history: any[] = [];

    if (dto.conversationId) {
      const found = await this.conversationRepo.findOne({
        where: { id: dto.conversationId, userId },
      });
      if (!found) {
        throw new Error('Conversation not found');
      }
      conversation = found;
      // Force update the updatedAt timestamp in DB
      await this.conversationRepo.update(conversation.id, { updatedAt: new Date() });
      conversation.updatedAt = new Date();

      // Fetch last 6 messages for short-term memory
      const lastMessages = await this.messageRepo.find({
        where: { conversation: { id: dto.conversationId } },
        order: { id: 'DESC' },
        take: 6,
      });
      // Reverse to maintain chronological order
      lastMessages.reverse();
      history = lastMessages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: m.content,
      }));
    } else {
      conversation = this.conversationRepo.create({
        userId,
        chatType: 'assistant',
        title: dto.message.slice(0, 100) || 'Cuộc hội thoại mới',
      });
      conversation = await this.conversationRepo.save(conversation);
    }

    // Thu thập ngữ cảnh dựa trên từ khóa trong câu hỏi
    const lowerMsg = dto.message.toLowerCase();
    let contextData: any = {};

    if (lowerMsg.includes('chiến lược') || lowerMsg.includes('strategy')) {
      const strategies = await this.strategyRepo.find({
        where: { userId },
        relations: ['conditions', 'backtestRuns'],
        take: 5,
      });
      contextData.strategies = strategies.map((s) => ({
        name: s.name,
        description: s.description,
        conditions: s.conditions,
        backtestRuns: s.backtestRuns.slice(0, 3).map((r) => ({
          startDate: r.startDate,
          endDate: r.endDate,
          winRate: r.winRate,
          profit: r.profit,
        })),
      }));
    }

    if (lowerMsg.includes('nhật ký') || lowerMsg.includes('bet') || lowerMsg.includes('đánh')) {
      const bets = await this.betEntryRepo.find({
        where: { userId },
        relations: ['result'],
        order: { betDate: 'DESC' },
        take: 10,
      });
      contextData.bets = bets.map((b) => ({
        number: b.number,
        amount: b.amount,
        betDate: b.betDate,
        status: b.status,
        result: b.result,
      }));
    }

    if (lowerMsg.includes('thống kê') || lowerMsg.includes('tần suất') || lowerMsg.includes('gan')) {
      const [frequency, gan] = await Promise.all([
        this.statisticsService.getFrequency(30),
        this.statisticsService.getGan(100),
      ]);
      contextData.statistics = {
        topFrequency: frequency.slice(0, 5),
        topGan: gan.slice(0, 5),
      };
    }

    if (lowerMsg.includes('tin tức') || lowerMsg.includes('news')) {
      const news = await this.newsRepo.find({
        order: { publishDate: 'DESC' },
        take: 3,
      });
      contextData.news = news.map((n) => ({
        title: n.title,
        summary: n.summary,
      }));
    }

    // Lưu tin nhắn của user
    const userMsg = this.messageRepo.create({
      role: 'user',
      content: dto.message,
      conversation,
    });
    await this.messageRepo.save(userMsg);

    // Gửi sang AI Service
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    let aiReply = '';

    try {
      const payload = {
        data: dto.message,
        context: JSON.stringify(contextData),
        history: history.length > 0 ? history : undefined,
      };
      const response = await axios.post(`${aiServiceUrl}/chat`, payload, { timeout: 30000 });
      aiReply = response.data?.message || 'Không nhận được phản hồi từ AI.';
    } catch (err: any) {
      aiReply = `### Trợ lý AI\n\nHệ thống chưa thể kết nối tới dịch vụ AI (${err.message}).\n\n*Lưu ý: Mọi phân tích chỉ mang tính chất tham khảo thống kê, không đảm bảo chính xác.*`;
    }

    // Lưu tin nhắn của AI
    const aiMsg = this.messageRepo.create({
      role: 'assistant',
      content: aiReply,
      conversation,
    });
    await this.messageRepo.save(aiMsg);

    return {
      conversationId: conversation.id,
      message: aiReply,
    };
  }

  /**
   * Lấy danh sách các cuộc trò chuyện của người dùng (sắp xếp mới nhất lên đầu)
   */
  async getConversations(userId: string) {
    const conversations = await this.conversationRepo.find({
      where: { userId },
      order: { updatedAt: 'DESC' }, // Order by latest activity
      take: 50,
    });
    
    // We can just return them. 
    return conversations;
  }

  /**
   * Lấy danh sách tin nhắn của một cuộc trò chuyện cụ thể
   */
  async getConversationMessages(userId: string, conversationId: string) {
    // Kiem tra quyen so huu
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId, userId },
    });
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const messages = await this.messageRepo.find({
      where: { conversation: { id: conversationId } },
      order: { id: 'ASC' }, // Order by ID to keep chronological order if createdAt is not available
    });

    return messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
    }));
  }

  /**
   * Xóa một cuộc trò chuyện
   */
  async deleteConversation(userId: string, conversationId: string) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId, userId },
    });
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    // Delete the conversation (cascade will delete messages)
    await this.conversationRepo.remove(conversation);
    return { success: true };
  }
}
