export interface CouchDbRow<T> {
  id: string;
  key: string;
  value: {
    rev: string;
  };
  doc: T;
}

export class DocSuccess {
  ok: boolean;
  id: string;
  rev: string;

  constructor(ok: boolean, id: string, rev: string) {
    this.ok = ok;
    this.id = id;
    this.rev = rev;
  }
}

export class FindResponse<T> {
  constructor(docs: T[]) {
    this.docs = docs;
  }

  docs: T[];
}

/**
 * Response from the CouchDB changes endpoint, listing database docs that have changed
 * since the given last change (last_seq).
 *
 * see https://docs.couchdb.org/en/stable/api/database/changes.html
 */
export interface CouchDbChangesResponse {
  /** Last change update sequence */
  last_seq: string;

  /** array of docs with changes */
  results: CouchDbChangeResult[];

  /** Count of remaining items in the feed */
  pending: number;
}

/**
 * A single result entry from a CouchDB changes feed,
 * indicating one doc has changed.
 *
 * see https://docs.couchdb.org/en/stable/api/database/changes.html
 */
export interface CouchDbChangeResult {
  /** _id of a doc with changes */
  id: string;

  /** List of document’s leaves with single field rev. */
  changes: { rev: string }[];

  seq: string;

  doc?: any;

  deleted?: boolean;
}
