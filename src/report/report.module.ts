import { Module } from '@nestjs/common';
import { ReportingStorage } from './storage/reporting-storage.service';
import { ReportController } from './controller/report.controller';
import { HttpModule } from '@nestjs/axios';
import { ReportCalculationController } from './controller/report-calculation.controller';
import { ReportCalculationTask } from './tasks/report-calculation-task.service';
import { ReportCalculationProcessor } from './tasks/report-calculation-processor.service';
import { SqsReportCalculator } from './core/sqs-report-calculator.service';
import { CreateReportCalculationUseCase } from './core/use-cases/create-report-calculation-use-case.service';
import { CouchSqsClient } from './sqs/couch-sqs.client';
import { ConfigService } from '@nestjs/config';
import {
  CreateReportCalculationUseCaseFactory,
  ReportCouchSqsClientFactory,
  ReportingStorageFactory,
  SqsReportCalculatorFactory,
} from './di/report-configuration';

@Module({
  controllers: [ReportController, ReportCalculationController],
  imports: [HttpModule],
  providers: [
    ReportCalculationTask,
    ReportCalculationProcessor,
    {
      provide: CouchSqsClient,
      useFactory: ReportCouchSqsClientFactory,
      inject: [ConfigService],
    },
    {
      provide: ReportingStorage,
      useFactory: ReportingStorageFactory,
      inject: [ConfigService],
    },
    {
      provide: SqsReportCalculator,
      useFactory: SqsReportCalculatorFactory,
      inject: [CouchSqsClient, ReportingStorage],
    },
    {
      provide: CreateReportCalculationUseCase,
      useFactory: CreateReportCalculationUseCaseFactory,
      inject: [ReportingStorage],
    },
  ],
  exports: [ReportingStorage, CreateReportCalculationUseCase],
})
export class ReportModule {}
