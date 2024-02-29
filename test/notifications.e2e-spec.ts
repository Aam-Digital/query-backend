import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import jestOpenAPI from 'jest-openapi';
import { AppModule } from '../src/app.module';
import { ReportDoc } from '../src/report/repository/report-repository.service';
import { MockCouch } from './mock-couch';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockCouch = require('mock-couch');

jestOpenAPI(__dirname + '/../docs/api-specs/reporting-api-v1.yaml');

describe('Notifications Module (e2e)', () => {
  const API_NOTIFICATION_PREFIX = '/api/v1/notifications';
  let app: INestApplication;

  let couchdb: MockCouch;

  beforeEach(async () => {
    couchdb = mockCouch.createServer();
    couchdb.listen(5984);
    couchdb.addDB('app', []);
    couchdb.addDB('notification-webhook', []);
    couchdb.addDB('report-calculation', []);

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    couchdb.close();
  });

  it('should register a webhook [POST /webhook]', () => {});

  it('should get details for registered webhook [GET /webhook/:webhookId]', () => {});

  it('should subscribe to report events for webhook and receive an initial event [POST /webhook/:webhookId/subscribe/report/:reportId]', () => {});

  it('should receive an event after data changed', () => {});

  it('should receive an event for each affected subscribed report', () => {
    const reportId1 = 'ReportConfig:1';
    const report1: Partial<ReportDoc> = {
      _id: reportId1,
      _rev: '1-123',
      title: 'Test 1',
      mode: 'sql',
      aggregationDefinitions: ['SELECT prop1 as a, prop2 as b FROM Events'],
    };
    couchdb.addDoc('app', report1);
    const reportId2 = 'ReportConfig:2';
    const report2: Partial<ReportDoc> = {
      _id: reportId2,
      _rev: '1-123',
      title: 'Test 2',
      mode: 'sql',
      aggregationDefinitions: ['SELECT prop3 as c FROM Events'],
    };
    couchdb.addDoc('app', report2);

    return request(app.getHttpServer()).post(
      API_NOTIFICATION_PREFIX + '/webhook',
    );
  });

  it('should stop receiving events after unsubscribe [DELETE /webhook/:webhookId/subscribe/report/:reportId]', () => {});
});
