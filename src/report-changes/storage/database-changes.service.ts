import { Observable } from 'rxjs';
import { CouchDbChangeResult } from '../../couchdb/dtos';

/**
 * Provides access to a stream of document changes for a database.
 */
export abstract class DatabaseChangesService {
  abstract subscribeToAllNewChanges(): Observable<DatabaseChangeResult[]>;
}

// TODO: don't expose the CouchDb specific changes interface, map this to domain interfaces (maybe use DocChangeDetails)?
export type DatabaseChangeResult = CouchDbChangeResult;
