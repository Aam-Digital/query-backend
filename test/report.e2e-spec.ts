import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import jestOpenAPI from 'jest-openapi';
import { AppModule } from '../src/app.module';
import { ReportChangesService } from '../src/report-changes/core/report-changes.service';
import { CouchSqsClient } from '../src/report/sqs/couch-sqs.client';
import { of } from 'rxjs';
import { mockCouchDbClient } from './mock-couch-db-client';

jestOpenAPI(__dirname + '/../docs/api-specs/reporting-api-v1.yaml');

describe('Report (e2e)', () => {
  const API_PREFIX = '/api/v1/reporting';
  let app: INestApplication;

  beforeEach(async () => {
    mockCouchDbClient();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // TODO: use overrideModule?
      .overrideProvider(ReportChangesService)
      .useValue({})
      .overrideProvider(CouchSqsClient)
      .useValue({ executeQuery: jest.fn().mockReturnValue(of('')) })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    // shut down to stop cronjobs
    await app.close();
  });

  it('/report (GET)', () => {
    return request(app.getHttpServer())
      .get(API_PREFIX + '/report')
      .expect(200)
      .expect([])
      .then((res) => expect(res).toSatisfyApiSpec());
  });
});
