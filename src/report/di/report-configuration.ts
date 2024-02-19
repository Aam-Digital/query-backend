import {
  DefaultCouchDbClientFactory,
  DefaultCouchSqsClientFactory,
} from '../../couchdb/default-factory';
import { ConfigService } from '@nestjs/config';
import { CouchSqsClient } from '../../couchdb/couch-sqs.client';
import { ReportingStorage } from '../storage/reporting-storage.service';
import { ReportRepository } from '../repository/report-repository.service';
import { ReportCalculationRepository } from '../repository/report-calculation-repository.service';
import { SqsReportCalculator } from '../core/sqs-report-calculator.service';
import { CreateReportCalculationUseCase } from '../core/use-cases/create-report-calculation-use-case.service';

export const ReportCouchSqsClientFactory = (
  configService: ConfigService,
): CouchSqsClient =>
  DefaultCouchSqsClientFactory(
    'REPORT_COUCH_SQS_CLIENT_CONFIG_',
    configService,
  );

export const ReportingStorageFactory = (
  configService: ConfigService,
): ReportingStorage =>
  new ReportingStorage(
    new ReportRepository(
      DefaultCouchDbClientFactory(
        'REPORT_COUCH_DB_CLIENT_CONFIG_REPORT_',
        configService,
      ),
    ),
    new ReportCalculationRepository(
      DefaultCouchDbClientFactory(
        'REPORT_COUCH_DB_CLIENT_CONFIG_REPORT_CALCULATION_',
        configService,
      ),
    ),
  );

export const SqsReportCalculatorFactory = (
  couchSqsClient: CouchSqsClient,
  reportingStorage: ReportingStorage,
): SqsReportCalculator =>
  new SqsReportCalculator(couchSqsClient, reportingStorage);

export const CreateReportCalculationUseCaseFactory = (
  reportingStorage: ReportingStorage,
): CreateReportCalculationUseCase =>
  new CreateReportCalculationUseCase(reportingStorage);
