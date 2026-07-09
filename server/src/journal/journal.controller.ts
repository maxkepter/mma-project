import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { JournalService } from './journal.service';
import { CreateBetDto } from './dto/create-bet.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';

@Controller('journal')
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Post('bet')
  async createBet(@CurrentUser() user: JwtPayload, @Body() dto: CreateBetDto) {
    return this.journalService.createBet(user.sub, dto);
  }

  @Get('portfolio')
  async getPortfolio(@CurrentUser() user: JwtPayload) {
    return this.journalService.getPortfolio(user.sub);
  }

  @Get('history')
  async getHistory(@CurrentUser() user: JwtPayload) {
    return this.journalService.getHistory(user.sub);
  }

  @Delete('bet/:id')
  async cancelBet(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.journalService.cancelBet(user.sub, id);
  }
}
