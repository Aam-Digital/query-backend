import { Module } from '@nestjs/common';
import { NotificationService } from './core/notification.service';
import { WebhookStorage } from './storage/webhook-storage.service';
import { WebhookController } from './controller/webhook.controller';
import { ConfigService } from '@nestjs/config';
import { WebhookStorageFactory } from './di/notification-configuration';
import { CryptoModule } from '../crypto/crypto/crypto.module';
import { CryptoService } from '../crypto/core/crypto.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  controllers: [WebhookController],
  imports: [CryptoModule, HttpModule],
  providers: [
    NotificationService,
    {
      provide: WebhookStorage,
      useFactory: WebhookStorageFactory,
      inject: [CryptoService, ConfigService],
    },
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
