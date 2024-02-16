import { Module } from '@nestjs/common';
import { DefaultReportStorage } from './storage/report-storage.service';
import { ReportController } from './controller/report.controller';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ReportRepository } from './repository/report-repository.service';
import { ReportCalculationRepository } from './repository/report-calculation-repository.service';
import { ReportCalculationController } from './controller/report-calculation.controller';
import { ReportCalculationTask } from './tasks/report-calculation-task.service';
import { ReportCalculationProcessor } from './tasks/report-calculation-processor.service';
import { SqsReportCalculator } from './core/sqs-report-calculator.service';
import { CreateReportCalculationUseCase } from './core/use-cases/create-report-calculation-use-case.service';
import { CouchSqsClient } from '../couchdb/couch-sqs.client';
import { CouchSqsClientFactory } from './di/couchdb-sqs-configuration';
import { ConfigService } from '@nestjs/config';
import { CouchDbClient } from '../couchdb/couch-db-client.service';

@Module({
  controllers: [ReportController, ReportCalculationController],
  imports: [HttpModule],
  providers: [
    DefaultReportStorage,
    ReportRepository,
    ReportCalculationRepository,
    ReportCalculationTask,
    ReportCalculationProcessor,
    SqsReportCalculator,
    CouchDbClient,
    {
      provide: CouchSqsClient,
      useFactory: CouchSqsClientFactory,
      inject: [HttpService, ConfigService],
    },
    CreateReportCalculationUseCase,
  ],
  exports: [DefaultReportStorage, CreateReportCalculationUseCase],
})
export class ReportModule {}
