import { Report } from '../../domain/report';

export interface IReportSchemaGenerator {
  getTableNamesByQuery(query: string): string[];
  getTableNamesByQueries(queries: string[]): string[][];
  getAffectedEntities(report: Report): string[];
}
