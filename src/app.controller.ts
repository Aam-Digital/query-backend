import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  HttpException,
  Param,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ApiHeader, ApiParam } from '@nestjs/swagger';
import { catchError, map, mergeMap } from 'rxjs';
import { ReportConfig } from './report-config';

@Controller()
export class AppController {
  private dbUrl = this.configService.get('DATABASE_URL');
  private queryUrl = this.configService.get('QUERY_URL');
  private schemaDocId = this.configService.get('SCHEMA_CONFIG_ID');
  constructor(
    private http: HttpService,
    private configService: ConfigService,
  ) {}

  // TODO also support cookie auth
  @ApiHeader({ name: 'Authorization', required: false })
  @ApiParam({ name: ':db', example: 'app', description: 'Name of database' })
  @Get(':db/:id')
  queryData(
    @Param('id') reportId: string,
    @Param(':db') db: string,
    @Headers('Authorization') token: string,
  ) {
    return this.http
      .get<ReportConfig>(`${this.dbUrl}/${db}/ReportConfig:${reportId}`, {
        headers: { Authorization: token },
      })
      .pipe(
        mergeMap(({ data }) => this.executeReport(data, db)),
        catchError((err) => {
          throw err.response?.data
            ? new HttpException(err.response.data, err.response.status)
            : err;
        }),
      );
  }

  private executeReport(report: ReportConfig, db: string) {
    if (report.mode !== 'sql') {
      throw new BadRequestException('Not an SQL report');
    }
    if (!report.aggregationDefinitions) {
      throw new BadRequestException('Report query not configured');
    }
    return this.http
      .post(`${this.queryUrl}/${db}/${this.schemaDocId}`, {
        query: report.aggregationDefinitions,
      })
      .pipe(map(({ data }) => data));
  }
}
