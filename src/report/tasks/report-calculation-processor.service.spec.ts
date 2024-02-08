import { Test, TestingModule } from '@nestjs/testing';
import { ReportCalculationProcessor } from './report-calculation-processor.service';
import { DefaultReportStorage } from '../storage/report-storage.service';
import { HttpModule } from '@nestjs/axios';
import { CouchDbClient } from '../repository/couch-db-client.service';
import { ReportCalculationTask } from './report-calculation-task.service';
import { SqsReportCalculator } from '../core/sqs-report-calculator.service';
import { ReportRepository } from '../repository/report-repository.service';
import { ReportCalculationRepository } from '../repository/report-calculation-repository.service';
import { ConfigService } from '@nestjs/config';

describe('ReportCalculationProcessorService', () => {
  let service: ReportCalculationProcessor;

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

    service = module.get<ReportCalculationProcessor>(
      ReportCalculationProcessor,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
