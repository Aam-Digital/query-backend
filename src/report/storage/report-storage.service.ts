import { Reference } from '../../domain/reference';
import { Report } from '../../domain/report';
import { ReportStorage } from '../core/report-storage';
import { ReportRepository } from '../repository/report-repository.service';
import { map, Observable } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { ReportData } from 'src/domain/report-data';
import { ReportCalculation } from 'src/domain/report-calculation';
import { ReportCalculationRepository } from '../repository/report-calculation-repository.service';

@Injectable()
export class DefaultReportStorage implements ReportStorage {
  constructor(
    private reportRepository: ReportRepository,
    private reportCalculationRepository: ReportCalculationRepository,
  ) {}

  fetchAllReports(authToken: string): Observable<Report[]> {
    return this.reportRepository.fetchReports(authToken).pipe(
      map((response) => {
        return response.rows.map((reportEntity) =>
          new Report(reportEntity.id, reportEntity.doc.title).setSchema(
            reportEntity.doc.aggregationDefinitions,
          ),
        );
      }),
    );
  }

  fetchReport(authToken: string, reportRef: Reference): Observable<Report> {
    return this.reportRepository.fetchReport(authToken, reportRef.id).pipe(
      map((reportDoc) => {
        return new Report(reportDoc._id, reportDoc.title).setSchema(
          reportDoc.aggregationDefinitions,
        );
      }),
    );
  }

  isCalculationOngoing(reportRef: Reference): boolean {
    return this.reportCalculationRepository.isCalculationOngoing(reportRef);
  }

  fetchPendingCalculations(): Observable<ReportCalculation[]> {
    return this.reportCalculationRepository.fetchPendingCalculations();
  }

  fetchCalculations(reportRef: Reference): Observable<ReportCalculation[]> {
    return this.reportCalculationRepository.fetchCalculations(reportRef);
  }

  fetchCalculation(
    runRef: Reference,
  ): Observable<ReportCalculation | undefined> {
    return this.reportCalculationRepository.fetchCalculation(runRef);
  }

  storeCalculation(
    reportRun: ReportCalculation,
  ): Observable<ReportCalculation> {
    return this.reportCalculationRepository.storeCalculation(reportRun);
  }

  storeData(runData: ReportData): Observable<ReportData> {
    return this.reportCalculationRepository.storeData(runData);
  }

  fetchData(runRef: Reference): Observable<ReportData | undefined> {
    return this.reportCalculationRepository.fetchData(runRef);
  }
}
