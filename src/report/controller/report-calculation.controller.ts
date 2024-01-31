import {
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { DefaultReportStorage } from '../storage/report-storage.service';
import { map, Observable } from 'rxjs';
import { ReportCalculation } from '../../domain/report-calculation';
import { Reference } from '../../domain/reference';
import { ReportData } from '../../domain/report-data';

@Controller('/report-calculation')
export class ReportCalculationController {
  constructor(private reportStorage: DefaultReportStorage) {}

  @Get('/report/:reportId')
  fetchReportCalculations(
    @Headers('Authorization') token: string,
    @Param('reportId') reportId: string,
  ): Observable<ReportCalculation[]> {
    return this.reportStorage.fetchCalculations(new Reference(reportId));
  }

  @Get('/:calculationId')
  fetchRun(
    @Headers('Authorization') token: string,
    @Param('calculationId') calculationId: string,
  ): Observable<ReportCalculation> {
    return this.reportStorage
      .fetchCalculation(new Reference(calculationId))
      .pipe(
        map((value) => {
          if (!value) {
            throw new NotFoundException();
          }
          return value;
        }),
      );
  }

  @Get('/:calculationId/data')
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
