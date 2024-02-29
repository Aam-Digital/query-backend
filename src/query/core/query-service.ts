import { Observable } from 'rxjs';
import { QueryRequest } from '../domain/QueryRequest';
import { QueryResult } from '../domain/QueryResult';
import { IQueryService } from './query-service.interface';
import { SqsClient } from '../sqs/sqs.client';

export class QueryService implements IQueryService {
  constructor(private sqsClient: SqsClient) {}

  executeQuery(query: QueryRequest): Observable<QueryResult> {
    return this.sqsClient.executeQuery(query);
  }
  executeQueries(queries: QueryRequest[]): Observable<QueryResult[]> {
    return this.sqsClient.executeQueries(queries);
  }
}
