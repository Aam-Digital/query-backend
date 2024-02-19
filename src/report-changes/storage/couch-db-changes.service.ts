import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
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
import {
  DatabaseChangeResult,
  DatabaseChangesService,
  DocChangeDetails,
  EntityDoc,
} from './database-changes.service';

export class CouchDbChangesConfig {
  POLL_INTERVAL = '';
}

/**
 * Access _changes from a CouchDB
 */
export class CouchDbChangesService extends DatabaseChangesService {
  constructor(
    private couchdbClient: CouchDbClient,
    private config: CouchDbChangesConfig,
  ) {
    super();
  }

  private _changesSubj = new ReplaySubject<DatabaseChangeResult[]>(1);
  private _changesSubscription: Subscription | undefined;

  subscribeToAllNewChanges(
    includeDocs = false,
  ): Observable<DatabaseChangeResult[]> {
    if (!this._changesSubscription) {
      let lastSeq = 'now';
      const changesFeed = of({}).pipe(
        mergeMap(() => this.fetchChanges(lastSeq, true, includeDocs)),
        filter((res) => res.last_seq !== lastSeq),
        tap((res) => (lastSeq = res.last_seq)),
        // poll regularly to get latest changes
        repeat({
          delay: Number.parseInt(this.config.POLL_INTERVAL),
        }),
      );

      this._changesSubscription = changesFeed
        .pipe(map((res) => res.results))
        .subscribe(this._changesSubj);
    }

    return this._changesSubj.asObservable().pipe(
      finalize(() => {
        if (!this._changesSubj.observed) {
          // stop polling
          this._changesSubscription?.unsubscribe();
          this._changesSubscription = undefined;
        }
      }),
    );
  }

  subscribeToAllNewChangesWithDocs(): Observable<DocChangeDetails> {
    return this.subscribeToAllNewChanges(true).pipe(
      mergeAll(),
      tap((change) => console.debug('new couchdb change', change)),
      switchMap((change) =>
        this.getPreviousRevOfDoc(change.id).pipe(
          map((doc) => ({
            change,
            newDoc: change.doc,
            previousDoc: doc,
          })),
        ),
      ),
      tap((change) => console.debug('new change details', change)),
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

        return this.couchdbClient.getDatabaseDocument<EntityDoc>({
          documentId: docId,
          config: {
            params: { rev: previousRev },
          },
        });
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
      .getDatabaseDocument<EntityDoc | { _revs_info: CouchDbDocRevsInfo }>({
        documentId: docId,
        config: {
          params: { revs_info: true },
        },
      })
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
      .changes({
        config: {
          params: {
            since: since,
            include_docs: includeDocs,
          },
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
