import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ReportCalculator } from './report-calculator';
import { ReportData } from '../../domain/report-data';
import { map, mergeAll, Observable, switchMap } from 'rxjs';
import { ReportCalculation } from '../../domain/report-calculation';
import { ReportingStorage } from '../storage/reporting-storage.service';
import { CouchSqsClient } from '../sqs/couch-sqs.client';
import { v4 as uuidv4 } from 'uuid';
import { Reference } from '../../domain/reference';

export class SqsReportCalculator implements ReportCalculator {
  constructor(
    private sqsClient: CouchSqsClient,
    private reportStorage: ReportingStorage,
  ) {}

  calculate(reportCalculation: ReportCalculation): Observable<ReportData> {
    return this.reportStorage.fetchReport(reportCalculation.report).pipe(
      switchMap((report) => {
        if (!report) {
          throw new NotFoundException();
        }

        if (report.mode !== 'sql') {
          throw new BadRequestException();
        }

        if (report.queries.length === 0) {
          throw new InternalServerErrorException();
        }

        return report.queries.flatMap((query) => {
          return this.sqsClient
            .executeQuery({
              query: query,
              args: [], // TODO pass args here
            })
            .pipe(
              map((rawResponse) => {
                return new ReportData(
                  `ReportData:${uuidv4()}`,
                  reportCalculation.report,
                  new Reference(reportCalculation.id),
                ).setData(rawResponse);
              }),
            );
        });
      }),
      mergeAll(),
    );
  }
}
