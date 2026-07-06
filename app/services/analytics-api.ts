import apiClient from "./api-client";

export interface TrendItem {
  number: string;
  trend: "up" | "down" | "stable";
  slope: number;
  recentFreq: number;
  mediumFreq: number;
  longFreq: number;
}

export interface CycleItem {
  number: string;
  averageCycle: number;
  maxCycle: number;
  currentOverdue: number;
  isOverdue: boolean;
  lastSeenDate: string | null;
}

export interface CorrelationItem {
  numberA: string;
  numberB: string;
  correlationCoefficient: number;
  coOccurrenceCount: number;
  coOccurrencePercentage: number;
}

export interface PredictionItem {
  number: string;
  score: number;
  confidence: "high" | "medium" | "low";
  frequencyFactor: number;
  overdueFactor: number;
  trendFactor: number;
  reasoning: string;
}

export interface AnalyticsQuery {
  limit?: number;
  startDate?: string;
  endDate?: string;
  region?: string;
}

export interface PredictionQuery extends AnalyticsQuery {
  topN?: number;
}

const buildQuery = (params: AnalyticsQuery): Record<string, string> => {
  const q: Record<string, string> = {};
  if (params.limit) q.limit = String(params.limit);
  if (params.startDate) q.startDate = params.startDate;
  if (params.endDate) q.endDate = params.endDate;
  if (params.region) q.region = params.region;
  return q;
};

export const analyticsApi = {
  getTrend(params: AnalyticsQuery = {}) {
    return apiClient.get<TrendItem[]>("/analytics/trend", {
      params: buildQuery(params),
    });
  },

  getCycle(params: AnalyticsQuery = {}) {
    return apiClient.get<CycleItem[]>("/analytics/cycle", {
      params: buildQuery(params),
    });
  },

  getCorrelation(params: AnalyticsQuery = {}) {
    return apiClient.get<CorrelationItem[]>("/analytics/correlation", {
      params: buildQuery(params),
    });
  },

  getPredictions(params: PredictionQuery = {}) {
    const q = buildQuery(params);
    if (params.topN) q.topN = String(params.topN);
    return apiClient.get<PredictionItem[]>("/analytics/predictions", {
      params: q,
    });
  },
};
