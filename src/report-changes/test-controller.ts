import { Controller, Get } from '@nestjs/common';
import { ReportChangesService } from './core/report-changes.service';
import { Reference } from '../domain/reference';
import { NotificationService } from '../notification/core/notification.service';

// TODO: remove as soon as webhooks are implemented!
@Controller('/test')
export class TestController {
  constructor(
    private changeDetectionService: ReportChangesService,
    private notificationService: NotificationService,
  ) {}

  @Get('/register')
  register() {
    return this.changeDetectionService
      .registerReportMonitoring(new Reference('ReportConfig:1'))
      .catch((e) => console.log(e));
  }
}
