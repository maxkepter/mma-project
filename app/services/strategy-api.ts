import apiClient from './api-client';

export interface StrategyCondition {
  type: string;
  parameters: Record<string, any>;
}

export interface Strategy {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  userId: string;
  conditions: StrategyCondition[];
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
  startDate: string;
  endDate: string;
}

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
};
