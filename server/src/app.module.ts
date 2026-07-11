import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { IdentityModule } from './identity/identity.module';
import { LotteryCoreModule } from './lottery-core/lottery-core.module';
import { StatisticsModule } from './statistics/statistics.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NewsModule } from './news/news.module';
import { StrategyModule } from './strategy/strategy.module';
import { JournalModule } from './journal/journal.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    IdentityModule,
    LotteryCoreModule,
    StatisticsModule,
    AnalyticsModule,
    NewsModule,
    StrategyModule,
    JournalModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USERNAME:', process.env.DB_USERNAME);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
