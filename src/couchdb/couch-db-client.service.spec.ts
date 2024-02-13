import { Test, TestingModule } from '@nestjs/testing';
import { CouchDbClient } from './couch-db-client.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

describe('CouchDbClient', () => {
  let service: CouchDbClient;

  let mockHttp: { head: jest.Mock; post: jest.Mock; get: jest.Mock };

  beforeEach(async () => {
    mockHttp = {
      head: jest.fn().mockReturnValue(of({ data: undefined })),
      post: jest.fn().mockReturnValue(of({ data: undefined })),
      get: jest.fn().mockReturnValue(of({ data: undefined })),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [CouchDbClient, { provide: HttpService, useValue: mockHttp }],
    }).compile();

    service = module.get<CouchDbClient>(CouchDbClient);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
