import { Test, TestingModule } from '@nestjs/testing';
import { ReportCalculationTask } from './report-calculation-task.service';
import { ReportCalculationProcessor } from './report-calculation-processor.service';

describe('ReportCalculationTaskService', () => {
  let service: ReportCalculationTask;

  let mockReportCalculationProcessor: {
    processNextPendingCalculation: jest.Mock;
  };

  beforeEach(async () => {
    mockReportCalculationProcessor = {
      processNextPendingCalculation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        ReportCalculationTask,
        {
          provide: ReportCalculationProcessor,
          useValue: mockReportCalculationProcessor,
        },
      ],
    }).compile();

    service = module.get<ReportCalculationTask>(ReportCalculationTask);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
