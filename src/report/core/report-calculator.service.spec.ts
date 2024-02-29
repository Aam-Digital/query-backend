import { Test, TestingModule } from '@nestjs/testing';
import { ReportCalculator } from './report-calculator.service';
import { ReportingStorage } from '../storage/reporting-storage.service';
import { SqsClient } from '../../query/sqs/sqs.client';

describe('SqsReportCalculatorService', () => {
  let service: ReportCalculator;

  let mockCouchSqsClient: { executeQuery: jest.Mock };
  let mockReportStorage: { fetchAllReports: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportCalculator,
        { provide: SqsClient, useValue: mockCouchSqsClient },
        { provide: ReportingStorage, useValue: mockReportStorage },
      ],
    }).compile();

    service = module.get<ReportCalculator>(ReportCalculator);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
