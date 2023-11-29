import { Controller, Get, Headers, HttpException, Param } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ApiHeader } from '@nestjs/swagger';
import { catchError, map } from 'rxjs';

@Controller()
export class AppController {
  dbUrl = this.configService.get('DATABASE_URL');
  dbUsername = this.configService.get('DATABASE_USERNAME');
  dbPassword = this.configService.get('DATABASE_PASSWORD');
  queryUrl = this.configService.get('QUERY_URL');
  constructor(
    private http: HttpService,
    private configService: ConfigService,
  ) {}

  // TODO also support cookie auth
  @ApiHeader({ name: 'Authorization', required: false })
  @Get(':id')
  queryData(
    @Param('id') reportId: string,
    @Headers('Authorization') token: string,
  ) {
    return this.http
      .get(`${this.dbUrl}/app/ReportConfig:${reportId}`, {
        headers: { Authorization: token },
      })
      .pipe(
        map(({ data }) => data),
        catchError((err) => {
          throw err.response
            ? new HttpException(err.response.data, err.response.status)
            : err;
        }),
      );
  }
}
