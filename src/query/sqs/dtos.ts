import * as crypto from 'crypto';

export class SqsSchema {
  readonly language: 'sqlite';
  readonly configVersion: string;
  readonly sql: {
    tables: SqlTables;
    // Optional SQL indices
    indexes: string[];
    // Further options
    options: SqlOptions;
  };

  constructor(
    tables: SqlTables,
    indexes: string[],
    options: SqlOptions,
    language: 'sqlite' = 'sqlite',
  ) {
    this.sql = {
      tables: tables,
      indexes: indexes,
      options: options,
    };
    this.language = language;
    this.configVersion = this.asHash();
  }

  private asHash(): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(this.sql))
      .digest('hex');
  }
}

type SqlTables = {
  // Name of the entity
  [table: string]: {
    fields: {
      // Name of the entity attribute and the type of it
      [column: string]: SqlType | { field: string; type: SqlType };
    };
  };
};

type SqlType = 'TEXT' | 'INTEGER' | 'REAL' | 'JSON';

type SqlOptions = {
  table_name: {
    operation: 'prefix';
    field: string;
    separator: string;
  };
};
