import { Reference } from './reference';
import * as crypto from 'crypto';

/**
 * The actual result of a ReportCalculation.
 *
 * @field data Final format is described by the ReportSchema
 *  linked in the related Report.
 */
export class ReportData {
  id: string;

  constructor(id: string, report: Reference, calculation: Reference) {
    this.id = id;
    this.report = report;
    this.calculation = calculation;
  }

  report: Reference;
  calculation: Reference;
  data: any;

  setData(data: any): ReportData {
    this.data = data;
    return this;
  }

  asHash(): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(this))
      .digest('hex');
  }
}
