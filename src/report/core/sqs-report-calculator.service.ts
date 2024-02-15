import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReportCalculator } from './report-calculator';
import { ReportData } from '../../domain/report-data';
import { map, mergeAll, Observable, switchMap } from 'rxjs';
import { ReportCalculation } from '../../domain/report-calculation';
import { DefaultReportStorage } from '../storage/report-storage.service';
import { CouchSqsClient } from '../../couchdb/couch-sqs.client';
import { v4 as uuidv4 } from 'uuid';
import { Reference } from '../../domain/reference';

@Injectable()
export class SqsReportCalculator implements ReportCalculator {
  constructor(
    private sqsClient: CouchSqsClient,
    private reportStorage: DefaultReportStorage,
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
          throw new BadRequestException();
        }

        return report.queries.flatMap((query) => {
          return this.sqsClient
            .executeQuery('/app/_design/sqlite:config', {
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
