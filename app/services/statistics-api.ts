import apiClient from "./api-client";

export interface FrequencyItem {
  number: string;
  count: number;
  percentage: number;
  rank: number;
}

export interface GanItem {
  number: string;
  currentGan: number;
  maxGan: number;
  lastSeenDate: string | null;
}

export interface LoRoiItem {
  date: string;
  specialLoto: string;
  loRoiTuDe: string[];
  loRoiTuLo: string[];
}

export interface HeadTailItem {
  digit: number;
  count: number;
  percentage: number;
}

export interface HeadTailResponse {
  heads: HeadTailItem[];
  tails: HeadTailItem[];
}

export interface NumberPairItem {
  pair: string[];
  count: number;
  percentage: number;
}

export interface HeatmapCell {
  number: string;
  value: number;
  intensity: number;
}

export interface HeatmapRow {
  head: number;
  cells: HeatmapCell[];
}

export interface HeatmapResponse {
  mode: "frequency" | "gan";
  rows: HeatmapRow[];
}

export interface StatisticsQuery {
  limit?: number;
  startDate?: string;
  endDate?: string;
  prizeLevels?: string[];
  mode?: "frequency" | "gan";
}

const buildQuery = (params: StatisticsQuery): Record<string, string> => {
  const q: Record<string, string> = {};
  if (params.limit) q.limit = String(params.limit);
  if (params.startDate) q.startDate = params.startDate;
  if (params.endDate) q.endDate = params.endDate;
  if (params.prizeLevels?.length) q.prizeLevels = params.prizeLevels.join(",");
  if (params.mode) q.mode = params.mode;
  return q;
};

export const statisticsApi = {
  getFrequency(params: StatisticsQuery = {}) {
    return apiClient.get<FrequencyItem[]>(
      "/statistics/frequency",
      { params: buildQuery(params) }
    );
  },

  getGan(params: StatisticsQuery = {}) {
    return apiClient.get<GanItem[]>(
      "/statistics/gan",
      { params: buildQuery(params) }
    );
  },

  getLoRoi(params: StatisticsQuery = {}) {
    return apiClient.get<LoRoiItem[]>(
      "/statistics/lo-roi",
      { params: buildQuery(params) }
    );
  },

  getHeadTail(params: StatisticsQuery = {}) {
    return apiClient.get<HeadTailResponse>(
      "/statistics/head-tail",
      { params: buildQuery(params) }
    );
  },

  getNumberPairs(params: StatisticsQuery = {}) {
    return apiClient.get<NumberPairItem[]>(
      "/statistics/pairs",
      { params: buildQuery(params) }
    );
  },

  getHeatmap(params: StatisticsQuery = {}) {
    return apiClient.get<HeatmapResponse>(
      "/statistics/heatmap",
      { params: buildQuery(params) }
    );
  },
};
