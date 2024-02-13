import { ReportDoc } from "../../report/repository/report-repository.service";

export class ReportChangeDetector {
  private report?: ReportDoc;
  private sqlTableNames: string[] = [];

  constructor(report: ReportDoc) {
    this.updateReportConfig(report);
  }

  updateReportConfig(report: ReportDoc) {
    this.report = report;

    this.sqlTableNames = this.getSqlTableNames(report);
  }

  private getSqlTableNames(report: ReportDoc) {
    const sqlFromTableRegex = /FROM\s+(\w+)/g;

    return report.aggregationDefinitions.map((sql: string) =>
      [...sql.matchAll(sqlFromTableRegex)].map(match => match[1] /* matching regex group (table name) */)
    ).flat();
  }

  affectsReport(doc: EntityDoc): boolean {
    const entityType = doc._id.split(":")[0];
    if (this.sqlTableNames.includes(entityType)) {

      // TODO: better detection if doc affects report

      return true;
    }

    return false;
  }
}

/**
 * A doc in the database representing an entity managed in the frontend.
 */
export interface EntityDoc {
  _id: string;

  [key: string]: any;
}