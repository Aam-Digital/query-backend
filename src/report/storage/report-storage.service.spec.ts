import { Test, TestingModule } from '@nestjs/testing';
import { ReportStorage } from '../core/report-storage';
import { DefaultReportStorage } from './report-storage.service';

describe('DefaultReportStorage', () => {
  let service: ReportStorage;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DefaultReportStorage],
    }).compile();

    service = module.get<ReportStorage>(DefaultReportStorage);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
