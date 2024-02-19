import { Report } from '../../domain/report';

import { DocChangeDetails } from '../storage/database-changes.service';

/**
 * Simple class encapsulating the logic to determine if a specific report is affected by a change in the database.
 */
export class ReportChangeDetector {
  public report: Report;
  public lastCalculationHash: string | undefined;

  private sqlTableNames: string[] = [];

  constructor(report: Report) {
    this.report = report;
    this.updateReportConfig(report);
  }

  updateReportConfig(report: Report) {
    this.report = report;

    this.sqlTableNames = this.getSqlTableNames(report);
  }

  private getSqlTableNames(report: Report) {
    const sqlFromTableRegex = /FROM\s+(\w+)/g;

    return report.queries
      .map((sql: string) =>
        [...sql.matchAll(sqlFromTableRegex)].map(
          (match) => match[1] /* matching regex group (table name) */,
        ),
      )
      .flat();
  }

  affectsReport(doc: DocChangeDetails): boolean {
    const entityType = doc.change.id.split(':')[0];
    if (!this.sqlTableNames.includes(entityType)) {
      return false;
    }

    // TODO: better detection if doc affects report
    return true;
  }
}
