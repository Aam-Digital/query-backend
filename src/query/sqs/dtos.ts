export class SqsSchema {
  constructor(
    public sql: {
      // SQL table definitions
      tables: SqlTables;
      // Optional SQL indices
      indexes?: string[];
      // Further options
      options?: SqlOptions;
    },
    public language: 'sqlite' = 'sqlite',
  ) {}
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
