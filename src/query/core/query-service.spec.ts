import { Test, TestingModule } from '@nestjs/testing';
import { QueryService } from './query-service';
import { SqsClient } from '../sqs/sqs.client';
import { of } from 'rxjs';
import { QueryRequest } from '../domain/QueryRequest';
import { QueryResult } from '../domain/QueryResult';

describe('QueryService', () => {
  let service: QueryService;

  let mockSqsClient: {
    executeQuery: jest.Mock;
    executeQueries: jest.Mock;
  };

  beforeEach(async () => {
    mockSqsClient = {
      executeQuery: jest.fn(),
      executeQueries: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: QueryService,
          useFactory: (sqsClient: SqsClient) => {
            return new QueryService(sqsClient);
          },
          inject: [SqsClient],
        },
        {
          provide: SqsClient,
          useValue: mockSqsClient,
        },
      ],
    }).compile();

    service = module.get<QueryService>(QueryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('executeQuery() should call sqsClient with query', (done) => {
    jest
      .spyOn(mockSqsClient, 'executeQuery')
      .mockReturnValue(of(new QueryResult('foo bar do result')));

    service.executeQuery(new QueryRequest('foo bar do')).subscribe({
      next: (value) => {
        expect(mockSqsClient.executeQuery).toHaveBeenCalledWith({
          query: 'foo bar do',
        });

        expect(value).toEqual({
          result: 'foo bar do result',
        });

        done();
      },
      error: (err) => {
        done(err);
      },
    });
  });

  it('executeQueries() should call sqsClient with queries', (done) => {
    jest
      .spyOn(mockSqsClient, 'executeQueries')
      .mockReturnValue(
        of([
          new QueryResult('foo bar do result'),
          new QueryResult('do bar foo result'),
        ]),
      );

    service
      .executeQueries([
        new QueryRequest('foo bar do'),
        new QueryRequest('do bar foo'),
      ])
      .subscribe({
        next: (value) => {
          expect(mockSqsClient.executeQueries).toHaveBeenCalledWith([
            { query: 'foo bar do' },
            { query: 'do bar foo' },
          ]);

          expect(value).toEqual([
            { result: 'foo bar do result' },
            { result: 'do bar foo result' },
          ]);

          done();
        },
        error: (err) => {
          done(err);
        },
      });
  });
});
