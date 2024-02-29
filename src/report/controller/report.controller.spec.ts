import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from './report.controller';
import { ReportingStorage } from '../storage/reporting-storage.service';
import { ReportRepository } from '../repository/report-repository.service';
import { ReportCalculationRepository } from '../repository/report-calculation-repository.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CouchDbClient } from '../../couchdb/couch-db-client.service';
import { JwtService } from '@nestjs/jwt';

describe('ReportController', () => {
  let service: ReportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        CouchDbClient,
        ReportingStorage,
        ReportController,
        ReportRepository,
        ReportCalculationRepository,
        { provide: JwtService, useValue: {} },
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

    service = module.get<ReportController>(ReportController);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
