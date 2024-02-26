import { Logger } from '@nestjs/common';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import {
  ReportCalculation,
  ReportCalculationStatus,
} from '../../domain/report-calculation';
import { ReportData } from '../../domain/report-data';
import { IReportCalculator } from '../core/report-calculator.interface';
import { IReportingStorage } from '../core/report-storage.interface';

export class ReportCalculationProcessor {
  private readonly logger = new Logger(ReportCalculationProcessor.name);

  constructor(
    private reportStorage: IReportingStorage,
    private reportCalculator: IReportCalculator,
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
      catchError((err) => {
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
