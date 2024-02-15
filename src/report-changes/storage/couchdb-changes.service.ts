import {
  ForbiddenException,
  Injectable,
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
  mergeMap,
  Observable,
  of,
  repeat,
  ReplaySubject,
  Subscription,
  tap,
} from 'rxjs';
import { CouchDbClient } from '../../couchdb/couch-db-client.service';
import { CouchDbChangesResponse } from '../../couchdb/dtos';
import {
  DatabaseChangeResult,
  DatabaseChangesService,
} from './database-changes.service';

/**
 * Access _changes from a CouchDB
 */
@Injectable()
export class CouchdbChangesService extends DatabaseChangesService {
  // TODO: centralize this config by refactoring couchdbClient and providing configured clients through DI
  // TODO: check if this is the correct db for our changes from app
  private dbUrl: string = this.configService.getOrThrow('DATABASE_URL');
  private databaseName = 'app'; // TODO: move to config and clean up .env, clarifying different DBs there
  private databaseUser: string = this.configService.getOrThrow('DATABASE_USER');
  private databasePassword: string =
    this.configService.getOrThrow('DATABASE_PASSWORD');

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

  subscribeToAllNewChanges(): Observable<DatabaseChangeResult[]> {
    if (!this.changesSubscription) {
      let lastSeq = 'now';
      const changesFeed = of({}).pipe(
        mergeMap(() => this.fetchChanges(lastSeq, true)),
        filter((res) => res.last_seq !== lastSeq),
        tap((res) => (lastSeq = res.last_seq)),
        // poll regularly to get latest changes
        repeat({ delay: 10000 }),
        tap((res) => console.log(res)),
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

  /**
   * Get the changes since the given sequence number
   *
   * @param since The sequence number to start from (optional, if not given start from now only)
   * @param getAllPending Whether to trigger multiple requests and emit multiple values before completing, in case the first request has more pending changes
   */
  fetchChanges(
    since = 'now',
    getAllPending = false,
  ): Observable<CouchDbChangesResponse> {
    return this.couchdbClient
      .changes(this.dbUrl, this.databaseName, {
        params: {
          since: since,
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
    if (err.response.status === 401) {
      throw new UnauthorizedException();
    }
    if (err.response.status === 403) {
      throw new ForbiddenException();
    }
    if (err.response.status === 404) {
      throw new NotFoundException();
    }
  }
}
