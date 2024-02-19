import { CouchDbChangesService } from '../storage/couch-db-changes.service';
import { DefaultCouchDbClientFactory } from '../../couchdb/default-factory';
import { ConfigService } from '@nestjs/config';
import { ReportChangesService } from '../core/report-changes.service';
import { NotificationService } from '../../notification/core/notification.service';
import { CreateReportCalculationUseCase } from '../../report/core/use-cases/create-report-calculation-use-case.service';
import { ReportingStorage } from '../../report/storage/reporting-storage.service';

export const CouchdbChangesServiceFactory = (
  configService: ConfigService,
): CouchDbChangesService => {
  return new CouchDbChangesService(
    DefaultCouchDbClientFactory(
      'REPORT_CHANGES_COUCH_DB_CLIENT_CONFIG_',
      configService,
    ),
    {
      POLL_INTERVAL: configService.getOrThrow('REPORT_CHANGES_POLL_INTERVAL'),
    },
  );
};

export const ReportChangesServiceFactory = (
  notificationService: NotificationService,
  reportStorage: ReportingStorage,
  couchdbChangesService: CouchDbChangesService,
  createReportCalculationUseCase: CreateReportCalculationUseCase,
): ReportChangesService => {
  return new ReportChangesService(
    notificationService,
    reportStorage,
    couchdbChangesService,
    createReportCalculationUseCase,
  );
};
