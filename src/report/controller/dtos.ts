/**
 * This is the interface shared to external users of the API endpoints.
 */
export class ReportDto {
  constructor(
    id: string,
    name: string,
    schema: any,
    calculationPending: boolean | null = null,
  ) {
    this.id = id;
    this.name = name;
    this.calculationPending = calculationPending;
    this.schema = {
      fields: schema,
    };
  }

  id: string;
  name: string;
  calculationPending: boolean | null;
  schema: {
    fields: any;
  };
}
