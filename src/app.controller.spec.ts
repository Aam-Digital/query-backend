import { AppController } from './app.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { ReportConfig } from './report-config';
import { ConfigService } from '@nestjs/config';

describe('AppController', () => {
  let controller: AppController;
  let mockHttp: { post: jest.Mock; get: jest.Mock };
  const dbUrl = 'database:3000';
  const queryUrl = 'query:3000';
  const schemaConfigId = '_design/sqlite:config';

  beforeEach(async () => {
    mockHttp = {
      post: jest.fn().mockReturnValue(of({ data: undefined })),
      get: jest.fn().mockReturnValue(of({ data: undefined })),
    };
    const mockConfigService = {
      get: (key) => {
        switch (key) {
          case 'DATABASE_URL':
            return dbUrl;
          case 'QUERY_URL':
            return queryUrl;
          case 'SCHEMA_CONFIG_ID':
            return schemaConfigId;
          default:
            throw Error('missing mock value for ' + key);
        }
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppController,
        { provide: HttpService, useValue: mockHttp },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get(AppController);
  });

  it('should create', () => {
    expect(controller).toBeDefined();
  });

  it('should forward report query to SQS and return result', (done) => {
    const report: ReportConfig = {
      mode: 'sql',
      aggregationDefinitions: 'SELECT * FROM someTable',
    };
    mockHttp.get.mockReturnValue(of({ data: report }));
    const queryResult = { some: 'data' };
    mockHttp.post.mockReturnValue(of({ data: queryResult }));

    controller.queryData('some-id', 'app', 'valid token').subscribe((res) => {
      expect(mockHttp.get).toHaveBeenCalledWith(
        `${dbUrl}/app/ReportConfig:some-id`,
        { headers: { Authorization: 'valid token' } },
      );
      expect(mockHttp.post).toHaveBeenCalledWith(
        `${queryUrl}/app/${schemaConfigId}`,
        { query: report.aggregationDefinitions },
      );
      expect(res).toEqual(queryResult);

      done();
    });
  });

  it('should throw error if user is not permitted to request report', (done) => {
    // TODO check that this is actual response
    mockHttp.get.mockReturnValue(
      throwError(() => ({
        response: { data: 'Unauthorized', status: 401 },
      })),
    );
    controller.queryData('some-id', 'app', 'invalid token').subscribe({
      error: (err: HttpException) => {
        expect(err.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
        done();
      },
    });
  });

  it('should throw error trying to query a non-sql report', (done) => {
    const report: ReportConfig = {
      mode: 'exporting' as any,
      aggregationDefinitions: undefined,
    };
    mockHttp.get.mockReturnValue(of({ data: report }));

    controller.queryData('some-id', 'app', 'valid token').subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(BadRequestException);
        done();
      },
    });
  });

  it('should throw sql query is not defined', (done) => {
    const report: ReportConfig = {
      mode: 'sql',
      aggregationDefinitions: undefined,
    };
    mockHttp.get.mockReturnValue(of({ data: report }));

    controller.queryData('some-id', 'app', 'valid token').subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(BadRequestException);
        done();
      },
    });
  });
});
