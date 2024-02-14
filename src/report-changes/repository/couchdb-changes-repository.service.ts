import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, Observable } from 'rxjs';
import { CouchDbClient } from '../../couchdb/couch-db-client.service';
import { CouchDbChangesResponse } from '../../couchdb/dtos';

@Injectable()
export class CouchdbChangesRepositoryService {
  // TODO: centralize this config by refactoring couchdbClient and providing configured clients through DI
  // TODO: check if this is the correct db for our changes from app
  private dbUrl: string = this.configService.getOrThrow('DATABASE_URL');
  private databaseName: string = 'app'; // TODO: move to config and clean up .env, clarifying different DBs there
  private databaseUser: string = this.configService.getOrThrow('DATABASE_USER');
  private databasePassword: string =
    this.configService.getOrThrow('DATABASE_PASSWORD');

  private authHeaderValue: string;

  constructor(
    private couchdbClient: CouchDbClient,
    private configService: ConfigService,
  ) {
    const authHeader = Buffer.from(
      `${this.databaseUser}:${this.databasePassword}`,
    ).toString('base64');
    this.authHeaderValue = `Basic ${authHeader}`;
  }

  fetchChanges(): Observable<CouchDbChangesResponse> {
    return this.couchdbClient
      .changes(this.dbUrl, this.databaseName, {
        headers: {
          Authorization: this.authHeaderValue,
        },
      })
      .pipe(
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
