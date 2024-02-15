import { Module } from '@nestjs/common';
import { DefaultReportStorage } from './storage/report-storage.service';
import { ReportController } from './controller/report.controller';
import { HttpModule } from '@nestjs/axios';
import { ReportRepository } from './repository/report-repository.service';
import { ReportCalculationRepository } from './repository/report-calculation-repository.service';
import { ReportCalculationController } from './controller/report-calculation.controller';
import { ReportCalculationTask } from './tasks/report-calculation-task.service';
import { ReportCalculationProcessor } from './tasks/report-calculation-processor.service';
import { SqsReportCalculator } from './core/sqs-report-calculator.service';
import { CouchDbClient } from '../couchdb/couch-db-client.service';
import { CreateReportCalculationUseCase } from './core/use-cases/create-report-calculation-use-case.service';

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
    CreateReportCalculationUseCase,
  ],
  exports: [DefaultReportStorage, CreateReportCalculationUseCase],
})
export class ReportModule {}
