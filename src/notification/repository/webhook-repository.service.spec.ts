import { Test, TestingModule } from '@nestjs/testing';
import { WebhookRepository } from './webhook-repository.service';

describe('CouchWebhookRepositoryService', () => {
  let service: WebhookRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebhookRepository],
    }).compile();

    service = module.get<WebhookRepository>(WebhookRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
