import { Controller, Get } from '@nestjs/common';
import { CouchdbReportChangesService } from './core/couchdb-report-changes.service';
import { Reference } from '../domain/reference';

@Controller('/test')
export class TestController {
  constructor(private changeDetectionService: CouchdbReportChangesService) {}

  @Get('/register')
  register() {
    return this.changeDetectionService
      .registerReportMonitoring(new Reference('ReportConfig:1'))
      .catch((e) => console.log(e));
  }

  @Get('/changes')
  check() {
    return this.changeDetectionService.monitorCouchDbChanges();
  }
}
