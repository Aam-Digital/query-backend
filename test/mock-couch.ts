// eslint-disable-next-line @typescript-eslint/no-var-requires
import { EntityDoc } from '../src/report-changes/storage/database-changes.service';

const mockCouch = require('mock-couch');

/**
 * Wrapper for mock-couch to provide typing.
 * see https://chris-l.github.io/mock-couch/
 */
export class MockCouch {
  private server: any;

  constructor(port?: number) {
    this.server = mockCouch.createServer();

    this.server._restifyServer.post('/:db/_find', (req: any, res: any) =>
      this._find(req, res),
    );

    this.listen(port ?? 5984);
  }

  listen(port: number): void {
    this.server.listen(port);
  }

  close(): void {
    this.server.close();
  }

  addDB(dbName: string, docs: any[]) {
    this.server.addDB(dbName, docs);
  }

  addDoc(dbName: string, doc: any) {
    this.server.addDoc(dbName, doc);
  }

  private _find(req: any, res: any) {
    const db = this.server.databases[req.params.db];
    if (!db) {
      res.send(404, { error: 'not_found', reason: 'no_db_file' });
      return;
    }

    let findResults: EntityDoc[] = [];

    const selector = req.body?.selector;

    // WARNING: Fake implementation, only working for getting results related to a calculation.id
    // TODO: proper mock of _find request to CouchDB for e2e tests
    if (selector['calculation.id']) {
      for (const [id, doc] of Object.entries<EntityDoc>(db)) {
        if (doc['calculation']?.id === selector['calculation.id']['$eq']) {
          findResults.push(doc);
        }
      }
    }

    res.send(200, { docs: findResults });
  }
}
