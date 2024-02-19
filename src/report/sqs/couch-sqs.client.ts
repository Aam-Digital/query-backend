import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, map, Observable } from 'rxjs';

export class CouchSqsClientConfig {
  BASE_URL = '';
  BASIC_AUTH_USER = '';
  BASIC_AUTH_PASSWORD = '';
  SCHEMA_DESIGN_CONFIG = '';
}

export interface QueryRequest {
  query: string;
  args?: string[];
}

export class CouchSqsClient {
  private readonly logger: Logger = new Logger(CouchSqsClient.name);

  constructor(
    private httpService: HttpService,
    private config: CouchSqsClientConfig,
  ) {}

  executeQuery(
    query: QueryRequest,
    path: string = this.config.SCHEMA_DESIGN_CONFIG,
  ): Observable<string> {
    return this.httpService.post(path, query).pipe(
      map((response) => response.data),
      catchError((err) => {
        this.logger.error(err);
        this.logger.debug(
          '[CouchSqsClient] Could not execute Query: ',
          this.httpService.axiosRef.defaults.url,
          path,
          query,
        );
        throw err;
      }),
    );
  }
}
