export class TrendItemDto {
  number!: string;
  trend!: 'up' | 'down' | 'stable';
  slope!: number;
  recentFreq!: number;
  mediumFreq!: number;
  longFreq!: number;
}

export class CycleItemDto {
  number!: string;
  averageCycle!: number;
  maxCycle!: number;
  currentOverdue!: number;
  isOverdue!: boolean;
  lastSeenDate!: string | null;
}

export class CorrelationItemDto {
  numberA!: string;
  numberB!: string;
  correlationCoefficient!: number;
  coOccurrenceCount!: number;
  coOccurrencePercentage!: number;
}

export class PredictionItemDto {
  number!: string;
  score!: number;
  confidence!: 'high' | 'medium' | 'low';
  frequencyFactor!: number;
  overdueFactor!: number;
  trendFactor!: number;
  reasoning!: string;
}

export class TrendResponseDto {
  items!: TrendItemDto[];
}

export class CycleResponseDto {
  items!: CycleItemDto[];
}

export class CorrelationResponseDto {
  items!: CorrelationItemDto[];
}

export class PredictionResponseDto {
  items!: PredictionItemDto[];
}
