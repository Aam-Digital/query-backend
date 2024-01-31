import { Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { DefaultReportStorage } from '../storage/report-storage.service';
import { ReportDto } from './dtos';
import { Reference } from '../../domain/reference';
import { ReportCalculation } from '../../domain/report-calculation';
import { v4 as uuidv4 } from 'uuid';
import { Report } from '../../domain/report';

@Controller('/report')
export class ReportController {
  constructor(private reportStorage: DefaultReportStorage) {}

  @Get()
  fetchReports(
    @Headers('Authorization') token: string,
  ): Observable<ReportDto[]> {
    return this.reportStorage
      .fetchAllReports(token)
      .pipe(
        map((reports) => reports.map((report) => this.getReportDto(report))),
      );
  }

  @Get('/:reportId')
  fetchReport(
    @Headers('Authorization') token: string,
    @Param('reportId') reportId: string,
  ): Observable<ReportDto> {
    return this.reportStorage
      .fetchReport(token, new Reference(reportId))
      .pipe(map((report) => this.getReportDto(report)));
  }

  @Post('/:reportId/calculation')
  startCalculation(
    @Headers('Authorization') token: string,
    @Param('reportId') reportId: string,
  ): Observable<Reference> {
    return this.reportStorage
      .storeCalculation(
        new ReportCalculation(uuidv4(), new Reference(reportId, 'Report')),
      )
      .pipe(
        map(
          (reportCalculation) =>
            new Reference(reportCalculation.id, 'ReportCalculation'),
        ),
      );
  }

  private getReportDto(report: Report): ReportDto {
    return new ReportDto(
      report.id,
      report.name,
      report.schema,
      this.reportStorage.isCalculationOngoing(
        new Reference(report.id, 'Report'),
      ),
    );
  }
}
