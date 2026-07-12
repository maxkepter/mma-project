import { Controller, Get, Query } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsQueryDto } from './dto/statistics-query.dto';
import { Public } from '../auth/decorators/public.decorator';
import {
  FrequencyItemDto,
  GanItemDto,
  LoRoiItemDto,
  HeadTailResponseDto,
  NumberPairItemDto,
  HeatmapResponseDto,
} from './dto/statistics-response.dto';

// Statistics endpoints expose historical lottery data, which is public information.
// R1: JwtAuthGuard is registered globally via APP_GUARD; do NOT re-declare it here.
// Each endpoint opts out of the global guard via @Public().
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Public()
  @Get('frequency')
  async getFrequency(
    @Query() query: StatisticsQueryDto,
  ): Promise<FrequencyItemDto[]> {
    return this.statisticsService.getFrequency(query.limit, query.prizeLevels);
  }

  @Public()
  @Get('gan')
  async getGan(@Query() query: StatisticsQueryDto): Promise<GanItemDto[]> {
    return this.statisticsService.getGan(query.limit);
  }

  @Public()
  @Get('lo-roi')
  async getLoRoi(@Query() query: StatisticsQueryDto): Promise<LoRoiItemDto[]> {
    return this.statisticsService.getLoRoi(query.limit);
  }

  @Public()
  @Get('head-tail')
  async getHeadTail(
    @Query() query: StatisticsQueryDto,
  ): Promise<HeadTailResponseDto> {
    return this.statisticsService.getHeadTail(query.limit);
  }

  @Public()
  @Get('pairs')
  async getNumberPairs(
    @Query() query: StatisticsQueryDto,
  ): Promise<NumberPairItemDto[]> {
    return this.statisticsService.getNumberPairs(query.limit);
  }

  @Public()
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
