import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from './report.controller';

describe('ReportController', () => {
  let service: ReportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportController],
    }).compile();

    service = module.get<ReportController>(ReportController);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
