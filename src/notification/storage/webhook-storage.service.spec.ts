import { Test, TestingModule } from '@nestjs/testing';
import { WebhookStorage } from './webhook-storage.service';

describe('WebhookStorageService', () => {
  let service: WebhookStorage;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebhookStorage],
    }).compile();

    service = module.get<WebhookStorage>(WebhookStorage);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
