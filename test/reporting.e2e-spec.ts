import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import jestOpenAPI from 'jest-openapi';
import { AppModule } from '../src/app.module';
import { ReportDoc } from '../src/report/repository/report-repository.service';
import { MockCouch } from './mock-couch';
import {
  ReportCalculation,
  ReportCalculationStatus,
} from '../src/domain/report-calculation';
import { ReportData } from '../src/domain/report-data';
import { EntityDoc } from '../src/report-changes/storage/database-changes.service';

jestOpenAPI(__dirname + '/../docs/api-specs/reporting-api-v1.yaml');

describe('Reporting Module (e2e)', () => {
  const API_REPORTING_PREFIX = '/api/v1/reporting';
  const API_NOTIFICATION_PREFIX = '/api/v1/notifications';
  let app: INestApplication;

  let couchdb: MockCouch;

  beforeEach(async () => {
    couchdb = new MockCouch(5984);
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
        schema: { fields: ['a', 'b'] },
      })
      .then((res) => expect(res).toSatisfyApiSpec());
  });

  it('should trigger a calculation for the report [POST /report-calculation/report/:reportId]', () => {
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
      .post(API_REPORTING_PREFIX + '/report-calculation/report/' + reportId)
      .expect(201)
      .expect(/{"id":"ReportCalculation:.*"}/)
      .then((res) => expect(res).toSatisfyApiSpec());
  });

  it('should get status of calculation [GET /report-calculation/:calculationId]', async () => {
    const reportId = 'ReportConfig:1';
    const report: Partial<ReportDoc> = {
      _id: reportId,
      _rev: '1-123',
      title: 'Test Report',
      mode: 'sql',
      aggregationDefinitions: ['SELECT prop1 as a, prop2 as b FROM Events'],
    };
    couchdb.addDoc('app', report);

    let calculationId: string = '';
    await request(app.getHttpServer())
      .post(API_REPORTING_PREFIX + '/report-calculation/report/' + reportId)
      .expect(201)
      .expect(/{"id":"ReportCalculation:.*"}/)
      .then((res) => {
        calculationId = res.body.id;
        return res;
      })
      .then((res) => expect(res).toSatisfyApiSpec());

    await request(app.getHttpServer())
      .get(API_REPORTING_PREFIX + '/report-calculation/' + calculationId)
      .expect(200)
      .expect({
        id: calculationId,
        report: { id: reportId },
        status: 'PENDING',
        start_date: null,
        end_date: null,
        outcome: null,
      })
      .then((res) => expect(res).toSatisfyApiSpec());
  });

  it('should get data of report results for completed calculation [GET /report-calculation/:calculationId/data]', () => {
    const reportId = 'ReportConfig:1';
    const report: Partial<ReportDoc> = {
      _id: reportId,
      _rev: '1-123',
      title: 'Test Report',
      mode: 'sql',
      aggregationDefinitions: ['SELECT prop1 as a, prop2 as b FROM Events'],
    };
    couchdb.addDoc('app', report);

    const calculationId = 'ReportCalculation:1';
    const reportCalculation: Partial<ReportCalculation & EntityDoc> = {
      _id: calculationId,
      id: calculationId,
      report: { id: reportId },
      status: ReportCalculationStatus.FINISHED_SUCCESS,
    };
    couchdb.addDoc('report-calculation', reportCalculation);

    const reportData: Partial<ReportData & EntityDoc> = {
      _id: 'ReportData:1',
      id: 'ReportData:1',
      report: { id: reportId },
      calculation: { id: calculationId },
      data: { a: 1, b: 2 },
    };
    couchdb.addDoc('report-calculation', reportData);

    return request(app.getHttpServer())
      .get(
        API_REPORTING_PREFIX + '/report-calculation/' + calculationId + '/data',
      )
      .expect(200)
      .expect((res) => {
        expect(res.body.calculation).toEqual({ id: calculationId });
        expect(res.body.data).toEqual(reportData.data);
      })
      .then((res) => expect(res).toSatisfyApiSpec());
  });

  it('should return 404 when trying to get data of pending calculation [GET /report-calculation/:calculationId/data]', () => {
    const calculationId = 'ReportCalculation:1';
    const reportCalculation: Partial<ReportCalculation> = {
      id: calculationId,
      report: { id: 'ReportConfig:1' },
      status: ReportCalculationStatus.PENDING,
    };
    couchdb.addDoc('report-calculation', reportCalculation);

    return request(app.getHttpServer())
      .get(
        API_REPORTING_PREFIX + '/report-calculation/' + calculationId + '/data',
      )
      .expect(404)
      .then((res) => expect(res).toSatisfyApiSpec());
  });

  // TODO: test calculation runner and generation of report data?!
  //      --> mock SQS + trigger an event for test to know calculation ran?
});
