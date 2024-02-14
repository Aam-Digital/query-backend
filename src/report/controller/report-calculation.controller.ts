import {
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { DefaultReportStorage } from '../storage/report-storage.service';
import { map, Observable, switchMap } from 'rxjs';
import { ReportCalculation } from '../../domain/report-calculation';
import { Reference } from '../../domain/reference';
import { ReportData } from '../../domain/report-data';
import { v4 as uuidv4 } from 'uuid';

@Controller('/api/v1/reporting')
export class ReportCalculationController {
  constructor(private reportStorage: DefaultReportStorage) {}

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

        return this.reportStorage
          .storeCalculation(
            new ReportCalculation(
              `ReportCalculation:${uuidv4()}`,
              new Reference(reportId),
            ),
          )
          .pipe(
            map((reportCalculation) => new Reference(reportCalculation.id)),
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
