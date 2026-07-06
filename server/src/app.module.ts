import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { IdentityModule } from './identity/identity.module';
import { LotteryCoreModule } from './lottery-core/lottery-core.module';
import { NewsModule } from './news/news.module';
import { StrategyModule } from './strategy/strategy.module';
import { JournalModule } from './journal/journal.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    IdentityModule,
    LotteryCoreModule,
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
