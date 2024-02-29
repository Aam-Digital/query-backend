import { Module } from '@nestjs/common';
import { ReportingStorage } from './storage/reporting-storage.service';
import { ReportController } from './controller/report.controller';
import { HttpModule } from '@nestjs/axios';
import { ReportCalculationController } from './controller/report-calculation.controller';
import { ReportCalculationTask } from './tasks/report-calculation-task.service';
import { ReportCalculationProcessor } from './tasks/report-calculation-processor.service';
import { ReportCalculator } from './core/report-calculator.service';
import { CreateReportCalculationUseCase } from './core/use-cases/create-report-calculation-use-case.service';
import { ConfigService } from '@nestjs/config';
import {
  CreateReportCalculationUseCaseFactory,
  ReportCalculationProcessorFactory,
  ReportingStorageFactory,
  SqsReportCalculatorFactory,
} from './di/report-configuration';
import { QueryService } from '../query/core/query-service';
import { QueryModule } from '../query/query.module';

@Module({
  controllers: [ReportController, ReportCalculationController],
  imports: [HttpModule, QueryModule],
  providers: [
    ReportCalculationTask,
    {
      provide: ReportCalculationProcessor,
      useFactory: ReportCalculationProcessorFactory,
      inject: [ReportingStorage, ReportCalculator],
    },
    {
      provide: ReportingStorage,
      useFactory: ReportingStorageFactory,
      inject: [ConfigService],
    },
    {
      provide: ReportCalculator,
      useFactory: SqsReportCalculatorFactory,
      inject: [QueryService, ReportingStorage],
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
