import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, forkJoin, map, Observable, switchMap } from 'rxjs';
import { QueryRequest } from '../domain/QueryRequest';
import { QueryResult } from '../domain/QueryResult';
import { SqsSchemaService } from './sqs-schema-generator.service';

export class CouchSqsClientConfig {
  BASE_URL = '';
  BASIC_AUTH_USER = '';
  BASIC_AUTH_PASSWORD = '';
}

export class SqsClient {
  private readonly logger: Logger = new Logger(SqsClient.name);

  constructor(
    private httpService: HttpService,
    private schemaService: SqsSchemaService,
  ) {}

  executeQuery(query: QueryRequest): Observable<QueryResult> {
    const schemaPath = this.schemaService.getSchemaPath();
    return this.schemaService.updateSchema().pipe(
      switchMap(() =>
        this.httpService.post(schemaPath, query).pipe(
          map((response) => new QueryResult(response.data)),
          catchError((err) => {
            this.logger.error(err);
            this.logger.debug(
              '[CouchSqsClient] Could not execute Query: ',
              this.httpService.axiosRef.defaults.url,
              schemaPath,
              query,
            );
            throw err;
          }),
        ),
      ),
    );
  }

  executeQueries(queries: QueryRequest[]): Observable<QueryResult[]> {
    return forkJoin(
      queries.map((queryRequest) => this.executeQuery(queryRequest)),
    );
  }
}
