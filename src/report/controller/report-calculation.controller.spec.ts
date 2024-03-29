import { Test, TestingModule } from '@nestjs/testing';
import { ReportCalculationController } from './report-calculation.controller';
import { ReportingStorage } from '../storage/reporting-storage.service';
import { HttpModule } from '@nestjs/axios';
import { CouchDbClient } from '../../couchdb/couch-db-client.service';
import { ReportController } from './report.controller';
import { ReportCalculationRepository } from '../repository/report-calculation-repository.service';
import { ReportRepository } from '../repository/report-repository.service';
import { ConfigService } from '@nestjs/config';
import { CreateReportCalculationUseCase } from '../core/use-cases/create-report-calculation-use-case.service';
import { JwtService } from '@nestjs/jwt';

describe('ReportCalculationController', () => {
  let controller: ReportCalculationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportCalculationController],
      imports: [HttpModule],
      providers: [
        CouchDbClient,
        ReportingStorage,
        ReportController,
        ReportCalculationRepository,
        ReportRepository,
        CreateReportCalculationUseCase,
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

    controller = module.get<ReportCalculationController>(
      ReportCalculationController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
