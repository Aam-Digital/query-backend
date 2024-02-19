import { Observable } from 'rxjs';
import { CouchDbChangeResult } from '../../couchdb/dtos';

/**
 * Provides access to a stream of document changes for a database.
 */
export abstract class DatabaseChangesService {
  abstract subscribeToAllNewChanges(): Observable<DatabaseChangeResult[]>;

  abstract subscribeToAllNewChangesWithDocs(): Observable<DocChangeDetails>;
}

export type DatabaseChangeResult = CouchDbChangeResult;

export interface DocChangeDetails {
  change: DatabaseChangeResult;
  previousDoc: EntityDoc | undefined;
  newDoc: EntityDoc;
}

/**
 * A doc in the database representing an entity managed in the frontend.
 */
export interface EntityDoc {
  _id: string;

  [key: string]: any;
}
