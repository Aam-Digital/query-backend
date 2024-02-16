/**
 * Defines the expected format of a ReportData
 */
export interface ReportSchema {
  fields: { [key: string]: any };
}

/**
 * Representation of a user configured data export.
 * The expected format of related ReportData will match with the ReportSchema.
 */
export class Report {
  id: string;
  name: string;
  mode: string | undefined;
  schema: ReportSchema | undefined;
  queries: string[];

  constructor(id: string, name: string, queries: string[], mode: string) {
    this.id = id;
    this.name = name;
    this.queries = queries;
    this.mode = mode;
  }

  setId(id: string): Report {
    this.id = id;
    return this;
  }

  setMode(mode: string): Report {
    this.mode = mode;
    return this;
  }

  setName(name: string): Report {
    this.name = name;
    return this;
  }

  setSchema(schema: ReportSchema): Report {
    this.schema = schema;
    return this;
  }

  setQueries(queries: string[]): Report {
    this.queries = queries;
    return this;
  }
}
