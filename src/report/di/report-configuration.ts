import { DefaultCouchDbClientFactory } from '../../couchdb/default-factory';
import { ConfigService } from '@nestjs/config';
import { ReportingStorage } from '../storage/reporting-storage.service';
import { ReportRepository } from '../repository/report-repository.service';
import { ReportCalculationRepository } from '../repository/report-calculation-repository.service';
import { ReportCalculator } from '../core/report-calculator.service';
import { CreateReportCalculationUseCase } from '../core/use-cases/create-report-calculation-use-case.service';
import { ReportSchemaGenerator } from '../core/report-schema-generator';
import { IReportingStorage } from '../core/report-storage.interface';
import { IQueryService } from '../../query/core/query-service.interface';
import { ReportCalculationProcessor } from '../tasks/report-calculation-processor.service';
import { IReportCalculator } from '../core/report-calculator.interface';

export const ReportingStorageFactory = (
  configService: ConfigService,
): ReportingStorage =>
  new ReportingStorage(
    new ReportRepository(
      DefaultCouchDbClientFactory('COUCH_DB_CLIENT_APP_', configService),
    ),
    new ReportCalculationRepository(
      DefaultCouchDbClientFactory(
        'COUCH_DB_CLIENT_REPORT_CALCULATION_',
        configService,
      ),
    ),
    new ReportSchemaGenerator(),
  );

export const SqsReportCalculatorFactory = (
  queryClient: IQueryService,
  reportingStorage: IReportingStorage,
): ReportCalculator => new ReportCalculator(queryClient, reportingStorage);

export const CreateReportCalculationUseCaseFactory = (
  reportingStorage: ReportingStorage,
): CreateReportCalculationUseCase =>
  new CreateReportCalculationUseCase(reportingStorage);

export const ReportCalculationProcessorFactory = (
  reportingStorage: IReportingStorage,
  reportCalculator: IReportCalculator,
): ReportCalculationProcessor =>
  new ReportCalculationProcessor(reportingStorage, reportCalculator);
