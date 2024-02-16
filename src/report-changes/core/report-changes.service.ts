import { Injectable } from '@nestjs/common';
import { ReportChangeDetector } from './report-change-detector';
import { NotificationService } from '../../notification/core/notification.service';
import { Reference } from '../../domain/reference';
import { ReportDataChangeEvent } from '../../domain/report-data-change-event';
import { ReportCalculationOutcomeSuccess } from '../../domain/report-calculation';
import { Report } from '../../domain/report';
import { CouchdbChangesService } from '../storage/couchdb-changes.service';
import { DefaultReportStorage } from '../../report/storage/report-storage.service';
import { filter, map, Observable, switchMap, tap, zip } from 'rxjs';
import {
  CreateReportCalculationFailed,
  CreateReportCalculationUseCase,
} from '../../report/core/use-cases/create-report-calculation-use-case.service';
import {
  DatabaseChangeResult,
  DocChangeDetails,
} from '../storage/database-changes.service';

@Injectable()
export class ReportChangesService {
  private reportMonitors = new Map<string, ReportChangeDetector>();

  constructor(
    private notificationService: NotificationService,
    private reportStorage: DefaultReportStorage,
    private couchdbChangesRepository: CouchdbChangesService,
    private createReportCalculation: CreateReportCalculationUseCase,
  ) {
    this.notificationService
      .activeReports()
      .subscribe((reports: Reference[]) => {
        reports.forEach((r) => this.registerReportMonitoring(r));
        for (const [id, monitor] of this.reportMonitors.entries()) {
          if (!reports.some((r) => r.id === id)) {
            this.reportMonitors.delete(id);
          }
        }
      });

    this.monitorCouchDbChanges();
  }

  async registerReportMonitoring(report: Reference) {
    if (!this.reportMonitors.has(report.id)) {
      this.setReportMonitor(report);
    }
  }

  private setReportMonitor(report: Reference) {
    this.reportStorage
      .fetchReport(report)
      .subscribe((report: Report | undefined) => {
        if (!report) {
          return;
        }

        this.reportMonitors.set(report.id, new ReportChangeDetector(report));
      });
  }

  private checkReportConfigUpdate(change: DatabaseChangeResult) {
    if (this.reportMonitors.has(change.id)) {
      this.setReportMonitor(new Reference(change.id));
      return;
    }

    // TODO: reportId should in future be without prefix, probably?
    //       (then remove to fallback code above)
    const id = change.id.split(':');
    if (
      id.length === 2 &&
      id[0] === 'ReportConfig' &&
      this.reportMonitors.has(id[1])
    ) {
      this.setReportMonitor(new Reference(change.id));
    }
  }

  monitorCouchDbChanges() {
    this.couchdbChangesRepository
      .subscribeToAllNewChangesWithDocs()
      .pipe(
        tap((change: DocChangeDetails) =>
          this.checkReportConfigUpdate(change.change),
        ),
        switchMap((change: DocChangeDetails) =>
          this.changeIsAffectingReport(change),
        ),
        // TODO: collect a batch of changes for a while before checking?
      )
      .subscribe((affectedReports: ReportDataChangeEvent[]) => {
        affectedReports.forEach((event) => {
          this.notificationService.triggerNotification(event);
          console.log('Report change detected:', event);
        });
      });
  }

  private changeIsAffectingReport(
    docChange: DocChangeDetails,
  ): Observable<ReportDataChangeEvent[]> {
    const affectedReports: Observable<ReportDataChangeEvent>[] = [];

    for (const [reportId, changeDetector] of this.reportMonitors.entries()) {
      if (!changeDetector.affectsReport(docChange)) {
        continue;
      }

      const reportChangeEventObservable =
        this.calculateNewReportData(changeDetector);

      affectedReports.push(reportChangeEventObservable);
    }

    return zip(affectedReports);
  }

  private calculateNewReportData(changeDetector: ReportChangeDetector) {
    return this.createReportCalculation
      .startReportCalculation(changeDetector.report)
      .pipe(
        switchMap((outcome) => {
          if (outcome instanceof CreateReportCalculationFailed) {
            const err = new Error('Report calculation failed');
            console.error(err);
            // TODO: what do we do here in case of failure?
            throw err;
          }

          return this.createReportCalculation.getCompletedReportCalculation(
            new Reference(outcome.result.id),
          );
        }),
        filter(
          (calcUpdate) =>
            (calcUpdate.outcome as ReportCalculationOutcomeSuccess)
              ?.result_hash !== changeDetector.lastCalculationHash,
        ),
        tap(
          (calcUpdate) =>
            (changeDetector.lastCalculationHash = (
              calcUpdate.outcome as ReportCalculationOutcomeSuccess
            )?.result_hash),
        ),
        map(
          (result) =>
            ({
              report: result.report,
              calculation: result,
            } as ReportDataChangeEvent),
        ),
      );
  }
}
