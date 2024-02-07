import { Test, TestingModule } from '@nestjs/testing';
import { CouchDbClient } from './couch-db-client.service';

describe('CouchDbClient', () => {
  let service: CouchDbClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CouchDbClient],
    }).compile();

    service = module.get<CouchDbClient>(CouchDbClient);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
