import { CouchDbClient } from '../src/couchdb/couch-db-client.service';
import { of } from 'rxjs';

export function mockCouchDbClient() {
  return {
    getDatabaseDocument: jest
      .spyOn(CouchDbClient.prototype, 'getDatabaseDocument')
      .mockImplementation(() => of({})),
  };
}
