import { Injectable, Logger } from '@nestjs/common';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import {
  ReportCalculation,
  ReportCalculationStatus,
} from '../../domain/report-calculation';
import { ReportingStorage } from '../storage/reporting-storage.service';
import { SqsReportCalculator } from '../core/sqs-report-calculator.service';
import { ReportData } from '../../domain/report-data';

@Injectable()
export class ReportCalculationProcessor {
  private readonly logger = new Logger(ReportCalculationProcessor.name);

  constructor(
    private reportStorage: ReportingStorage,
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
      catchError((err, caught) => {
        console.log(err);
        return of();
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
          result_hash: reportData.getDataHash(),
        })
        .setEndDate(new Date().toISOString()),
    );
  }

  private markCalculationAsFinishedError(
    reportCalculation: ReportCalculation,
    err: any,
  ): Observable<ReportCalculation> {
    this.logger.error('CALCULATION_FAILED', err, {
      reportCalculation: reportCalculation,
    });
    return this.reportStorage.storeCalculation(
      reportCalculation
        .setStatus(ReportCalculationStatus.FINISHED_ERROR)
        .setOutcome({
          errorCode: 'CALCULATION_FAILED',
          errorMessage: 'Something went wrong.',
        })
        .setEndDate(new Date().toISOString()),
    );
  }
}
