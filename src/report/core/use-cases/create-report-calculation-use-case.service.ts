import { Reference } from '../../../domain/reference';
import { filter, map, merge, Observable, take } from 'rxjs';
import {
  ReportCalculation,
  ReportCalculationStatus,
} from '../../../domain/report-calculation';
import { v4 as uuidv4 } from 'uuid';
import { Report } from '../../../domain/report';
import { ReportingStorage } from '../../storage/reporting-storage.service';

export class CreateReportCalculationUseCase {
  constructor(private reportStorage: ReportingStorage) {}

  startReportCalculation(
    report: Report,
  ): Observable<CreateReportCalculationOutcome> {
    const calculation = new ReportCalculation(
      `ReportCalculation:${uuidv4()}`,
      new Reference(report.id),
    );
    return this.reportStorage
      .storeCalculation(calculation)
      .pipe(
        map((calculation) => new CreateReportCalculationSuccess(calculation)),
      );
  }

  getCompletedReportCalculation(
    reportCalculation: Reference,
  ): Observable<ReportCalculation> {
    return merge(
      this.reportStorage.fetchCalculation(reportCalculation).pipe(
        map((calc) => {
          if (!calc) {
            throw new Error('Report calculation not found');
            // TODO: can this really return undefined? Looks like it would throw instead (which seems a good way to handle it to me)
          }
          return calc as ReportCalculation;
        }),
      ),
      this.reportStorage.reportCalculationUpdated,
    ).pipe(
      filter((calcUpdate) => calcUpdate?.id === reportCalculation.id),
      filter(
        (calcUpdate) =>
          calcUpdate?.status === ReportCalculationStatus.FINISHED_SUCCESS ||
          calcUpdate?.status === ReportCalculationStatus.FINISHED_ERROR,
      ),
      take(1),
    );
  }
}

export type CreateReportCalculationOutcome =
  | CreateReportCalculationSuccess
  | CreateReportCalculationFailed;

export class CreateReportCalculationSuccess {
  constructor(public result: ReportCalculation) {}
}

export class CreateReportCalculationFailed {
  constructor(
    public errorMessage: string,
    public errorCode: CreateReportCalculationError,
    public error?: any,
  ) {}
}

export enum CreateReportCalculationError {
  NotImplemented,
}
