/**
 * Representation of a reference to another Domain Object.
 * Used, when just the Identifier is needed, not the hole object.
 *
 * @example: You want to trigger a calculation for new Report
 * and just got the ReportId from your controller. You just pass a Reference to that Report:
 *
 * triggerCalculation(reportId: Reference): void {}
 *
 * const reportId = "r-1";
 * triggerCalculation(new Reference(reportId));
 *
 */
export class Reference {
  constructor(id: string) {
    this.id = id;
  }

  id: string;
}
