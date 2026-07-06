import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

// Load environment variables from .env BEFORE importing AppModule
// (important: AppModule may read env vars during module initialization)
loadEnv({ path: resolve(__dirname, '..', '.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for mobile app and web clients
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new LoggingInterceptor());
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);

  console.log(`Server is running on http://localhost:${port}`);
}
bootstrap().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
