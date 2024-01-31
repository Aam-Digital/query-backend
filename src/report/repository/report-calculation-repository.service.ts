import { Injectable } from '@nestjs/common';
import {
  ReportCalculation,
  ReportCalculationStatus,
} from '../../domain/report-calculation';
import { Reference } from '../../domain/reference';
import { ReportData } from '../../domain/report-data';
import { Observable, of } from 'rxjs';

@Injectable()
export class ReportCalculationRepository {
  private _calculationStorage: ReportCalculation[] = [];
  private _dataStorage: ReportData[] = [];

  fetchPendingCalculations(): Observable<ReportCalculation[]> {
    return of(
      this._calculationStorage.filter(
        (value) => value.status === ReportCalculationStatus.PENDING,
      ),
    );
  }

  fetchCalculations(reportRef: Reference): Observable<ReportCalculation[]> {
    return of(
      this._calculationStorage.filter((run) => run.report.id == reportRef.id),
    );
  }

  fetchCalculation(
    calculationRef: Reference,
  ): Observable<ReportCalculation | undefined> {
    return of(
      this._calculationStorage.find((run) => calculationRef.id === run.id),
    );
  }

  storeCalculation(
    calculation: ReportCalculation,
  ): Observable<ReportCalculation> {
    const index = this._calculationStorage.findIndex(
      (item) => item.id === calculation.id,
    );

    if (index === -1) {
      this._calculationStorage.push(calculation);
    } else {
      this._calculationStorage[index] = calculation;
    }

    return of(calculation);
  }

  storeData(data: ReportData): Observable<ReportData> {
    const index = this._dataStorage.findIndex(
      (item) => item.calculation.id === data.calculation.id,
    );

    if (index === -1) {
      this._dataStorage.push(data);
    } else {
      this._dataStorage[index] = data;
    }

    return of(data);
  }

  fetchData(runRef: Reference): Observable<ReportData | undefined> {
    return of(
      this._dataStorage.find(
        (reportData) => reportData.calculation.id == runRef.id,
      ),
    );
  }

  isCalculationOngoing(reportRef: Reference): boolean {
    return (
      this._calculationStorage
        .filter((run) => run.report.id === reportRef.id)
        .filter(
          (run) =>
            run.status === ReportCalculationStatus.PENDING ||
            run.status === ReportCalculationStatus.RUNNING,
        ).length > 0
    );
  }
}
