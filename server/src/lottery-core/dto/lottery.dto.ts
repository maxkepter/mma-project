import { PrizeLevel } from '../entities/prize-level.enum';

export class LotteryNumberDto {
  prizeLevel!: PrizeLevel;
  value!: string;
  position!: number;
}

export class LotteryResultDto {
  id!: string;
  date!: string; // ISO yyyy-mm-dd
  source!: string;
  region!: string;
  numbers!: LotteryNumberDto[];
}

export class PrizeGroupDto {
  prizeLevel!: PrizeLevel;
  values!: string[];
}

export class LotteryResultDetailDto {
  id!: string;
  date!: string;
  region!: string;
  source!: string;
  prizes!: PrizeGroupDto[];
}
