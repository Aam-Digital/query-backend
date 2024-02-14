import { Test, TestingModule } from '@nestjs/testing';
import { WebhookStorageService } from './webhook-storage.service';

describe('WebhookStorageService', () => {
  let service: WebhookStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebhookStorageService],
    }).compile();

    service = module.get<WebhookStorageService>(WebhookStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
