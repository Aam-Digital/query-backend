import { Controller, Get } from '@nestjs/common';
import { CouchdbReportChangesService } from './core/couchdb-report-changes.service';
import { Reference } from '../domain/reference';
import { NotificationService } from '../notification/core/notification.service';

@Controller('/test')
export class TestController {
  constructor(
    private changeDetectionService: CouchdbReportChangesService,
    private notificationService: NotificationService,
  ) {}

  @Get('/register')
  register() {
    return this.changeDetectionService
      .registerReportMonitoring(new Reference('ReportConfig:1'))
      .catch((e) => console.log(e));
  }
}
