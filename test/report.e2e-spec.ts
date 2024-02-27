import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import jestOpenAPI from 'jest-openapi';
import { AppModule } from '../src/app.module';
import { ReportDoc } from '../src/report/repository/report-repository.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockCouch = require('mock-couch');

jestOpenAPI(__dirname + '/../docs/api-specs/reporting-api-v1.yaml');

describe('Report (e2e)', () => {
  const API_REPORTING_PREFIX = '/api/v1/reporting';
  const API_NOTIFICATION_PREFIX = '/api/v1/notifications';
  let app: INestApplication;

  let couchdb: MockCouch;

  beforeEach(async () => {
    couchdb = mockCouch.createServer();
    couchdb.listen(5984);
    couchdb.addDB('app', [
      { name: 'one name', lastname: 'one lastname' },
      {
        _id: '4568797890',
        name: 'second name',
        lastname: 'other lastname',
      },
    ]);
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

  it('should list all available reports [GET /report]', () => {
    const report: Partial<ReportDoc> = {
      _id: 'ReportConfig:1',
      _rev: '1-123',
      title: 'Test Report',
      mode: 'sql',
      aggregationDefinitions: [],
    };
    couchdb.addDoc('app', report);

    return request(app.getHttpServer())
      .get(API_REPORTING_PREFIX + '/report')
      .expect(200)
      .expect([
        {
          id: 'ReportConfig:1',
          name: report.title,
          calculationPending: false,
          schema: { fields: [] },
        },
      ])
      .then((res) => expect(res).toSatisfyApiSpec());
  });

  it('should get details of one report [GET /report/:reportId]', () => {
    const reportId = 'ReportConfig:1';
    const report: Partial<ReportDoc> = {
      _id: reportId,
      _rev: '1-123',
      title: 'Test Report',
      mode: 'sql',
      aggregationDefinitions: ['SELECT prop1 as a, prop2 as b FROM Events'],
    };
    couchdb.addDoc('app', report);

    return request(app.getHttpServer())
      .get(API_REPORTING_PREFIX + '/report/' + reportId)
      .expect(200)
      .expect({
        id: reportId,
        name: report.title,
        calculationPending: false,
        schema: { fields: [['a', 'b']] }, // TODO: this should be a flat array?
      })
      .then((res) => expect(res).toSatisfyApiSpec());
  });

  it('should trigger a calculation for the report [POST /report-calculation/:reportId]', () => {});

  it('should get status of calculation [GET /report-calculation/:calculationId]', () => {});

  it('should get data of report results for completed calculation [GET /report-calculation/:calculationId/data]', () => {});

  it('should return 404 when trying to get data of pending calculation [GET /report-calculation/:calculationId/data]', () => {});

  // TODO: MOVE TO SEPARATE FILE

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

/**
 * see https://chris-l.github.io/mock-couch/
 */
interface MockCouch {
  listen(port: number): void;

  close(): void;

  addDB(dbName: string, docs: any[]): any;

  addDoc(dbName: string, doc: any): any;
}
