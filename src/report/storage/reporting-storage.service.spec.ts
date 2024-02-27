import { Test, TestingModule } from '@nestjs/testing';
import { IReportStorage } from '../core/report-storage.interface';
import { ReportingStorage } from './reporting-storage.service';
import { ReportRepository } from '../repository/report-repository.service';
import { ReportCalculationRepository } from '../repository/report-calculation-repository.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CouchDbClient } from '../../couchdb/couch-db-client.service';

describe('DefaultReportStorage', () => {
  let service: IReportStorage;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        ReportingStorage,
        ReportRepository,
        ReportCalculationRepository,
        CouchDbClient,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn(() => {
              return 'foo';
            }),
          },
        },
      ],
    }).compile();

    service = module.get<IReportStorage>(ReportingStorage);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
