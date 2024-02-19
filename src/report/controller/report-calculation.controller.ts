import {
  Controller,
  Get,
  Headers,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ReportingStorage } from '../storage/reporting-storage.service';
import { map, Observable, switchMap } from 'rxjs';
import { ReportCalculation } from '../../domain/report-calculation';
import { Reference } from '../../domain/reference';
import { ReportData } from '../../domain/report-data';
import {
  CreateReportCalculationFailed,
  CreateReportCalculationUseCase,
} from '../core/use-cases/create-report-calculation-use-case.service';

@Controller('/api/v1/reporting')
export class ReportCalculationController {
  constructor(
    private reportStorage: ReportingStorage,
    private createReportCalculation: CreateReportCalculationUseCase,
  ) {}

  @Post('/report-calculation/report/:reportId')
  startCalculation(
    @Headers('Authorization') token: string,
    @Param('reportId') reportId: string,
  ): Observable<Reference> {
    return this.reportStorage.fetchReport(new Reference(reportId), token).pipe(
      switchMap((value) => {
        if (!value) {
          throw new NotFoundException();
        }

        return this.createReportCalculation.startReportCalculation(value).pipe(
          map((outcome) => {
            if (outcome instanceof CreateReportCalculationFailed) {
              // TODO: other error codes?
              throw new InternalServerErrorException();
            }

            return new Reference(outcome.result.id);
          }),
        );
      }),
    );
  }

  @Get('/report-calculation/report/:reportId')
  fetchReportCalculations(
    @Headers('Authorization') token: string,
    @Param('reportId') reportId: string,
  ): Observable<ReportCalculation[]> {
    return this.reportStorage.fetchCalculations(new Reference(reportId));
  }

  @Get('/report-calculation/:calculationId')
  fetchRun(
    @Headers('Authorization') token: string,
    @Param('calculationId') calculationId: string,
  ): Observable<ReportCalculation> {
    return this.reportStorage
      .fetchCalculation(new Reference(calculationId))
      .pipe(
        switchMap((calculation) => {
          if (!calculation) {
            throw new NotFoundException();
          }

          return this.reportStorage
            .fetchReport(new Reference(calculation.report.id), token)
            .pipe(
              map((report) => {
                if (!report) {
                  throw new NotFoundException();
                }

                return calculation;
              }),
            );
        }),
      );
  }

  @Get('/report-calculation/:calculationId/data')
  fetchRunData(
    @Headers('Authorization') token: string,
    @Param('calculationId') calculationId: string,
  ): Observable<ReportData> {
    return this.reportStorage.fetchData(new Reference(calculationId)).pipe(
      map((value) => {
        if (!value) {
          throw new NotFoundException();
        }
        return value;
      }),
    );
  }
}
