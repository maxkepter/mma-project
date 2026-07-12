import apiClient from './api-client';

export type PrizeLevel =
  | 'Special'
  | 'First'
  | 'Second'
  | 'Third'
  | 'Fourth'
  | 'Fifth'
  | 'Sixth'
  | 'Seventh';

export interface PrizeGroup {
  prizeLevel: PrizeLevel;
  values: string[];
}

export interface LotteryResultDetail {
  id: string;
  date: string;        // yyyy-mm-dd
  region: string;      // "North"
  source: string;      // "XSMB"
  prizes: PrizeGroup[];
}

export const lotteryApi = {
  /** Fetch the most recent North (XSMB) lottery result. */
  getLatest(): Promise<{ data: LotteryResultDetail }> {
    return apiClient.get<LotteryResultDetail>('/lottery/latest');
  },

  /** Fetch the XSMB result for a specific date (yyyy-mm-dd). */
  getByDate(date: string): Promise<{ data: LotteryResultDetail }> {
    return apiClient.get<LotteryResultDetail>(`/lottery/by-date/${date}`);
  },
};

/** Convenience: extract the value(s) for a given prize level from a detail payload. */
export function getPrizeValues(
  detail: LotteryResultDetail | null | undefined,
  level: PrizeLevel,
): string[] {
  if (!detail) return [];
  const group = detail.prizes.find((p) => p.prizeLevel === level);
  return group?.values ?? [];
}

export const PRIZE_LABELS: Record<PrizeLevel, string> = {
  Special: 'Giải đặc biệt',
  First: 'Giải nhất',
  Second: 'Giải nhì',
  Third: 'Giải ba',
  Fourth: 'Giải tư',
  Fifth: 'Giải năm',
  Sixth: 'Giải sáu',
  Seventh: 'Giải bảy',
};