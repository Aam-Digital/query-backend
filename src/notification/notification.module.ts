import { Module } from '@nestjs/common';
import { NotificationService } from './core/notification.service';
import { WebhookStorage } from './storage/webhook-storage.service';
import { WebhookController } from './controller/webhook.controller';
import { ConfigService } from '@nestjs/config';
import {
  NotificationServiceFactory,
  WebhookStorageFactory,
} from './di/notification-configuration';
import { CryptoModule } from '../crypto/crypto.module';
import { CryptoService } from '../crypto/core/crypto.service';

@Module({
  controllers: [WebhookController],
  imports: [CryptoModule],
  providers: [
    {
      provide: WebhookStorage,
      useFactory: WebhookStorageFactory,
      inject: [CryptoService, ConfigService],
    },
    {
      provide: NotificationService,
      useFactory: NotificationServiceFactory,
      inject: [WebhookStorage],
    },
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
