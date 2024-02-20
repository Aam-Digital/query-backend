import { DefaultCouchDbClientFactory } from '../../couchdb/default-factory';
import { ConfigService } from '@nestjs/config';
import { CouchSqsClient, CouchSqsClientConfig } from '../sqs/couch-sqs.client';
import { ReportingStorage } from '../storage/reporting-storage.service';
import { ReportRepository } from '../repository/report-repository.service';
import { ReportCalculationRepository } from '../repository/report-calculation-repository.service';
import { SqsReportCalculator } from '../core/sqs-report-calculator.service';
import { CreateReportCalculationUseCase } from '../core/use-cases/create-report-calculation-use-case.service';
import axios from 'axios';
import { HttpService } from '@nestjs/axios';
import { ReportSchemaGenerator } from '../core/report-schema-generator';

export const ReportCouchSqsClientFactory = (
  configService: ConfigService,
): CouchSqsClient => {
  const CONFIG_PREFIX = 'SQS_CLIENT_';

  const config: CouchSqsClientConfig = {
    BASE_URL: configService.getOrThrow(CONFIG_PREFIX + 'BASE_URL'),
    BASIC_AUTH_USER: configService.getOrThrow(
      CONFIG_PREFIX + 'BASIC_AUTH_USER',
    ),
    BASIC_AUTH_PASSWORD: configService.getOrThrow(
      CONFIG_PREFIX + 'BASIC_AUTH_PASSWORD',
    ),
    SCHEMA_DESIGN_CONFIG: configService.getOrThrow(
      CONFIG_PREFIX + 'SCHEMA_DESIGN_CONFIG',
    ),
  };

  const axiosInstance = axios.create();

  axiosInstance.defaults.baseURL = config.BASE_URL;
  axiosInstance.defaults.headers['Authorization'] = `Basic ${Buffer.from(
    `${config.BASIC_AUTH_USER}:${config.BASIC_AUTH_PASSWORD}`,
  ).toString('base64')}`;

  return new CouchSqsClient(new HttpService(axiosInstance), config);
};

export const ReportingStorageFactory = (
  configService: ConfigService,
): ReportingStorage =>
  new ReportingStorage(
    new ReportRepository(
      DefaultCouchDbClientFactory('COUCH_DB_CLIENT_REPORT_', configService),
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
  couchSqsClient: CouchSqsClient,
  reportingStorage: ReportingStorage,
): SqsReportCalculator =>
  new SqsReportCalculator(couchSqsClient, reportingStorage);

export const CreateReportCalculationUseCaseFactory = (
  reportingStorage: ReportingStorage,
): CreateReportCalculationUseCase =>
  new CreateReportCalculationUseCase(reportingStorage);
