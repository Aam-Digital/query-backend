import { Test, TestingModule } from '@nestjs/testing';
import { WebhookController } from './webhook.controller';
import { WebhookStorage } from '../storage/webhook-storage.service';
import { NotificationService } from '../core/notification.service';
import { JwtService } from '@nestjs/jwt';

describe('WebhookController', () => {
  let controller: WebhookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      controllers: [WebhookController],
      providers: [
        { provide: JwtService, useValue: {} },
        { provide: WebhookStorage, useValue: {} },
        { provide: NotificationService, useValue: {} },
      ],
    }).compile();

    controller = module.get<WebhookController>(WebhookController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
