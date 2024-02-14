import { Module } from '@nestjs/common';
import { CouchdbReportChangesService } from './core/couchdb-report-changes.service';
import { CouchdbChangesRepositoryService } from './repository/couchdb-changes-repository.service';
import { NotificationModule } from '../notification/notification.module';
import { ReportModule } from '../report/report.module';
import { CouchDbClient } from '../couchdb/couch-db-client.service';
import { HttpModule } from '@nestjs/axios';
import { TestController } from './test-controller';

@Module({
  controllers: [TestController],
  imports: [NotificationModule, ReportModule, HttpModule],
  providers: [
    CouchdbReportChangesService,
    CouchdbChangesRepositoryService,
    CouchDbClient, // TODO: pack this into a CouchDbModule together with HttpModule import etc.
  ],
  exports: [CouchdbReportChangesService],
})
export class ReportChangesModule {}
