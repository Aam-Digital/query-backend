import {
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  UseGuards,
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
import { JwtAuthGuard } from '../../auth/core/jwt-auth.guard';
import { Scopes } from '../../auth/core/scope.decorator';

@Controller('/api/v1/reporting')
export class ReportCalculationController {
  constructor(
    private reportStorage: ReportingStorage,
    private createReportCalculation: CreateReportCalculationUseCase,
  ) {}

  @Post('/report-calculation/report/:reportId')
  @UseGuards(JwtAuthGuard)
  @Scopes(['reporting_write'])
  startCalculation(@Param('reportId') reportId: string): Observable<Reference> {
    return this.reportStorage.fetchReport(new Reference(reportId)).pipe(
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
  @UseGuards(JwtAuthGuard)
  @Scopes(['reporting_read'])
  fetchReportCalculations(
    @Param('reportId') reportId: string,
  ): Observable<ReportCalculation[]> {
    return this.reportStorage.fetchCalculations(new Reference(reportId));
  }

  @Get('/report-calculation/:calculationId')
  @UseGuards(JwtAuthGuard)
  @Scopes(['reporting_read'])
  fetchRun(
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
            .fetchReport(new Reference(calculation.report.id))
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
  @UseGuards(JwtAuthGuard)
  @Scopes(['reporting_read'])
  fetchRunData(
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
