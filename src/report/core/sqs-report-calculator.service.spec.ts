import { Test, TestingModule } from '@nestjs/testing';
import { SqsReportCalculator } from './sqs-report-calculator.service';
import { ReportingStorage } from '../storage/reporting-storage.service';
import { CouchSqsClient } from '../../couchdb/couch-sqs.client';

describe('SqsReportCalculatorService', () => {
  let service: SqsReportCalculator;

  let mockCouchSqsClient: { executeQuery: jest.Mock };
  let mockReportStorage: { fetchAllReports: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SqsReportCalculator,
        { provide: CouchSqsClient, useValue: mockCouchSqsClient },
        { provide: ReportingStorage, useValue: mockReportStorage },
      ],
    }).compile();

    service = module.get<SqsReportCalculator>(SqsReportCalculator);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
