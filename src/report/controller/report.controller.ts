import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
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
import { JwtAuthGuard } from '../../auth/core/jwt-auth.guard';
import { Scopes } from '../../auth/core/scopes.decorator';

@Controller('/api/v1/reporting')
export class ReportController {
  constructor(private reportStorage: ReportingStorage) {}

  @Get('/report')
  @UseGuards(JwtAuthGuard)
  @Scopes(['reporting_read'])
  fetchReports(): Observable<ReportDto[]> {
    return this.reportStorage.fetchAllReports('sql').pipe(
      mergeMap((reports: Report[]) =>
        reports.map((report) => this.getReportDto(report)),
      ),
      zipAll(),
      defaultIfEmpty([]),
    );
  }

  @Get('/report/:reportId')
  @UseGuards(JwtAuthGuard)
  @Scopes(['reporting_read'])
  fetchReport(@Param('reportId') reportId: string): Observable<ReportDto> {
    return this.reportStorage.fetchReport(new Reference(reportId)).pipe(
      switchMap((report) => {
        if (!report) {
          throw new NotFoundException();
        }

        return this.getReportDto(report as any);
      }),
    );
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
