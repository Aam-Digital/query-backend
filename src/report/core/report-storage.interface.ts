import { Reference } from '../../domain/reference';
import { Report } from '../../domain/report';
import { Observable, Subject } from 'rxjs';
import { ReportCalculation } from '../../domain/report-calculation';
import { ReportData } from '../../domain/report-data';

export interface IReportingStorage {
  fetchAllReports(authToken: string, mode: string): Observable<Report[]>;

  fetchReport(
    reportRef: Reference,
    authToken?: string | undefined,
  ): Observable<Report | undefined>;

  fetchPendingCalculations(): Observable<ReportCalculation[]>;

  fetchCalculations(reportRef: Reference): Observable<ReportCalculation[]>;

  fetchCalculation(
    runRef: Reference,
  ): Observable<ReportCalculation | undefined>;

  storeCalculation(run: ReportCalculation): Observable<ReportCalculation>;

  storeData(runData: ReportData): Observable<ReportData>;

  fetchData(runRef: Reference): Observable<ReportData | undefined>;

  isCalculationOngoing(reportRef: Reference): Observable<boolean>;

  reportCalculationUpdated: Subject<ReportCalculation>;
}
