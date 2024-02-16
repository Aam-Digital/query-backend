import { Module } from '@nestjs/common';
import { ReportChangesService } from './core/report-changes.service';
import { CouchdbChangesService } from './storage/couchdb-changes.service';
import { NotificationModule } from '../notification/notification.module';
import { ReportModule } from '../report/report.module';
import { CouchDbClient } from '../couchdb/couch-db-client.service';
import { HttpModule } from '@nestjs/axios';
import { TestController } from './test-controller';

@Module({
  controllers: [TestController],
  imports: [NotificationModule, ReportModule, HttpModule],
  providers: [
    ReportChangesService,
    CouchdbChangesService,
    CouchDbClient, // TODO: pack this into a CouchDbModule together with HttpModule import etc.
  ],
  exports: [ReportChangesService],
})
export class ReportChangesModule {}
