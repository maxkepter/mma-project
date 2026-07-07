import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { StrategyService } from './strategy.service';
import {
  CreateStrategyDto,
  UpdateStrategyDto,
  RunBacktestDto,
} from './dto/strategy.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';

@Controller('strategy')
export class StrategyController {
  constructor(private readonly strategyService: StrategyService) {}

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() createStrategyDto: CreateStrategyDto,
  ) {
    return this.strategyService.create(user.sub, createStrategyDto);
  }

  @Get()
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.strategyService.findAll(user.sub);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.strategyService.findOne(user.sub, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() updateStrategyDto: UpdateStrategyDto,
  ) {
    return this.strategyService.update(user.sub, id, updateStrategyDto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.strategyService.remove(user.sub, id);
  }

  @Post(':id/backtest')
  async runBacktest(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() runBacktestDto: RunBacktestDto,
  ) {
    return this.strategyService.runBacktest(user.sub, id, runBacktestDto);
  }
}
