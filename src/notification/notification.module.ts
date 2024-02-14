import { Module } from '@nestjs/common';
import { NotificationService } from './core/notification.service';

@Module({
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
