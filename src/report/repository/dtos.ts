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
