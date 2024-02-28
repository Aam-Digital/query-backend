import { Observable } from 'rxjs';
import { CouchDbChangesResponse } from './dtos';
import { AxiosResponse } from 'axios';

export interface ICouchDbClient {
  changes(request: { config?: any }): Observable<CouchDbChangesResponse>;

  headDatabaseDocument(request: {
    documentId: string;
    config?: any;
  }): Observable<AxiosResponse<any, any>>;

  getDatabaseDocument<T>(request: {
    documentId: string;
    config?: any;
  }): Observable<T>;

  find<T>(request: { query: object; config: any }): Observable<T>;

  putDatabaseDocument<T>(request: {
    documentId: string;
    body: any;
    config: any;
  }): Observable<T>;
}
