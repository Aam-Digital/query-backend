import { Test, TestingModule } from '@nestjs/testing';
import { CouchdbChangesRepositoryService } from './couchdb-changes-repository.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

describe('CouchdbChangesRepositoryService', () => {
  let service: CouchdbChangesRepositoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        CouchdbChangesRepositoryService,
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

    service = module.get<CouchdbChangesRepositoryService>(
      CouchdbChangesRepositoryService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
