import apiClient from './api-client';

/** Operator for comparing a numeric/stat field */
export type ConditionOperator = 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'in';

/** Category of condition */
export type ConditionType = 'frequency' | 'gan' | 'head_tail' | 'heatmap' | 'pairs';

/** One condition in a strategy */
export interface StrategyCondition {
  id?: string;
  type: ConditionType;
  /** Which statistic to compare (e.g. 'count', 'lastAppeared', 'gap') */
  field?: string;
  operator?: ConditionOperator;
  /** Numeric value, string value, or array for 'between'/'in' */
  value?: number | string | number[];
  /** 'AND' | 'OR' — only meaningful after the first condition */
  logic?: 'AND' | 'OR';
  /** Legacy fallback */
  parameters?: Record<string, any>;
}

export interface Strategy {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  userId: string;
  conditions: StrategyCondition[];
  backtestRuns?: BacktestRun[];
}

export interface BacktestResult {
  totalBets: number;
  wonBets: number;
  lostBets: number;
  totalProfit: number;
}

export interface BacktestRun {
  id: string;
  startDate: string;
  endDate: string;
  winRate: number;
  profit: number;
  result: BacktestResult;
  saved: boolean;
  name?: string;
}

export interface CreateStrategyDto {
  name: string;
  description?: string;
  conditions?: StrategyCondition[];
}

export interface UpdateStrategyDto {
  name?: string;
  description?: string;
  conditions?: StrategyCondition[];
}

export interface RunBacktestDto {
  /** Số ngày backtest (1-99). Ưu tiên hơn startDate/endDate. */
  days?: number;
  startDate?: string;
  endDate?: string;
}

export interface SaveBacktestRunDto {
  saved: boolean;
  name?: string;
}

/** Human-readable labels for condition types */
export const CONDITION_TYPE_LABELS: Record<ConditionType, string> = {
  frequency: 'Tần suất',
  gan: 'Lô gan',
  head_tail: 'Đầu/Đuôi',
  heatmap: 'Bảng nhiệt',
  pairs: 'Cặp số',
};

/** Human-readable labels for operators */
export const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  eq: '=',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  between: 'trong khoảng',
  in: 'nằm trong',
};

/** Fields available for each condition type */
export const CONDITION_FIELDS: Record<ConditionType, { value: string; label: string }[]> = {
  frequency: [
    { value: 'count', label: 'Số lần xuất hiện' },
    { value: 'lastAppeared', label: 'Ngày xuất hiện gần nhất' },
    { value: 'gap', label: 'Khoảng cách' },
  ],
  gan: [
    { value: 'daysOut', label: 'Số ngày chưa ra' },
    { value: 'maxGap', label: 'Kỷ lục gan' },
    { value: 'currentGap', label: 'Gan hiện tại' },
  ],
  head_tail: [
    { value: 'headCount', label: 'Đầu số' },
    { value: 'tailCount', label: 'Đuôi số' },
  ],
  heatmap: [
    { value: 'zoneValue', label: 'Giá trị vùng' },
    { value: 'intensity', label: 'Cường độ' },
  ],
  pairs: [
    { value: 'pairCount', label: 'Số cặp' },
    { value: 'pairFrequency', label: 'Tần suất cặp' },
  ],
};

/** Descriptions for each condition type */
export const CONDITION_TYPE_DESCRIPTIONS: Record<ConditionType, string> = {
  frequency: 'Thống kê tần suất xuất hiện của các con số trong một khoảng thời gian nhất định nhằm tìm ra các số về nhiều hoặc ít.',
  gan: 'Phân tích các con số lâu chưa xuất hiện (lô gan) để tìm ra quy luật cực đại của khoảng cách giữa hai lần xuất hiện liên tiếp.',
  head_tail: 'Phân tích các chữ số hàng chục (đầu) và chữ số hàng đơn vị (đuôi) của kết quả nhằm tìm ra xu hướng chạm số.',
  heatmap: 'Bản đồ trực quan hóa mật độ xuất hiện của các con số, giúp nhận diện nhanh chóng các vùng số "nóng" (về nhiều) hoặc "lạnh" (về ít).',
  pairs: 'Thống kê sự xuất hiện đồng thời của các cặp số đi cùng nhau để tìm ra các mối quan hệ tương quan mạnh mẽ.',
};

/** Descriptions for each field of a condition type */
export const CONDITION_FIELD_DESCRIPTIONS: Record<ConditionType, Record<string, string>> = {
  frequency: {
    count: 'Số lần con số đó xuất hiện trong khung thời gian khảo sát.',
    lastAppeared: 'Số kỳ quay thưởng tính từ lần xuất hiện cuối cùng của số đó đến nay.',
    gap: 'Khoảng cách trung bình (số kỳ quay) giữa các lần xuất hiện liên tiếp của số đó.',
  },
  gan: {
    daysOut: 'Số ngày (kỳ quay) liên tiếp con số này chưa xuất hiện.',
    maxGap: 'Số ngày chưa xuất hiện lâu nhất lịch sử ghi nhận của con số này.',
    currentGap: 'Chu kỳ gan hiện tại của số đó tính đến kỳ quay mới nhất.',
  },
  head_tail: {
    headCount: 'Số lần xuất hiện của chữ số hàng chục của số đó trong các giải.',
    tailCount: 'Số lần xuất hiện của chữ số hàng đơn vị của số đó trong các giải.',
  },
  heatmap: {
    zoneValue: 'Giá trị số lượng số xuất hiện phân bố theo từng khu vực bảng số.',
    intensity: 'Độ đậm nhạt (cường độ xuất hiện) thể hiện tần suất tập trung của vùng số đó.',
  },
  pairs: {
    pairCount: 'Số lần cặp số này xuất hiện cùng nhau trong cùng một kỳ quay.',
    pairFrequency: 'Tỷ lệ/tần suất xuất hiện của cặp số này so với các cặp số khác.',
  },
};

export const strategyApi = {
  getAll() {
    return apiClient.get<Strategy[]>('/strategy');
  },

  getById(id: string) {
    return apiClient.get<Strategy>(`/strategy/${id}`);
  },

  create(data: CreateStrategyDto) {
    return apiClient.post<Strategy>('/strategy', data);
  },

  update(id: string, data: UpdateStrategyDto) {
    return apiClient.patch<Strategy>(`/strategy/${id}`, data);
  },

  delete(id: string) {
    return apiClient.delete<void>(`/strategy/${id}`);
  },

  runBacktest(id: string, data: RunBacktestDto) {
    return apiClient.post<BacktestRun>(`/strategy/${id}/backtest`, data);
  },

  saveBacktestRun(strategyId: string, runId: string, data: SaveBacktestRunDto) {
    return apiClient.patch<BacktestRun>(
      `/strategy/${strategyId}/backtest/${runId}`,
      data,
    );
  },
};
