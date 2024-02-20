import { ReportSchema } from '../../domain/report';

/**
 * This is the interface shared to external users of the API endpoints.
 */
export class ReportDto {
  constructor(
    id: string,
    name: string,
    schema: ReportSchema | undefined,
    calculationPending: boolean | null = null,
  ) {
    this.id = id;
    this.name = name;
    this.calculationPending = calculationPending;
    this.schema = schema;
  }

  id: string;
  name: string;
  calculationPending: boolean | null;
  schema: ReportSchema | undefined;
}
