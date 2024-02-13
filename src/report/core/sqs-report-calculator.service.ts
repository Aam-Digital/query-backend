import { Injectable } from '@nestjs/common';
import { ReportCalculator } from './report-calculator';
import { ReportData } from '../../domain/report-data';
import { delay, Observable, of } from 'rxjs';
import { ReportCalculation } from '../../domain/report-calculation';
import { Reference } from '../../domain/reference';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SqsReportCalculator implements ReportCalculator {
  calculate(reportCalculation: ReportCalculation): Observable<ReportData> {
    return of(
      new ReportData(
        `ReportData:${uuidv4()}`,
        reportCalculation.report,
        new Reference(reportCalculation.id),
      ).setData({
        foo: 'bar',
        dummyReportData: 'foo',
      }),
    ).pipe(delay(5000));
  }
}
