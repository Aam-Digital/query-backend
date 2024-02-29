import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { AppConfiguration } from './config/configuration';
import { configureSentry } from './sentry.configuration';
import { INestApplication } from '@nestjs/common';

async function bootstrap() {
  // load ConfigService instance to access .env and app.yaml values
  const configService = new ConfigService(AppConfiguration());

  const app: INestApplication = await NestFactory.create(AppModule);

  configureSentry(app, configService);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
