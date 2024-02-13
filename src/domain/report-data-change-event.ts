import { Reference } from "./reference";

/**
 * Used as notification that a report's calculated results have changed, due to updates in the underlying database.
 */
export interface ReportDataChangeEvent {
  /** The report for which data has changed */
  report: Reference;

  /** The calculation containing the latest data after the change, ready to be fetched */
  calculation: Reference;
}