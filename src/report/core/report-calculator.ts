import { ReportData } from '../../domain/report-data';
import { Observable } from 'rxjs';
import { ReportCalculation } from '../../domain/report-calculation';

export interface ReportCalculator {
  calculate(reportCalculation: ReportCalculation): Observable<ReportData>;
}
