import { QueryRequest } from '../domain/QueryRequest';
import { Observable } from 'rxjs';
import { QueryResult } from '../domain/QueryResult';

export interface IQueryService {
  executeQuery(query: QueryRequest): Observable<QueryResult>;
  executeQueries(queries: QueryRequest[]): Observable<QueryResult[]>;
}
