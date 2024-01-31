import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, map, Observable } from 'rxjs';

interface ReportEntity {
  id: string;
  key: string;
  value: {
    rev: string;
  };
  doc: ReportDoc;
}

interface ReportDoc {
  _id: string;
  _rev: string;
  title: string;
  aggregationDefinitions: any; // TODO better typing
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
  rows: ReportEntity[];
}

@Injectable()
export class ReportRepository {
  private dbUrl: string = this.configService.getOrThrow('DATABASE_URL');
  private databaseUser: string = this.configService.getOrThrow('DATABASE_USER');
  private databasePassword: string =
    this.configService.getOrThrow('DATABASE_PASSWORD');

  private authHeaderValue: string;

  constructor(private http: HttpService, private configService: ConfigService) {
    const authHeader = Buffer.from(
      `${this.databaseUser}:${this.databasePassword}`,
    ).toString('base64');
    this.authHeaderValue = `Basic ${authHeader}`;
  }

  fetchReports(authToken: string): Observable<FetchReportsResponse> {
    return this.http
      .get<FetchReportsResponse>(`${this.dbUrl}/app/_all_docs`, {
        params: {
          include_docs: true,
          startkey: '"ReportConfig:"',
          endkey: '"ReportConfig:' + '\ufff0"',
        },
        headers: {
          // Authorization: authToken,
          Authorization: this.authHeaderValue,
        },
      })
      .pipe(
        map((value) => value.data),
        catchError((err, caught) => {
          console.log(err);
          throw caught;
        }),
      );
  }

  fetchReport(authToken: string, reportId: string): Observable<ReportDoc> {
    return this.http
      .get<ReportDoc>(`${this.dbUrl}/app/${reportId}`, {
        headers: {
          // Authorization: authToken,
          Authorization: this.authHeaderValue,
        },
      })
      .pipe(
        map((value) => value.data),
        catchError((err, caught) => {
          console.log(err);
          throw caught;
        }),
      );
  }
}
