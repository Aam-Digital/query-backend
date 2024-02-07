import { Controller, Get, Headers, Param } from '@nestjs/common';
import { map, mergeMap, Observable, switchMap, zipAll } from 'rxjs';
import { DefaultReportStorage } from '../storage/report-storage.service';
import { ReportDto } from './dtos';
import { Reference } from '../../domain/reference';
import { Report } from '../../domain/report';

@Controller('/api/v1/reporting')
export class ReportController {
  constructor(private reportStorage: DefaultReportStorage) {}

  @Get('/report')
  fetchReports(
    @Headers('Authorization') token: string,
  ): Observable<ReportDto[]> {
    return this.reportStorage.fetchAllReports(token).pipe(
      mergeMap((reports) => reports.map((report) => this.getReportDto(report))),
      zipAll(),
    );
  }

  @Get('/report/:reportId')
  fetchReport(
    @Headers('Authorization') token: string,
    @Param('reportId') reportId: string,
  ): Observable<ReportDto> {
    return this.reportStorage
      .fetchReport(token, new Reference(reportId))
      .pipe(switchMap((report) => this.getReportDto(report)));
  }
  private getReportDto(report: Report): Observable<ReportDto> {
    return this.reportStorage
      .isCalculationOngoing(new Reference(report.id, 'Report'))
      .pipe(
        map(
          (value) =>
            new ReportDto(report.id, report.name, report.schema, value),
        ),
      );
  }
}
