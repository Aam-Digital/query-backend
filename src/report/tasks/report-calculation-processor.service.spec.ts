import { Test, TestingModule } from '@nestjs/testing';
import { ReportCalculationProcessor } from './report-calculation-processor.service';
import { DefaultReportStorage } from '../storage/report-storage.service';
import { SqsReportCalculator } from '../core/sqs-report-calculator.service';

describe('ReportCalculationProcessorService', () => {
  let service: ReportCalculationProcessor;

  let mockReportStorage: { fetchAllReports: jest.Mock };
  let mockSqsReportCalculator: { calculate: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        ReportCalculationProcessor,
        { provide: DefaultReportStorage, useValue: mockReportStorage },
        { provide: SqsReportCalculator, useValue: mockSqsReportCalculator },
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
