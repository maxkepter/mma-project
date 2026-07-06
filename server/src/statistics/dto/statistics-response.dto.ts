export class FrequencyItemDto {
  number!: string;
  count!: number;
  percentage!: number;
  rank!: number;
}

export class GanItemDto {
  number!: string;
  currentGan!: number;
  maxGan!: number;
  lastSeenDate!: string | null;
}

export class LoRoiItemDto {
  date!: string;
  specialLoto!: string;
  loRoiTuDe!: string[];
  loRoiTuLo!: string[];
}

export class HeadTailItemDto {
  digit!: number;
  count!: number;
  percentage!: number;
}

export class HeadTailResponseDto {
  heads!: HeadTailItemDto[];
  tails!: HeadTailItemDto[];
}

export class NumberPairItemDto {
  pair!: string[];
  count!: number;
  percentage!: number;
}

export class HeatmapCellDto {
  number!: string;
  value!: number;
  intensity!: number;
}

export class HeatmapRowDto {
  head!: number;
  cells!: HeatmapCellDto[];
}

export class HeatmapResponseDto {
  mode!: 'frequency' | 'gan';
  rows!: HeatmapRowDto[];
}
