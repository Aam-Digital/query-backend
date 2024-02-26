import { Test, TestingModule } from '@nestjs/testing';
import { SqsClient } from './sqs.client';
import { HttpService } from '@nestjs/axios';
import { SqsSchemaService } from './sqs-schema-generator.service';
import { of, throwError } from 'rxjs';
import { Logger } from '@nestjs/common';

describe('SqsClient', () => {
  let service: SqsClient;

  let mockSqsSchemaService: {
    getSchemaPath: jest.Mock;
    updateSchema: jest.Mock;
  };

  let mockHttp: { post: jest.Mock; axiosRef: any };

  let mockLogger: { error: jest.Mock; debug: jest.Mock };

  beforeEach(async () => {
    mockSqsSchemaService = {
      getSchemaPath: jest.fn(),
      updateSchema: jest.fn(),
    };

    mockHttp = {
      post: jest.fn(),
      axiosRef: {
        defaults: {
          url: 'doo',
        },
      },
    };

    mockLogger = {
      error: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: SqsClient,
          useFactory: (http, sqsSchemaService) =>
            new SqsClient(http, sqsSchemaService),
          inject: [HttpService, SqsSchemaService],
        },
        { provide: HttpService, useValue: mockHttp },
        { provide: SqsSchemaService, useValue: mockSqsSchemaService },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<SqsClient>(SqsClient);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('executeQuery() should execute query and return QueryResult', (done) => {
    jest
      .spyOn(mockSqsSchemaService, 'getSchemaPath')
      .mockReturnValue('/app/config_path');

    jest
      .spyOn(mockSqsSchemaService, 'updateSchema')
      .mockReturnValue(of(undefined));

    jest.spyOn(mockHttp, 'post').mockReturnValue(
      of({
        data: {
          foo: 'bar',
        },
      }),
    );

    service
      .executeQuery({
        query: 'SELECT foo FROM bar',
      })
      .subscribe({
        next: (value) => {
          expect(value).toEqual({
            result: {
              foo: 'bar',
            },
          });

          expect(mockLogger.error).not.toBeCalled();
          expect(mockLogger.debug).not.toBeCalled();

          done();
        },
        error: (err) => {
          done(err);
        },
      });
  });

  it('executeQuery() should handle error from httpService', (done) => {
    jest
      .spyOn(mockSqsSchemaService, 'getSchemaPath')
      .mockReturnValue('/app/config_path');

    jest
      .spyOn(mockSqsSchemaService, 'updateSchema')
      .mockReturnValue(of(undefined));

    jest
      .spyOn(mockHttp, 'post')
      .mockReturnValue(throwError(() => new Error('foo error')));

    service
      .executeQuery({
        query: 'SELECT foo FROM bar',
      })
      .subscribe({
        next: (value) => {
          done('should throw error ');
        },
        error: (err) => {
          expect(err.message).toBe('foo error');
          expect(mockLogger.error).not.toBeCalled();
          done();
        },
      });
  });

  it('executeQueries() should execute all queries and return QueryResult[]', (done) => {
    jest
      .spyOn(mockSqsSchemaService, 'getSchemaPath')
      .mockReturnValue('/app/config_path');

    jest
      .spyOn(mockSqsSchemaService, 'updateSchema')
      .mockReturnValue(of(undefined));

    jest.spyOn(mockHttp, 'post').mockReturnValueOnce(
      of({
        data: {
          foo: 'bar',
        },
      }),
    );

    jest.spyOn(mockHttp, 'post').mockReturnValueOnce(
      of({
        data: {
          bar: 'doo',
        },
      }),
    );

    service
      .executeQueries([
        {
          query: 'SELECT foo FROM bar',
        },
        {
          query: 'SELECT foo FROM bar',
        },
      ])
      .subscribe({
        next: (value) => {
          expect(value).toEqual([
            {
              result: {
                foo: 'bar',
              },
            },
            {
              result: {
                bar: 'doo',
              },
            },
          ]);

          expect(mockLogger.error).not.toBeCalled();
          expect(mockLogger.debug).not.toBeCalled();

          done();
        },
        error: (err) => {
          done(err);
        },
      });
  });
});
