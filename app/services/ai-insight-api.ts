import apiClient from "./api-client";

export interface AIInsightItem {
  id: string;
  content: string;
  confidenceScore: number;
  createdAt: string;
}

export const aiInsightApi = {
  generate(targetDate?: string) {
    return apiClient.post<AIInsightItem>(
      "/ai/insights/generate",
      undefined,
      { params: targetDate ? { targetDate } : {} },
    );
  },

  getInsights(limit: number = 10) {
    return apiClient.get<AIInsightItem[]>("/ai/insights", {
      params: { limit },
    });
  },

  getLatestInsight() {
    return apiClient.get<AIInsightItem | null>("/ai/insights/latest");
  },
};
