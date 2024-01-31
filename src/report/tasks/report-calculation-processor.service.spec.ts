import { Test, TestingModule } from '@nestjs/testing';
import { ReportCalculationProcessor } from './report-calculation-processor.service';

describe('ReportCalculationProcessorService', () => {
  let service: ReportCalculationProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportCalculationProcessor],
    }).compile();

    service = module.get<ReportCalculationProcessor>(
      ReportCalculationProcessor,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
