import { Injectable } from '@nestjs/common';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import {
  ReportCalculation,
  ReportCalculationStatus,
} from '../../domain/report-calculation';
import { DefaultReportStorage } from '../storage/report-storage.service';
import { SqsReportCalculator } from '../core/sqs-report-calculator.service';
import { ReportData } from '../../domain/report-data';

@Injectable()
export class ReportCalculationProcessor {
  constructor(
    private reportStorage: DefaultReportStorage,
    private reportCalculator: SqsReportCalculator,
  ) {}

  processNextPendingCalculation(): Observable<void> {
    return this.reportStorage.fetchPendingCalculations().pipe(
      switchMap((calculations) => {
        const next = calculations.pop();

        if (!next) {
          return of();
        }

        return this.reportStorage
          .storeCalculation(
            next
              .setStatus(ReportCalculationStatus.RUNNING)
              .setStartDate(new Date().toISOString()),
          )
          .pipe(
            switchMap((reportCalculation) =>
              this.reportCalculator.calculate(reportCalculation).pipe(
                switchMap((reportData) =>
                  this.reportStorage
                    .storeData(reportData)
                    .pipe(
                      switchMap(() =>
                        this.markCalculationAsFinishedSuccess(
                          reportCalculation,
                          reportData,
                        ),
                      ),
                    )
                    .pipe(switchMap(() => of())),
                ),
              ),
            ),
            catchError((err) =>
              this.markCalculationAsFinishedError(next, err).pipe(
                map(() => {
                  throw err;
                }),
              ),
            ),
          );
      }),
    );
  }

  private markCalculationAsFinishedSuccess(
    reportCalculation: ReportCalculation,
    reportData: ReportData,
  ): Observable<ReportCalculation> {
    return this.reportStorage.storeCalculation(
      reportCalculation
        .setStatus(ReportCalculationStatus.FINISHED_SUCCESS)
        .setOutcome({
          result_hash: reportData.asHash(),
        })
        .setEndDate(new Date().toISOString()),
    );
  }

  private markCalculationAsFinishedError(
    reportCalculation: ReportCalculation,
    err: any,
  ): Observable<ReportCalculation> {
    return this.reportStorage.storeCalculation(
      reportCalculation
        .setStatus(ReportCalculationStatus.FINISHED_ERROR)
        .setOutcome({
          errorCode: 'CALCULATION_FAILED',
          errorMessage: err,
        })
        .setEndDate(new Date().toISOString()),
    );
  }
}
