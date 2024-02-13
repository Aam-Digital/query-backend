import { Module } from '@nestjs/common';
import { NotificationService } from './notification/notification.service';

@Module({
  providers: [NotificationService]
})
export class NotificationModule {}
