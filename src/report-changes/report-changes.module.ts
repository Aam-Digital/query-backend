import { Module } from '@nestjs/common';
import { CouchdbReportChangesService } from './core/couchdb-report-changes.service';

@Module({
  providers: [CouchdbReportChangesService],
})
export class ReportChangesModule {}
