import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { WebhookStorage } from '../storage/webhook-storage.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { UrlParser } from './url-parser.service';

describe('NotificationService', () => {
  let service: NotificationService;

  let mockWebhookStorage: {
    fetchAllWebhooks: jest.Mock;
    addSubscription: jest.Mock;
    removeSubscription: jest.Mock;
  };

  let mockHttp: { request: jest.Mock };

  beforeEach(async () => {
    mockWebhookStorage = {
      fetchAllWebhooks: jest.fn(),
      addSubscription: jest.fn(),
      removeSubscription: jest.fn(),
    };

    mockHttp = {
      request: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        NotificationService,
        { provide: HttpService, useValue: mockHttp },
        {
          provide: WebhookStorage,
          useValue: mockWebhookStorage,
        },
        { provide: UrlParser, useClass: UrlParser },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
