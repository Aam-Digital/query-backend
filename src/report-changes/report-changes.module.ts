import { Module } from '@nestjs/common';
import { ReportChangesService } from './core/report-changes.service';
import { CouchDbChangesService } from './storage/couch-db-changes.service';
import { NotificationModule } from '../notification/notification.module';
import { ReportModule } from '../report/report.module';
import {
  CouchdbChangesServiceFactory,
  ReportChangesServiceFactory,
} from './di/report-changes-configuration';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from '../notification/core/notification.service';
import { ReportingStorage } from '../report/storage/reporting-storage.service';
import { CreateReportCalculationUseCase } from '../report/core/use-cases/create-report-calculation-use-case.service';

@Module({
  imports: [NotificationModule, ReportModule],
  providers: [
    {
      provide: ReportChangesService,
      useFactory: ReportChangesServiceFactory,
      inject: [
        NotificationService,
        ReportingStorage,
        CouchDbChangesService,
        CreateReportCalculationUseCase,
      ],
    },
    {
      provide: CouchDbChangesService,
      useFactory: CouchdbChangesServiceFactory,
      inject: [ConfigService],
    },
  ],
  exports: [ReportChangesService],
})
export class ReportChangesModule {}
