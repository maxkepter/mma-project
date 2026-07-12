import apiClient from "./api-client";

export interface AIInsightItem {
  id: string;
  content: string;
  confidenceScore: number;
  createdAt: string;
  targetDate?: string;
}

export interface ChatResponse {
  conversationId: string;
  message: string;
}

export interface ChatConversation {
  id: string;
  userId: string;
  chatType: string;
  title: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const aiInsightApi = {
  getInsights(limit: number = 10) {
    return apiClient.get<AIInsightItem[]>("/ai/insights", {
      params: { limit },
    });
  },

  getLatestInsight() {
    return apiClient.get<AIInsightItem | null>("/ai/insights/latest");
  },

  getDailyInsights() {
    return apiClient.get<AIInsightItem[]>("/ai/insights/daily");
  },

  generateInsight(dto: { targetDate?: string; region?: string }) {
    return apiClient.post<AIInsightItem>("/ai/insights/generate", dto);
  },

  deleteInsight(insightId: string) {
    return apiClient.delete<{ success: boolean }>(`/ai/insights/${insightId}`);
  },

  chatAssistant(dto: { message: string; conversationId?: string }) {
    return apiClient.post<ChatResponse>("/ai/chat-assistant", dto);
  },

  getConversations() {
    return apiClient.get<ChatConversation[]>("/ai/conversations");
  },

  getConversationMessages(conversationId: string) {
    return apiClient.get<ChatMessage[]>(`/ai/conversations/${conversationId}/messages`);
  },

  deleteConversation(conversationId: string) {
    return apiClient.delete<{ success: boolean }>(`/ai/conversations/${conversationId}`);
  },
};
