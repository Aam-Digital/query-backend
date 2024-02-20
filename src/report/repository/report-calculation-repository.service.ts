import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ReportCalculation } from '../../domain/report-calculation';
import { Reference } from '../../domain/reference';
import { ReportData } from '../../domain/report-data';
import { catchError, map, Observable, switchMap } from 'rxjs';
import { CouchDbClient } from '../../couchdb/couch-db-client.service';
import { DocSuccess, FindResponse } from '../../couchdb/dtos';

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
  rows: ReportCalculationEntity[];
}

export class ReportCalculationRepository {
  constructor(private couchDbClient: CouchDbClient) {}

  storeCalculation(
    reportCalculation: ReportCalculation,
  ): Observable<DocSuccess> {
    return this.couchDbClient.putDatabaseDocument({
      documentId: reportCalculation.id,
      body: reportCalculation,
      config: {},
    });
  }

  fetchCalculations(): Observable<FetchReportCalculationsResponse> {
    return this.couchDbClient.getDatabaseDocument<FetchReportCalculationsResponse>(
      {
        documentId: '_all_docs',
        config: {
          params: {
            include_docs: true,
            start_key: '"ReportCalculation"',
            end_key: '"ReportCalculation' + '\ufff0"', // ufff0 -> high value unicode character
          },
        },
      },
    );
  }

  fetchCalculation(
    calculationRef: Reference,
  ): Observable<ReportCalculation | undefined> {
    return this.couchDbClient
      .getDatabaseDocument<ReportCalculation>({
        documentId: `${calculationRef.id}`,
        config: {},
      })
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
        catchError((err) => {
          if (err.response.status === 404) {
            throw new NotFoundException();
          }
          throw err;
        }),
      );
  }

  storeData(data: ReportData): Observable<ReportData> {
    return this.couchDbClient
      .putDatabaseDocument({
        documentId: `${data.id}`,
        body: data,
        config: {},
      })
      .pipe(
        switchMap(() => this.fetchCalculation(data.calculation)),
        switchMap((calculation) => {
          if (!calculation) {
            throw new NotFoundException();
          }

          calculation.setOutcome({
            result_hash: data.getDataHash(),
          });

          return this.couchDbClient
            .putDatabaseDocument({
              documentId: `${calculation.id}`,
              body: calculation,
              config: {},
            })
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

        return calculation.id;
      }),
      switchMap((calculationId) => {
        return this.couchDbClient
          .find<FindResponse<ReportData>>({
            query: {
              selector: {
                'calculation.id': { $eq: calculationId },
              },
            },
            config: {},
          })
          .pipe(
            map((value) => {
              if (value.docs && value.docs.length === 1) {
                return value.docs[0];
              } else {
                throw new NotFoundException();
              }
            }),
            catchError((err) => {
              this.handleError(err);
              throw err;
            }),
          );
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
