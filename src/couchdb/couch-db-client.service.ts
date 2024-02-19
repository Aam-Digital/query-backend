import { Logger } from '@nestjs/common';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { AxiosHeaders } from 'axios';
import { CouchDbChangesResponse } from './dtos';

export class CouchDbClientConfig {
  BASE_URL = '';
  TARGET_DATABASE = '';
  BASIC_AUTH_USER = '';
  BASIC_AUTH_PASSWORD = '';
}

export class CouchDbClient {
  private readonly logger = new Logger(CouchDbClient.name);

  constructor(private httpService: HttpService) {}

  changes(request: { config?: any }): Observable<CouchDbChangesResponse> {
    return this.httpService
      .get<CouchDbChangesResponse>(`/_changes`, request.config)
      .pipe(
        map((response) => {
          return response.data;
        }),
        catchError((err) => {
          this.handleError(err);
          throw err;
        }),
      );
  }

  headDatabaseDocument(request: { documentId: string; config?: any }) {
    return this.httpService.head(`${request.documentId}`, request.config).pipe(
      catchError((err) => {
        if (err.response.status !== 404) {
          this.handleError(err);
        }
        throw err;
      }),
    );
  }

  getDatabaseDocument<T>(request: {
    documentId: string;
    config?: any;
  }): Observable<T> {
    return this.httpService
      .get<T>(`${request.documentId}`, request.config)
      .pipe(
        map((response) => {
          return response.data;
        }),
        catchError((err) => {
          this.handleError(err);
          throw err;
        }),
      );
  }

  find<T>(request: { query: object; config: any }): Observable<T> {
    return this.httpService
      .post<T>(`_find`, request.query, request.config)
      .pipe(
        map((response) => {
          return response.data;
        }),
        catchError((err) => {
          this.handleError(err);
          throw err;
        }),
      );
  }

  putDatabaseDocument<T>(request: {
    documentId: string;
    body: any;
    config: any;
  }): Observable<T> {
    return this.latestRef({
      documentId: request.documentId,
      config: request.config,
    }).pipe(
      switchMap((rev) => {
        if (rev) {
          if (!request.config.headers) {
            request.config.headers = {};
          }
          request.config.headers['If-Match'] = rev;
        }

        return this.httpService
          .put<T>(request.documentId, request.body, request.config)
          .pipe(
            map((response) => {
              return response.data;
            }),
            catchError((err) => {
              this.handleError(err);
              throw err;
            }),
          );
      }),
    );
  }

  private latestRef(request: {
    documentId: string;
    config?: any;
  }): Observable<string | undefined> {
    return this.headDatabaseDocument({
      documentId: request.documentId,
      config: request.config,
    }).pipe(
      map((response): string | undefined => {
        const headers = response.headers;
        if (headers instanceof AxiosHeaders && headers.has('etag')) {
          return headers['etag'].replaceAll('"', '');
        }
      }),
      catchError((err) => {
        return of(undefined);
      }),
    );
  }

  private handleError(err: any) {
    this.logger.error(err);
  }
}
