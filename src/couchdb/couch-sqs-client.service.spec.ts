import { Test, TestingModule } from '@nestjs/testing';
import { CouchSqsClient } from './couch-sqs.client';

describe('CouchSqsClientService', () => {
  let service: CouchSqsClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CouchSqsClient],
    }).compile();

    service = module.get<CouchSqsClient>(CouchSqsClient);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
