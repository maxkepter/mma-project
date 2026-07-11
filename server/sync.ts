import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { LotteryCoreService } from './src/lottery-core/services/lottery-core.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(LotteryCoreService);
  await service.seedLotteryData();
  await app.close();
}
bootstrap();
