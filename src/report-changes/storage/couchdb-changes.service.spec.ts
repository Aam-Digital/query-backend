import { Test, TestingModule } from '@nestjs/testing';
import { CouchdbChangesService } from './couchdb-changes.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CouchDbClient } from '../../couchdb/couch-db-client.service';
import { finalize, of } from 'rxjs';
import { CouchDbChangesResponse } from '../../couchdb/dtos';
import { DatabaseChangeResult } from './database-changes.service';

describe('CouchdbChangesService', () => {
  let service: CouchdbChangesService;

  let mockCouchdbChanges: jest.Mock;

  let changesRequestCounter = 0;
  let mockedLastSeq = 0;

  function simulateNextDbChange() {
    mockedLastSeq++;
  }

  beforeEach(async () => {
    changesRequestCounter = 0;
    mockCouchdbChanges = jest.fn().mockImplementation(() => {
      changesRequestCounter++;
      return of({
        last_seq: mockedLastSeq.toString(),
        pending: 0,
        results: [],
      } as CouchDbChangesResponse);
    });

    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        CouchdbChangesService,
        { provide: CouchDbClient, useValue: { changes: mockCouchdbChanges } },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn(() => {
              return 'foo';
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CouchdbChangesService>(CouchdbChangesService);
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should keep polling changes until client unsubscribes', () => {
    const newChangesReceived: DatabaseChangeResult[][] = [];

    const changes$ = service
      .subscribeToAllNewChanges()
      .subscribe((r) => newChangesReceived.push(r));
    expect(newChangesReceived.length).toBe(1);

    simulateNextDbChange();
    jest.runOnlyPendingTimers(); // simulate next polling request after 60s
    expect(newChangesReceived.length).toBe(2);
    expect(changesRequestCounter).toBe(2);

    changes$.unsubscribe();

    changesRequestCounter = 0;
    simulateNextDbChange();
    jest.runOnlyPendingTimers();
    jest.runOnlyPendingTimers();
    // no new calls to have been made:
    expect(changesRequestCounter).toBe(0);
  });

  it('should reuse existing polling for additional subscribers', () => {
    let rec1: DatabaseChangeResult[][] = [];
    let rec2: DatabaseChangeResult[][] = [];

    function resetCounters() {
      changesRequestCounter = 0;
      rec1 = [];
      rec2 = [];
    }

    const sub1 = service
      .subscribeToAllNewChanges()
      .subscribe((r) => rec1.push(r));
    expect(rec1.length).toBe(1);

    const sub2 = service
      .subscribeToAllNewChanges()
      .subscribe((r) => rec2.push(r));
    expect(rec2.length).toBe(1);
    expect(rec1.length).toBe(1);

    resetCounters();
    simulateNextDbChange();
    jest.runOnlyPendingTimers();
    // only one request for both subscribers
    expect(changesRequestCounter).toBe(1);
    expect(rec1.length).toEqual(1);
    expect(rec1).toEqual(rec2);

    sub1.unsubscribe();
    resetCounters();
    simulateNextDbChange();
    jest.runOnlyPendingTimers();
    expect(changesRequestCounter).toBe(1);
    expect(rec2.length).toBe(1);

    sub2.unsubscribe();
    resetCounters();
    simulateNextDbChange();
    jest.runOnlyPendingTimers();
    jest.runOnlyPendingTimers();
    // no new calls to have been made:
    expect(changesRequestCounter).toBe(0);
  });

  it('should fetch all pending', (done) => {
    const received: DatabaseChangeResult[][] = [];
    mockCouchdbChanges
      .mockReturnValueOnce(
        of({
          last_seq: '1',
          pending: 1,
          results: [],
        } as CouchDbChangesResponse),
      )
      .mockReturnValueOnce(
        of({
          last_seq: '2',
          pending: 0,
          results: [],
        } as CouchDbChangesResponse),
      );

    service
      .fetchChanges('-1', true)
      .pipe(
        finalize(() => {
          expect(received.length).toBe(2);
          done();
        }),
      )
      .subscribe((r) => received.push(r));
  });
});
