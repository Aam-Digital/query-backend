import { Reference } from './reference';
import { ReportCalculation } from './report-calculation';

/**
 * Used as core that a report's calculated results have changed, due to updates in the underlying database.
 */
export interface ReportDataChangeEvent {
  /** The report for which data has changed */
  report: Reference;

  /** The calculation containing the latest data after the change, ready to be fetched */
  calculation: ReportCalculation;
}
