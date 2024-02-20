import { ReportChangeDetector } from './report-change-detector';
import { NotificationService } from '../../notification/core/notification.service';
import { Reference } from '../../domain/reference';
import { ReportDataChangeEvent } from '../../domain/report-data-change-event';
import { ReportCalculationOutcomeSuccess } from '../../domain/report-calculation';
import { Report } from '../../domain/report';
import { CouchDbChangesService } from '../storage/couch-db-changes.service';
import { ReportingStorage } from '../../report/storage/reporting-storage.service';
import { filter, map, Observable, switchMap, tap, zip } from 'rxjs';
import {
  CreateReportCalculationFailed,
  CreateReportCalculationUseCase,
} from '../../report/core/use-cases/create-report-calculation-use-case.service';
import {
  DatabaseChangeResult,
  DocChangeDetails,
} from '../storage/database-changes.service';
import { IReportSchemaGenerator } from '../../report/core/report-schema-generator.interface';

export class ReportChangesService {
  private reportMonitors = new Map<string, ReportChangeDetector>();

  constructor(
    private notificationService: NotificationService,
    private reportStorage: ReportingStorage,
    private couchdbChangesRepository: CouchDbChangesService,
    private createReportCalculation: CreateReportCalculationUseCase,
    private reportSchemaGenerator: IReportSchemaGenerator,
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

        this.reportMonitors.set(
          report.id,
          new ReportChangeDetector(report, this.reportSchemaGenerator),
        );
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

      const reportChangeEventObservable = this.calculateNewReportData(
        changeDetector,
        docChange,
      );

      affectedReports.push(reportChangeEventObservable);
    }

    return zip(affectedReports);
  }

  private calculateNewReportData(
    changeDetector: ReportChangeDetector,
    docChange: DocChangeDetails,
  ) {
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
        filter((calcUpdate) => {
          if (
            (calcUpdate.outcome as ReportCalculationOutcomeSuccess)
              ?.result_hash !== changeDetector.lastCalculationHash
          ) {
            return true;
          } else {
            console.log(
              'Report calculation did not change from doc',
              changeDetector.report,
              docChange,
            );
            return false;
          }
        }),
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
