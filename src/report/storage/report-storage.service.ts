import { Reference } from '../../domain/reference';
import { Report } from '../../domain/report';
import { ReportStorage } from '../core/report-storage';
import { ReportRepository } from '../repository/report-repository.service';
import { map, Observable, switchMap } from 'rxjs';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ReportCalculation,
  ReportCalculationStatus,
} from '../../domain/report-calculation';
import {
  ReportCalculationEntity,
  ReportCalculationRepository,
} from '../repository/report-calculation-repository.service';
import { ReportData } from '../../domain/report-data';

@Injectable()
export class DefaultReportStorage implements ReportStorage {
  constructor(
    private reportRepository: ReportRepository,
    private reportCalculationRepository: ReportCalculationRepository,
  ) {}

  fetchAllReports(authToken: string, mode = 'sql'): Observable<Report[]> {
    return this.reportRepository.fetchReports(authToken).pipe(
      map((response) => {
        if (!response || !response.rows) {
          return [];
        }

        return response.rows
          .filter((row) => row.doc.mode === mode)
          .map((reportEntity) =>
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

  isCalculationOngoing(reportRef: Reference): Observable<boolean> {
    return this.reportCalculationRepository
      .fetchCalculations()
      .pipe(
        map(
          (response) =>
            response.rows
              .filter(
                (reportCalculation) =>
                  reportCalculation.doc.report.id === reportRef.id,
              )
              .filter(
                (reportCalculation) =>
                  reportCalculation.doc.status ===
                    ReportCalculationStatus.PENDING ||
                  reportCalculation.doc.status ===
                    ReportCalculationStatus.RUNNING,
              ).length > 0,
        ),
      );
  }

  fetchPendingCalculations(): Observable<ReportCalculation[]> {
    return this.reportCalculationRepository
      .fetchCalculations()
      .pipe(
        map((response) =>
          response.rows
            .filter(
              (reportCalculation) =>
                reportCalculation.doc.status ===
                ReportCalculationStatus.PENDING,
            )
            .map((entity: ReportCalculationEntity) =>
              this.mapFromEntity(entity),
            ),
        ),
      );
  }

  fetchCalculations(reportRef: Reference): Observable<ReportCalculation[]> {
    return this.reportCalculationRepository
      .fetchCalculations()
      .pipe(
        map((response) =>
          response.rows
            .filter(
              (reportCalculation) =>
                reportCalculation.doc.report.id === reportRef.id,
            )
            .map((entity: ReportCalculationEntity) =>
              this.mapFromEntity(entity),
            ),
        ),
      );
  }

  fetchCalculation(
    calculationRef: Reference,
  ): Observable<ReportCalculation | undefined> {
    return this.reportCalculationRepository.fetchCalculation(calculationRef);
  }

  storeCalculation(
    reportCalculation: ReportCalculation,
  ): Observable<ReportCalculation> {
    return this.reportCalculationRepository
      .storeCalculation(reportCalculation)
      .pipe(
        switchMap((entity) => this.fetchCalculation(new Reference(entity.id))),
        map((value) => {
          if (!value) {
            throw new NotFoundException();
          } else {
            return value;
          }
        }),
      );
  }

  storeData(reportData: ReportData): Observable<ReportData> {
    return this.reportCalculationRepository.storeData(reportData);
  }

  fetchData(calculationRef: Reference): Observable<ReportData | undefined> {
    return this.reportCalculationRepository.fetchData(calculationRef);
  }

  private mapFromEntity(entity: ReportCalculationEntity): ReportCalculation {
    return new ReportCalculation(entity.doc.id, entity.doc.report)
      .setStatus(entity.doc.status)
      .setStartDate(entity.doc.start_date)
      .setEndDate(entity.doc.end_date)
      .setOutcome(entity.doc.outcome);
  }
}
