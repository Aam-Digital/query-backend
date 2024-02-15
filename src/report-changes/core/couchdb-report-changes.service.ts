import { Injectable } from '@nestjs/common';
import { EntityDoc, ReportChangeDetector } from './report-change.detector';
import { NotificationService } from '../../notification/core/notification.service';
import { Reference } from '../../domain/reference';
import { ReportDataChangeEvent } from '../../domain/report-data-change-event';
import { ReportCalculation } from '../../domain/report-calculation';
import {
  CouchDbChangeResult,
  CouchDbChangesResponse,
} from '../../couchdb/dtos';
import { Report } from '../../domain/report';
import { ReportChangesService } from './report-changes.service';
import { CouchdbChangesService } from '../storage/couchdb-changes.service';
import { DefaultReportStorage } from '../../report/storage/report-storage.service';
import { map, mergeAll, tap } from 'rxjs';

@Injectable()
export class CouchdbReportChangesService implements ReportChangesService {
  private reportMonitors = new Map<string, ReportChangeDetector>();

  constructor(
    private notificationService: NotificationService,
    private reportStorage: DefaultReportStorage,
    private couchdbChangesRepository: CouchdbChangesService,
  ) {
    this.notificationService
      .activeReports()
      .subscribe((reports: Reference[]) =>
        reports.forEach((r) => this.registerReportMonitoring(r)),
      );

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

  private checkReportConfigUpdate(change: CouchDbChangeResult) {
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
      .subscribeToAllNewChanges()
      .pipe(
        map((changes: CouchDbChangesResponse) => changes.results),
        mergeAll(),
        tap((change: CouchDbChangeResult) =>
          this.checkReportConfigUpdate(change),
        ),
        map((c: CouchDbChangeResult) => this.getChangeDetails(c)),
        map((change: DocChangeDetails) => this.changeIsAffectingReport(change)),
        // TODO: collect a batch of changes for a while before checking?
      )
      .subscribe((affectedReports: ReportDataChangeEvent[]) => {
        affectedReports.forEach((event) => {
          this.notificationService.triggerNotification(event),
            console.log('Report change detected:', event);
        });
      });
  }

  /**
   * Load current and previous doc for advanced change detection across all reports.
   * @param change
   * @private
   */
  private getChangeDetails(change: CouchDbChangeResult): DocChangeDetails {
    // TODO: storage to get any doc from DB (for a _rev also!)
    //       until then, only the .change with the id can be used in ReportChangeDetector
    // can also use ?include_docs=true in the changes request to get the latest doc

    return {
      change: change,
      previous: { _id: '' }, // cache this here to avoid requests?
      new: { _id: '' },
    };
  }

  private changeIsAffectingReport(
    docChange: DocChangeDetails,
  ): ReportDataChangeEvent[] {
    const affectedReports = [];

    for (const [reportId, changeDetector] of this.reportMonitors.entries()) {
      if (!changeDetector.affectsReport(docChange)) {
        continue;
      }

      const reportRef = new Reference(reportId);

      // (!!!) TODO: calculate a new report calculation here (or in ChangeDetector?)
      //           --> move ReportCalculationController implementation into a core service with .triggerCalculation(reportId) method
      // const newResult = await this.reportService.runReportCalculation(reportId);
      // if (newResult.hash !== oldResult.hash)
      const calculation: ReportCalculation = new ReportCalculation(
        'x',
        reportRef,
      );

      const event: ReportDataChangeEvent = {
        report: reportRef,
        calculation: reportRef,
      };

      affectedReports.push(event);
    }

    return affectedReports;
  }
}

export interface DocChangeDetails {
  change: CouchDbChangeResult;
  previous: EntityDoc;
  new: EntityDoc;
}
