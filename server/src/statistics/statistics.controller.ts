import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsQueryDto } from './dto/statistics-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  FrequencyItemDto,
  GanItemDto,
  LoRoiItemDto,
  HeadTailResponseDto,
  NumberPairItemDto,
  HeatmapResponseDto,
} from './dto/statistics-response.dto';

@Controller('statistics')
@UseGuards(JwtAuthGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('frequency')
  async getFrequency(
    @Query() query: StatisticsQueryDto,
  ): Promise<FrequencyItemDto[]> {
    return this.statisticsService.getFrequency(query.limit, query.prizeLevels);
  }

  @Get('gan')
  async getGan(@Query() query: StatisticsQueryDto): Promise<GanItemDto[]> {
    return this.statisticsService.getGan(query.limit);
  }

  @Get('lo-roi')
  async getLoRoi(@Query() query: StatisticsQueryDto): Promise<LoRoiItemDto[]> {
    return this.statisticsService.getLoRoi(query.limit);
  }

  @Get('head-tail')
  async getHeadTail(
    @Query() query: StatisticsQueryDto,
  ): Promise<HeadTailResponseDto> {
    return this.statisticsService.getHeadTail(query.limit);
  }

  @Get('pairs')
  async getNumberPairs(
    @Query() query: StatisticsQueryDto,
  ): Promise<NumberPairItemDto[]> {
    return this.statisticsService.getNumberPairs(query.limit);
  }

  @Get('heatmap')
  async getHeatmap(
    @Query() query: StatisticsQueryDto,
  ): Promise<HeatmapResponseDto> {
    return this.statisticsService.getHeatmap(
      query.limit,
      query.mode ?? 'frequency',
    );
  }
}
