import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { IReportCalculator } from './report-calculator.interface';
import { ReportData } from '../../domain/report-data';
import { map, mergeAll, Observable, switchMap } from 'rxjs';
import { ReportCalculation } from '../../domain/report-calculation';
import { v4 as uuidv4 } from 'uuid';
import { Reference } from '../../domain/reference';
import { IReportingStorage } from './report-storage.interface';
import { IQueryService } from '../../query/core/query-service.interface';

export class ReportCalculator implements IReportCalculator {
  constructor(
    private queryService: IQueryService,
    private reportStorage: IReportingStorage,
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
          return this.queryService
            .executeQuery({
              query: query,
            })
            .pipe(
              map((queryResult) => {
                return new ReportData(
                  `ReportData:${uuidv4()}`,
                  reportCalculation.report,
                  new Reference(reportCalculation.id),
                ).setData(queryResult.result);
              }),
            );
        });
      }),
      mergeAll(),
    );
  }
}
