import apiClient from "./api-client";

export interface AIInsightItem {
  id: string;
  content: string;
  confidenceScore: number;
  createdAt: string;
  targetDate?: string;
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
};
