import { Test, TestingModule } from '@nestjs/testing';
import { ReportRepository } from './report-repository.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

describe('ReportRepositoryService', () => {
  let service: ReportRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        ReportRepository,
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

    service = module.get<ReportRepository>(ReportRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
