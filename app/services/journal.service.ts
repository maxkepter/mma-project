import apiClient from './api-client';

export interface BetEntry {
  id: string;
  number: string;
  amount: number;
  betDate: string;
  status: 'Pending' | 'Won' | 'Lost';
  result?: {
    actualNumber: string;
    isWin: boolean;
    payout: number;
  };
}

export interface PortfolioResponse {
  totalInvestment: number;
  bets: BetEntry[];
}

export interface HistoryResponse {
  totalSpent: number;
  totalPayout: number;
  profit: number;
  bets: BetEntry[];
}

export interface CreateBetDto {
  number: string;
  amount: number;
  betDate: string;
}

export const JournalService = {
  getPortfolio: async (): Promise<PortfolioResponse> => {
    const response = await apiClient.get('/journal/portfolio');
    return response.data;
  },

  getHistory: async (): Promise<HistoryResponse> => {
    const response = await apiClient.get('/journal/history');
    return response.data;
  },

  createBet: async (data: CreateBetDto): Promise<BetEntry> => {
    const response = await apiClient.post('/journal/bet', data);
    return response.data;
  },

  cancelBet: async (id: string): Promise<void> => {
    await apiClient.delete(`/journal/bet/${id}`);
  },
};
