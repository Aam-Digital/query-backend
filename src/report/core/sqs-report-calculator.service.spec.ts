import { Test, TestingModule } from '@nestjs/testing';
import { SqsReportCalculator } from './sqs-report-calculator.service';

describe('SqsReportCalculatorService', () => {
  let service: SqsReportCalculator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SqsReportCalculator],
    }).compile();

    service = module.get<SqsReportCalculator>(SqsReportCalculator);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
