import { Report } from 'src/domain/report';
import { IReportSchemaGenerator } from './report-schema-generator.interface';

export class ReportSchemaGenerator implements IReportSchemaGenerator {
  getTableNamesByQuery(query: string): string[] {
    const pattern = /\bas\s+(\w+)/g;
    const fieldNames: string[] = [];
    let matches: RegExpExecArray | null;

    while ((matches = pattern.exec(query)) !== null) {
      fieldNames.push(matches[1]);
    }

    return fieldNames;
  }

  getTableNamesByQueries(queries: string[]): string[][] {
    return queries.map((query) => this.getTableNamesByQuery(query));
  }

  getAffectedEntities(report: Report): string[] {
    const sqlFromTableRegex = /FROM\s+(\w+)/g;

    return report.queries
      .map((sql: string) =>
        [...sql.matchAll(sqlFromTableRegex)].map(
          (match) => match[1] /* matching regex group (table name) */,
        ),
      )
      .flat();
  }
}
