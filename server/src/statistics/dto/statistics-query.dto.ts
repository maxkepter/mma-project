import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PrizeLevel } from '../../lottery-core/entities/prize-level.enum';

export class StatisticsQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 100;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(PrizeLevel, { each: true })
  prizeLevels?: PrizeLevel[];

  @IsOptional()
  @IsEnum(['frequency', 'gan'] as const)
  mode?: 'frequency' | 'gan' = 'frequency';
}
