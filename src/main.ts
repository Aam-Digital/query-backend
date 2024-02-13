import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SentryService } from '@ntegral/nestjs-sentry';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Logging everything through sentry
  app.useLogger(SentryService.SentryServiceInstance());

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
