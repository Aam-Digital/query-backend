import { AppController } from './app.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

describe('AppController', () => {
  let controller: AppController;
  let mockHttp: { post: jest.Mock };

  beforeEach(async () => {
    mockHttp = {
      post: jest.fn().mockReturnValue(of({ data: undefined })),
    };
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [AppController, { provide: HttpService, useValue: mockHttp }],
    }).compile();

    controller = module.get(AppController);
  });

  it('should create', () => {
    expect(controller).toBeDefined();
  });
});
