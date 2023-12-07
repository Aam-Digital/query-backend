import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpException,
  Param,
  Post,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ApiHeader, ApiOperation, ApiParam } from '@nestjs/swagger';
import { catchError, concat, map, mergeMap, toArray } from 'rxjs';
import { SqlReport } from './sql-report';
import { QueryBody } from './query-body.dto';

@Controller()
export class AppController {
  private dbUrl = this.configService.get('DATABASE_URL');
  private queryUrl = this.configService.get('QUERY_URL');
  private schemaDocId = this.configService.get('SCHEMA_CONFIG_ID');
  constructor(
    private http: HttpService,
    private configService: ConfigService,
  ) {}

  // TODO also support cookie auth? Not really required with Keycloak
  @ApiOperation({
    description: `Get the results for the report with the given ID. User needs 'read' access for the requested report entity.`,
  })
  @ApiParam({ name: 'id', description: '(full) ID of the report entity' })
  @ApiParam({ name: 'db', example: 'app', description: 'name of database' })
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description: 'request needs to be authenticated',
  })
  @Post(':db/:id')
  queryData(
    @Param('id') reportId: string,
    @Param('db') db: string,
    @Headers('Authorization') token: string,
    @Body() body?: QueryBody,
  ) {
    return this.http
      .get<SqlReport>(`${this.dbUrl}/${db}/${reportId}`, {
        headers: { Authorization: token },
      })
      .pipe(
        mergeMap(({ data }) => this.executeReport(data, db, body)),
        catchError((err) => {
          console.log('erro', err);
          throw err.response?.data
            ? new HttpException(err.response.data, err.response.status)
            : err;
        }),
      );
  }

  private executeReport(report: SqlReport, db: string, args?: QueryBody) {
    if (report.mode !== 'sql') {
      throw new BadRequestException('Not an SQL report');
    }
    if (!report.aggregationDefinitions) {
      throw new BadRequestException('Report query not configured');
    }

    // execute all requests in sequence
    return concat(
      ...report.aggregationDefinitions.map((query) =>
        this.getQueryResult(query, args, db),
      ),
    ).pipe(
      // combine results of each request
      toArray(),
      map((res) => [].concat(...res)),
    );
  }

  private getQueryResult(query: string, args: QueryBody, db: string) {
    const data: SqsRequest = { query: query };
    if (args?.from && args?.to) {
      data.args = [args.from, args.to];
    }
    return this.http
      .post<any[]>(`${this.queryUrl}/${db}/${this.schemaDocId}`, data)
      .pipe(map(({ data }) => data));
  }
}

/**
 * Request body as required by the SQS service. See SQS docs for more info.
 */
interface SqsRequest {
  query: string;
  args?: any[];
}
