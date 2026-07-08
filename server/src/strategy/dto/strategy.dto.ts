import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsDateString,
} from 'class-validator';

export enum ConditionOperator {
  EQ = 'eq',
  GT = 'gt',
  GTE = 'gte',
  LT = 'lt',
  LTE = 'lte',
  BETWEEN = 'between',
  IN = 'in',
}

export enum ConditionType {
  FREQUENCY = 'frequency',
  GAN = 'gan',
  HEAD_TAIL = 'head_tail',
  HEATMAP = 'heatmap',
  PAIRS = 'pairs',
}

/**
 * Strategy condition.
 * `parameters` kept for backward compatibility; new clients should send
 * the structured fields (field/operator/value) which are stored as-is.
 */
export class StrategyConditionDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsEnum(ConditionType)
  @IsNotEmpty()
  type!: ConditionType;

  @IsOptional()
  @IsString()
  field?: string;

  @IsOptional()
  @IsEnum(ConditionOperator)
  operator?: ConditionOperator;

  @IsOptional()
  value?: number | string | number[];

  @IsOptional()
  @IsString()
  logic?: 'AND' | 'OR';

  @IsOptional()
  parameters?: Record<string, any>;
}

export class CreateStrategyDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StrategyConditionDto)
  @IsOptional()
  conditions?: StrategyConditionDto[];
}

export class UpdateStrategyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StrategyConditionDto)
  @IsOptional()
  conditions?: StrategyConditionDto[];
}

export class RunBacktestDto {
  /** Number of days to backtest (1–99). Takes priority over startDate/endDate. */
  @IsOptional()
  days?: number | string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  /** When true, persist the run to DB. When false/undefined, run is preview-only. */
  @IsOptional()
  @IsBoolean()
  save?: boolean;

  @IsOptional()
  @IsString()
  name?: string;
}

export class SaveBacktestRunDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsBoolean()
  saved!: boolean;
}
