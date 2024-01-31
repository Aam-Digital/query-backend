import { Test, TestingModule } from '@nestjs/testing';
import { ReportRepository } from './report-repository.service';

describe('ReportRepositoryService', () => {
  let service: ReportRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportRepository],
    }).compile();

    service = module.get<ReportRepository>(ReportRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
