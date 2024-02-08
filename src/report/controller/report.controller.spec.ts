import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from './report.controller';
import { DefaultReportStorage } from '../storage/report-storage.service';
import { ReportRepository } from '../repository/report-repository.service';
import { ReportCalculationRepository } from '../repository/report-calculation-repository.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CouchDbClient } from '../repository/couch-db-client.service';

describe('ReportController', () => {
  let service: ReportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        CouchDbClient,
        DefaultReportStorage,
        ReportController,
        ReportRepository,
        ReportCalculationRepository,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key) => {
              return 'foo';
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ReportController>(ReportController);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
