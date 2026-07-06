import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class StrategyConditionDto {
  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsNotEmpty()
  parameters!: Record<string, any>;
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
  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @IsDateString()
  @IsNotEmpty()
  endDate!: string;
}
