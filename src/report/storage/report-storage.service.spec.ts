import { Test, TestingModule } from '@nestjs/testing';
import { ReportStorage } from '../core/report-storage';
import { DefaultReportStorage } from './report-storage.service';
import { ReportRepository } from '../repository/report-repository.service';
import { ReportCalculationRepository } from '../repository/report-calculation-repository.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CouchDbClient } from '../../couchdb/couch-db-client.service';

describe('DefaultReportStorage', () => {
  let service: ReportStorage;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        DefaultReportStorage,
        ReportRepository,
        ReportCalculationRepository,
        CouchDbClient,
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

    service = module.get<ReportStorage>(DefaultReportStorage);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
