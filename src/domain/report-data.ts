import { Reference } from './reference';
import * as crypto from 'crypto';

export class ReportData {
  constructor(report: Reference, run: Reference) {
    this.report = report;
    this.calculation = run;
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
