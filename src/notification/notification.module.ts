import { Module } from '@nestjs/common';
import { NotificationService } from './core/notification.service';
import { WebhookStorageService } from './storage/webhook-storage.service';
import { WebhookController } from './controller/webhook.controller';

@Module({
  controllers: [WebhookController],
  providers: [NotificationService, WebhookStorageService],
  exports: [NotificationService],
})
export class NotificationModule {}
