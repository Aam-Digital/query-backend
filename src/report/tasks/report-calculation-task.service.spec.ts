import { Test, TestingModule } from '@nestjs/testing';
import { ReportCalculationTask } from './report-calculation-task.service';
import { ReportCalculationProcessor } from './report-calculation-processor.service';
import { SqsReportCalculator } from '../core/sqs-report-calculator.service';
import { DefaultReportStorage } from '../storage/report-storage.service';
import { ConfigService } from '@nestjs/config';
import { ReportRepository } from '../repository/report-repository.service';
import { ReportCalculationRepository } from '../repository/report-calculation-repository.service';
import { HttpModule } from '@nestjs/axios';
import { CouchDbClient } from '../../couchdb/couch-db-client.service';

describe('ReportCalculationTaskService', () => {
  let service: ReportCalculationTask;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        CouchDbClient,
        ReportCalculationTask,
        DefaultReportStorage,
        ReportCalculationProcessor,
        SqsReportCalculator,
        ReportRepository,
        ReportCalculationRepository,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key) => {
              return 'foo';
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ReportCalculationTask>(ReportCalculationTask);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
