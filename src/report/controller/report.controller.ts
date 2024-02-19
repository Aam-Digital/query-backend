import { Controller, Get, Headers, Param } from '@nestjs/common';
import {
  defaultIfEmpty,
  map,
  mergeMap,
  Observable,
  switchMap,
  zipAll,
} from 'rxjs';
import { ReportingStorage } from '../storage/reporting-storage.service';
import { ReportDto } from './dtos';
import { Reference } from '../../domain/reference';
import { Report } from '../../domain/report';

@Controller('/api/v1/reporting')
export class ReportController {
  constructor(private reportStorage: ReportingStorage) {}

  @Get('/report')
  fetchReports(
    @Headers('Authorization') token: string,
  ): Observable<ReportDto[]> {
    return this.reportStorage.fetchAllReports(token, 'sql').pipe(
      mergeMap((reports) => reports.map((report) => this.getReportDto(report))),
      zipAll(),
      defaultIfEmpty([]),
    );
  }

  @Get('/report/:reportId')
  fetchReport(
    @Headers('Authorization') token: string,
    @Param('reportId') reportId: string,
  ): Observable<ReportDto> {
    return this.reportStorage
      .fetchReport(new Reference(reportId), token)
      .pipe(switchMap((report) => this.getReportDto(report as any))); // TODO: fix for undefined report
  }

  private getReportDto(report: Report): Observable<ReportDto> {
    return this.reportStorage
      .isCalculationOngoing(new Reference(report.id))
      .pipe(
        map(
          (value) =>
            new ReportDto(report.id, report.name, report.schema, value),
        ),
      );
  }
}
