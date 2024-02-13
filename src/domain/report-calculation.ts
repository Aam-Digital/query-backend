import { Reference } from './reference';

export enum ReportCalculationStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  FINISHED_SUCCESS = 'FINISHED_SUCCESS',
  FINISHED_ERROR = 'FINISHED_ERROR',
}

export type ReportCalculationOutcome =
  | ReportCalculationOutcomeSuccess
  | ReportCalculationOutcomeError;

export interface ReportCalculationOutcomeSuccess {
  result_hash: string;
}

export interface ReportCalculationOutcomeError {
  errorCode: string;
  errorMessage: string;
}

/**
 * A ReportCalculation represents a calculation run for a specific Report.
 * A Report can have multiple ReportCalculations.
 */
export class ReportCalculation {
  id: string;
  report: Reference;
  status: ReportCalculationStatus;
  start_date: string | null;
  end_date: string | null;
  outcome: ReportCalculationOutcome | null;

  constructor(id: string, report: Reference) {
    this.id = id;
    this.report = report;
    this.status = ReportCalculationStatus.PENDING;
    this.start_date = null;
    this.end_date = null;
    this.outcome = null;
  }

  setStatus(status: ReportCalculationStatus): ReportCalculation {
    this.status = status;
    return this;
  }

  setStartDate(startDate: string | null): ReportCalculation {
    this.start_date = startDate;
    return this;
  }

  setEndDate(endDate: string | null): ReportCalculation {
    this.end_date = endDate;
    return this;
  }

  setOutcome(outcome: ReportCalculationOutcome | null): ReportCalculation {
    this.outcome = outcome;
    return this;
  }
}
