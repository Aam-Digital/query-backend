import { Injectable } from '@nestjs/common';
import { ReportChangeDetector } from './report-change.detector';
import { NotificationService } from '../../notification/core/notification.service';
import { Reference } from '../../domain/reference';
import { ReportDataChangeEvent } from '../../domain/report-data-change-event';
import { ReportCalculation } from '../../domain/report-calculation';
import { CouchDbClient } from '../../couchdb/couch-db-client.service';
import {
  CouchDbChangeResult,
  CouchDbChangesResponse,
} from '../../couchdb/dtos';
import { Report } from '../../domain/report';
import { ReportChangesService } from './report-changes.service';
import { ReportStorage } from '../../report/core/report-storage';

@Injectable()
export class CouchdbReportChangesService implements ReportChangesService {
  private reportMonitors = new Map<string, ReportChangeDetector>();

  constructor(
    private notificationService: NotificationService,
    private reportStorage: ReportStorage,
    private couchDbClient: CouchDbClient,
  ) {
    // (!) TODO: where to get databaseUrl and databaseName from? Can we centralize this ...?
    this.couchDbClient
      .changes('TODO', 'app')
      .subscribe((changes: CouchDbChangesResponse) => {
        // TODO: ensure continued fetching until all changes done
        // TODO: collect a batch of changes for a while before checking?
        for (const c of changes.results) {
          this.checkIncomingDocChange(c);

          if (this.reportMonitors.has(c.id)) {
            // TODO: reportId in reportMonitors with or without prefix?

            // TODO: load actual current doc (may not be in c.doc?)
            this.reportMonitors.get(c.id)?.updateReportConfig(c.doc);
          }
        }
      });

    this.notificationService
      .activeReports()
      .subscribe((reports: Reference[]) =>
        reports.forEach((r) => this.registerReportMonitoring(r)),
      );
  }

  async registerReportMonitoring(report: Reference) {
    if (!this.reportMonitors.has(report.id)) {
      this.reportStorage
        .fetchReport(report)
        .subscribe((report: Report | undefined) => {
          if (!report) {
            return;
          }

          this.reportMonitors.set(report.id, new ReportChangeDetector(report));
        });
    }
  }

  private checkIncomingDocChange(change: CouchDbChangeResult) {
    const doc = { _id: '' }; // TODO: load doc here?
    for (const [reportId, changeDetector] of this.reportMonitors.entries()) {
      if (!changeDetector.affectsReport(doc)) {
        continue;
      }

      const reportRef = new Reference(reportId);

      // TODO: calculate a new report calculation here? Or in the changeDetector?
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
      this.notificationService.triggerNotification(event);
    }
  }
}
