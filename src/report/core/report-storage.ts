import { Reference } from '../../domain/reference';
import { Report } from '../../domain/report';
import { Observable } from 'rxjs';
import { ReportCalculation } from '../../domain/report-calculation';
import { ReportData } from '../../domain/report-data';

export interface ReportStorage {
  // todo: non domain object in parameter
  fetchAllReports(authToken: string): Observable<Report[]>;

  // todo: non domain object in parameter
  fetchReport(
    authToken: string,
    reportRef: Reference,
  ): Observable<Report | undefined>;

  fetchPendingCalculations(): Observable<ReportCalculation[]>;

  fetchCalculations(reportRef: Reference): Observable<ReportCalculation[]>;

  fetchCalculation(
    runRef: Reference,
  ): Observable<ReportCalculation | undefined>;

  storeCalculation(run: ReportCalculation): Observable<ReportCalculation>;

  storeData(runData: ReportData): Observable<ReportData>;

  fetchData(runRef: Reference): Observable<ReportData | undefined>;

  isCalculationOngoing(reportRef: Reference): boolean;
}
