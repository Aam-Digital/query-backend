import { Module } from '@nestjs/common';
import { NotificationService } from './core/notification.service';

@Module({
  providers: [NotificationService],
})
export class NotificationModule {}
