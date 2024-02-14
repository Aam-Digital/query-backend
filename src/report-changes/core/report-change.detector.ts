import { Report } from '../../domain/report';
import { DocChangeDetails } from './couchdb-report-changes.service';

export class ReportChangeDetector {
  private report?: Report;
  private sqlTableNames: string[] = [];

  constructor(report: Report) {
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

/**
 * A doc in the database representing an entity managed in the frontend.
 */
export interface EntityDoc {
  _id: string;

  [key: string]: any;
}
