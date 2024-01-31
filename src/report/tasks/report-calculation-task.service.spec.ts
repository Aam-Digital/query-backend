import { Test, TestingModule } from '@nestjs/testing';
import { ReportCalculationTask } from './report-calculation-task.service';

describe('ReportCalculationTaskService', () => {
  let service: ReportCalculationTask;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportCalculationTask],
    }).compile();

    service = module.get<ReportCalculationTask>(ReportCalculationTask);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
