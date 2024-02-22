import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { catchError, map, Observable } from 'rxjs';
import { CouchDbRow } from '../../couchdb/dtos';
import { CouchDbClient } from '../../couchdb/couch-db-client.service';

export interface ReportDoc {
  _id: string;
  _rev: string;
  title: string;
  mode: string;
  aggregationDefinitions: string[];
  created: {
    at: string;
    by: string;
  };
  updated: {
    at: string;
    by: string;
  };
}

interface FetchReportsResponse {
  total_rows: number;
  offset: number;
  rows: CouchDbRow<ReportDoc>[];
}

export class ReportRepository {
  constructor(private couchDbClient: CouchDbClient) {}

  fetchReports(authToken?: string): Observable<FetchReportsResponse> {
    const config: any = {
      params: {
        include_docs: true,
        startkey: '"ReportConfig:"',
        endkey: '"ReportConfig:' + '\ufff0"',
      },
    };

    if (authToken) {
      config.headers = {
        Authorization: authToken,
      };
    }

    return this.couchDbClient
      .getDatabaseDocument<FetchReportsResponse>({
        documentId: '_all_docs',
        config: config,
      })
      .pipe(
        map((value) => value),
        catchError((err, caught) => {
          this.handleError(err);
          throw caught;
        }),
      );
  }

  fetchReport(
    reportId: string,
    authToken?: string | undefined,
  ): Observable<ReportDoc> {
    const config: any = {};

    if (authToken) {
      config.headers = {
        Authorization: authToken,
      };
    }

    return this.couchDbClient
      .getDatabaseDocument<ReportDoc>({
        documentId: reportId,
        config: config,
      })
      .pipe(
        map((value) => value),
        catchError((err, caught) => {
          this.handleError(err);
          throw caught;
        }),
      );
  }

  private handleError(err: any) {
    console.error(err);

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
