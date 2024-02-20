import { Report } from '../../domain/report';

import { DocChangeDetails } from '../storage/database-changes.service';
import { IReportSchemaGenerator } from '../../report/core/report-schema-generator.interface';

/**
 * Simple class encapsulating the logic to determine if a specific report is affected by a change in the database.
 */
export class ReportChangeDetector {
  public report: Report;
  public lastCalculationHash: string | undefined;

  private sqlTableNames: string[] = [];

  constructor(
    report: Report,
    private reportsSchemaGenerator: IReportSchemaGenerator,
  ) {
    this.report = report;
    this.updateReportConfig(report);
  }

  updateReportConfig(report: Report) {
    this.report = report;

    this.sqlTableNames =
      this.reportsSchemaGenerator.getAffectedEntities(report);
  }

  affectsReport(doc: DocChangeDetails): boolean {
  // TODO: consider removing the ReportChangeDetector class completely:
  //    do all query parsing in ReportSchemaGenerator and implement the conditions directly in ReportChangesService?
    const entityType = doc.change.id.split(':')[0];
    if (!this.sqlTableNames.includes(entityType)) {
      return false;
    }

    // TODO: better detection if doc affects report
    return true;
  }
}
