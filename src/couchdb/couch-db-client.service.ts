import { Injectable, Logger } from '@nestjs/common';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { AxiosHeaders } from 'axios';
import { CouchDbChangesResponse } from "./dtos";

@Injectable()
export class CouchDbClient {
  private readonly logger = new Logger(CouchDbClient.name);

  constructor(private httpService: HttpService) {
  }

  headDatabaseDocument(
    databaseUrl: string,
    databaseName: string,
    documentId: string,
    config?: any,
  ) {
    return this.httpService
      .head(`${databaseUrl}/${databaseName}/${documentId}`, config)
      .pipe(
        catchError((err) => {
          this.handleError(err);
          throw err;
        }),
      );
  }

  getDatabaseDocument<T>(
    databaseUrl: string,
    databaseName: string,
    documentId: string,
    config?: any,
  ): Observable<T> {
    return this.httpService
      .get<T>(`${databaseUrl}/${databaseName}/${documentId}`, config)
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

  find<T>(
    databaseUrl: string,
    databaseName: string,
    body: any,
    config?: any,
  ): Observable<T> {
    return this.httpService
      .post<T>(`${databaseUrl}/${databaseName}/_find`, body, config)
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

  putDatabaseDocument<T>(
    databaseUrl: string,
    databaseName: string,
    documentId: string,
    body: any,
    config?: any,
  ): Observable<T> {
    return this.latestRef(databaseUrl, databaseName, documentId, config).pipe(
      switchMap((rev) => {
        if (rev) {
          config.headers['If-Match'] = rev;
        }

        return this.httpService
          .put<T>(`${databaseUrl}/${databaseName}/${documentId}`, body, config)
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

  private latestRef(
    databaseUrl: string,
    databaseName: string,
    documentId: string,
    config?: any,
  ): Observable<string | undefined> {
    return this.headDatabaseDocument(
      databaseUrl,
      databaseName,
      documentId,
      config,
    ).pipe(
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
    this.logger.debug(err);
  }


  changes(
    databaseUrl: string,
    databaseName: string,
    config?: any,
  ): Observable<CouchDbChangesResponse> {
    return this.httpService
      .get<CouchDbChangesResponse>(`${databaseUrl}/${databaseName}/_changes`, config)
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
}
