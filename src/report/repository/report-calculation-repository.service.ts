import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportCalculation } from '../../domain/report-calculation';
import { Reference } from '../../domain/reference';
import { ReportData } from '../../domain/report-data';
import { map, Observable, switchMap } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { CouchDbClient } from './couch-db-client.service';

export interface ReportCalculationEntity {
  id: string;
  key: string;
  value: {
    rev: string;
  };
  doc: ReportCalculation;
}

export interface FetchReportCalculationsResponse {
  total_rows: number;
  offset: number;
  rows: ReportCalculationEntity[]; // todo use Entity -- remove null values
}

@Injectable()
export class ReportCalculationRepository {
  static readonly REPORT_DATABASE_URL = 'REPORT_DATABASE_URL';
  static readonly REPORT_DATABASE_NAME = 'REPORT_DATABASE_NAME';

  readonly databaseUrl: string;
  readonly databaseName: string;

  readonly authHeaderValue: string;

  constructor(
    private couchDbClient: CouchDbClient,
    private configService: ConfigService,
  ) {
    this.databaseUrl = this.configService.getOrThrow<string>(
      ReportCalculationRepository.REPORT_DATABASE_URL,
    );
    this.databaseName = this.configService.getOrThrow<string>(
      ReportCalculationRepository.REPORT_DATABASE_NAME,
    );

    const authHeader = Buffer.from(
      `${this.configService.getOrThrow<string>(
        'DATABASE_USER',
      )}:${this.configService.getOrThrow<string>('DATABASE_PASSWORD')}`,
    ).toString('base64');
    this.authHeaderValue = `Basic ${authHeader}`;
  }

  storeCalculation(
    reportCalculation: ReportCalculation,
  ): Observable<ReportCalculation> {
    return this.couchDbClient.putDatabaseDocument(
      this.databaseUrl,
      this.databaseName,
      reportCalculation.id,
      reportCalculation,
      {
        headers: {
          Authorization: this.authHeaderValue,
        },
      },
    );
  }

  fetchCalculations(): Observable<FetchReportCalculationsResponse> {
    return this.couchDbClient.getDatabaseDocument<FetchReportCalculationsResponse>(
      this.databaseUrl,
      this.databaseName,
      '_all_docs',
      {
        params: {
          include_docs: true,
        },
        headers: {
          Authorization: this.authHeaderValue,
        },
      },
    );
  }

  fetchCalculation(
    calculationRef: Reference,
  ): Observable<ReportCalculation | undefined> {
    return this.couchDbClient
      .getDatabaseDocument<ReportCalculation>(
        this.databaseUrl,
        this.databaseName,
        calculationRef.id,
        {
          headers: {
            Authorization: this.authHeaderValue,
          },
        },
      )
      .pipe(
        map((rawReportCalculation) =>
          new ReportCalculation(
            rawReportCalculation.id,
            rawReportCalculation.report,
          )
            .setStatus(rawReportCalculation.status)
            .setStartDate(rawReportCalculation.start_date)
            .setEndDate(rawReportCalculation.end_date)
            .setOutcome(rawReportCalculation.outcome),
        ),
      );
  }

  storeData(data: ReportData): Observable<ReportData> {
    return this.fetchCalculation(data.calculation).pipe(
      switchMap((calculation) => {
        if (!calculation) {
          throw new NotFoundException();
        }

        calculation.setOutcome({
          result_hash: data.asHash(),
        });

        // todo store actual data

        return this.couchDbClient
          .putDatabaseDocument(
            this.databaseUrl,
            this.databaseName,
            calculation.id,
            calculation,
            {
              headers: {
                Authorization: this.authHeaderValue,
              },
            },
          )
          .pipe(map(() => data));
      }),
    );
  }

  fetchData(calculationRef: Reference): Observable<ReportData | undefined> {
    return this.fetchCalculation(calculationRef).pipe(
      map((calculation) => {
        if (!calculation) {
          throw new NotFoundException();
        }

        return undefined;
      }),
    );
  }
}
