export interface ReportSchema {
  fields: { [key: string]: any };
}

export class Report {
  id: string;
  name: string;
  schema: ReportSchema | undefined;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  setId(id: string): Report {
    this.id = id;
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
}
