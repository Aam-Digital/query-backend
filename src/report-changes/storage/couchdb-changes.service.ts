import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  catchError,
  EMPTY,
  expand,
  filter,
  finalize,
  map,
  mergeAll,
  mergeMap,
  Observable,
  of,
  repeat,
  ReplaySubject,
  Subscription,
  switchMap,
  tap,
} from 'rxjs';
import { CouchDbClient } from '../../couchdb/couch-db-client.service';
import { CouchDbChangesResponse } from '../../couchdb/dtos';
import { DatabaseChangeResult, DatabaseChangesService, DocChangeDetails, EntityDoc, } from './database-changes.service';

/**
 * Access _changes from a CouchDB
 */
@Injectable()
export class CouchdbChangesService extends DatabaseChangesService {
  // TODO: centralize this config by refactoring couchdbClient and providing configured clients through DI
  private dbUrl: string = this.configService.getOrThrow('DATABASE_URL');
  private databaseName = 'app'; // TODO: move to config and clean up .env, clarifying different DBs there
  private databaseUser: string = this.configService.getOrThrow('DATABASE_USER');
  private databasePassword: string =
    this.configService.getOrThrow('DATABASE_PASSWORD');

  private changesPollInterval: number = Number(
    this.configService.getOrThrow('CHANGES_POLL_INTERVAL'),
  );

  private authHeaderValue: string;

  constructor(
    private couchdbClient: CouchDbClient,
    private configService: ConfigService,
  ) {
    super();
    const authHeader = Buffer.from(
      `${this.databaseUser}:${this.databasePassword}`,
    ).toString('base64');
    this.authHeaderValue = `Basic ${authHeader}`;
  }

  private changesSubj = new ReplaySubject<DatabaseChangeResult[]>(1);
  private changesSubscription: Subscription | undefined;

  subscribeToAllNewChanges(
    includeDocs: boolean = false,
  ): Observable<DatabaseChangeResult[]> {
    if (!this.changesSubscription) {
      let lastSeq = 'now';
      const changesFeed = of({}).pipe(
        mergeMap(() => this.fetchChanges(lastSeq, true, includeDocs)),
        filter((res) => res.last_seq !== lastSeq),
        tap((res) => (lastSeq = res.last_seq)),
        // poll regularly to get latest changes
        repeat({
          delay: this.changesPollInterval,
        }),
        tap((res) => console.log('incoming couchdb changes', res)),
      );

      this.changesSubscription = changesFeed
        .pipe(map((res) => res.results))
        .subscribe(this.changesSubj);
    }

    return this.changesSubj.asObservable().pipe(
      finalize(() => {
        if (!this.changesSubj.observed) {
          // stop polling
          this.changesSubscription?.unsubscribe();
          this.changesSubscription = undefined;
        }
      }),
    );
  }

  subscribeToAllNewChangesWithDocs(): Observable<DocChangeDetails> {
    return this.subscribeToAllNewChanges(true).pipe(
      mergeAll(),
      tap((change) => console.log('new couchdb change', change)),
      switchMap((change) =>
        this.getPreviousRevOfDoc(change.id).pipe(
          map((doc) => ({
            change,
            newDoc: change.doc,
            previousDoc: doc,
          })),
        ),
      ),
      tap((change) => console.log('new change details', change)),
    );
  }

  private getPreviousRevOfDoc(
    docId: string,
  ): Observable<EntityDoc | undefined> {
    return this.findLastRev(docId).pipe(
      switchMap((previousRev) => {
        if (!previousRev) {
          return of(undefined);
        }

        return this.couchdbClient.getDatabaseDocument<EntityDoc>(
          this.dbUrl,
          this.databaseName,
          docId,
          {
            params: { rev: previousRev },
            headers: { Authorization: this.authHeaderValue },
          },
        );
      }),
    );
  }

  /**
   * query the previous _rev (directly before the current version) of a doc
   * @param docId
   * @private
   */
  private findLastRev(docId: string): Observable<string | undefined> {
    return this.couchdbClient
      .getDatabaseDocument<EntityDoc | { _revs_info: CouchDbDocRevsInfo }>(
        this.dbUrl,
        this.databaseName,
        docId,
        {
          params: { revs_info: true },
          headers: { Authorization: this.authHeaderValue },
        },
      )
      .pipe(
        map((doc) => {
          const revsInfo: CouchDbDocRevsInfo = doc._revs_info;
          if (revsInfo?.length > 1 && revsInfo[1].status === 'available') {
            return revsInfo[1].rev;
          } else {
            return undefined;
          }
        }),
      );
  }

  /**
   * Get the changes since the given sequence number
   *
   * @param since The sequence number to start from (optional, if not given start from now only)
   * @param getAllPending Whether to trigger multiple requests and emit multiple values before completing, in case the first request has more pending changes
   * @param includeDocs Whether the full document should be returned for each change
   */
  fetchChanges(
    since = 'now',
    getAllPending = false,
    includeDocs = false,
  ): Observable<CouchDbChangesResponse> {
    return this.couchdbClient
      .changes(this.dbUrl, this.databaseName, {
        params: {
          since: since,
          include_docs: includeDocs,
        },
        headers: {
          Authorization: this.authHeaderValue,
        },
      })
      .pipe(
        // get all changes, if necessary in multiple requests:
        expand((res) =>
          getAllPending && res.pending > 0
            ? this.fetchChanges(res.last_seq)
            : EMPTY,
        ),
        catchError((err, caught) => {
          this.handleError(err);
          throw caught;
        }),
      );
  }

  private handleError(err: any) {
    if (err.response?.status === 401) {
      throw new UnauthorizedException();
    }
    if (err.response?.status === 403) {
      throw new ForbiddenException();
    }
    if (err.response?.status === 404) {
      throw new NotFoundException();
    }

    console.error(err);
    throw new InternalServerErrorException();
  }
}

/**
 * see https://docs.couchdb.org/en/stable/api/document/common.html#obtaining-an-extended-revision-history
 */
type CouchDbDocRevsInfo = {
  rev: string;
  /**
   * Status of the revision. Maybe one of:
   *
   * available: Revision is available for retrieving with rev query parameter
   * missing: Revision is not available
   * deleted: Revision belongs to deleted document
   */
  status: 'available' | 'missing' | 'deleted';
}[];
