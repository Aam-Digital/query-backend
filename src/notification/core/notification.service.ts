import { Injectable } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { Reference } from '../../domain/reference';
import { ReportDataChangeEvent } from '../../domain/report-data-change-event';

/**
 * Manage core subscriptions and delivering events to subscribers.
 */
@Injectable()
export class NotificationService {
  /**
   * Get the list of reports for which notifications are subscribed by at least one client.
   */
  activeReports(): Observable<Reference[]> {
    // TODO: is this emitting the whole list every time the subscriptions change, as the name suggests?
    //       or individual id when added (but then, how is unsubscribe tracked?)
    //       may be easier if I can just directly get the list of currently active reports
    return of([]);
  }

  /**
   * Trigger a core event for the given report to any active subscribers.
   */
  triggerNotification(event: ReportDataChangeEvent): void {}

  registerForReportEvents(
    webhook: Reference,
    report: Reference,
  ): Observable<void> {
    return of();
  }

  unregisterForReportEvents(
    webhook: Reference,
    report: Reference,
  ): Observable<void> {
    return of();
  }
}
