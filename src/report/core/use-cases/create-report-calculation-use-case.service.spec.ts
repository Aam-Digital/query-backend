import { Test, TestingModule } from '@nestjs/testing';
import { CreateReportCalculationUseCase } from './create-report-calculation-use-case.service';

describe('CreateReportCalculationUseCaseService', () => {
  let service: CreateReportCalculationUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateReportCalculationUseCase],
    }).compile();

    service = module.get<CreateReportCalculationUseCase>(
      CreateReportCalculationUseCase,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
