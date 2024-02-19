import { Reference } from '../../domain/reference';
import { Report } from '../../domain/report';
import { IReportStorage } from '../core/i-report-storage';
import { ReportRepository } from '../repository/report-repository.service';
import { map, Observable, Subject, switchMap, tap } from 'rxjs';
import { NotFoundException } from '@nestjs/common';
import {
  ReportCalculation,
  ReportCalculationStatus,
} from '../../domain/report-calculation';
import {
  ReportCalculationEntity,
  ReportCalculationRepository,
} from '../repository/report-calculation-repository.service';
import { ReportData } from '../../domain/report-data';

export class ReportingStorage implements IReportStorage {
  constructor(
    private reportRepository: ReportRepository,
    private reportCalculationRepository: ReportCalculationRepository,
  ) {}

  reportCalculationUpdated = new Subject<ReportCalculation>();

  fetchAllReports(authToken: string, mode = 'sql'): Observable<Report[]> {
    return this.reportRepository.fetchReports(authToken).pipe(
      map((response) => {
        if (!response || !response.rows) {
          return [];
        }

        return response.rows
          .filter((row) => row.doc.mode === mode)
          .map((reportEntity) =>
            new Report(
              reportEntity.id,
              reportEntity.doc.title,
              reportEntity.doc.aggregationDefinitions,
              reportEntity.doc.mode,
            ).setSchema({
              fields: reportEntity.doc.aggregationDefinitions, // todo generate actual fields here
            }),
          );
      }),
    );
  }

  fetchReport(
    reportRef: Reference,
    authToken?: string | undefined,
  ): Observable<Report | undefined> {
    return this.reportRepository.fetchReport(reportRef.id, authToken).pipe(
      map((report) => {
        return new Report(
          report._id,
          report.title,
          report.aggregationDefinitions,
          report.mode,
        ).setSchema({
          fields: report.aggregationDefinitions, // todo generate actual fields here
        });
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
        tap((calculation) => this.reportCalculationUpdated.next(calculation)),
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