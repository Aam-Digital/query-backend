import { Injectable } from '@nestjs/common';
import {
  BehaviorSubject,
  catchError,
  map,
  mergeMap,
  Observable,
  switchMap,
  zipAll,
} from 'rxjs';
import { Reference } from '../../domain/reference';
import { ReportDataChangeEvent } from '../../domain/report-data-change-event';
import { WebhookStorage } from '../storage/webhook-storage.service';
import { HttpService } from '@nestjs/axios';
import { Webhook } from '../domain/webhook';
import { UrlParser } from './url-parser.service';

/**
 * Manage core subscriptions and delivering events to subscribers.
 */
@Injectable()
export class NotificationService {
  private _activeReports: BehaviorSubject<Reference[]> = new BehaviorSubject(
    [] as Reference[],
  );

  constructor(
    private webhookStorage: WebhookStorage,
    private httpService: HttpService,
    private urlParser: UrlParser,
  ) {}

  /**
   * Get the list of reports for which notifications are subscribed by at least one client.
   */
  activeReports(): Observable<Reference[]> {
    return this.webhookStorage.fetchAllWebhooks().pipe(
      map((webhooks) =>
        webhooks.flatMap((webhook) => webhook.reportSubscriptions),
      ),
      map((reports) => this._activeReports.next(reports)),
      switchMap(() => this._activeReports.asObservable()),
    );

    // TODO: is this emitting the whole list every time the subscriptions change, as the name suggests?
    //       or individual id when added (but then, how is unsubscribe tracked?)
    //       may be easier if I can just directly get the list of currently active reports
  }

  /**
   * Trigger a core event for the given report to any active subscribers.
   */
  triggerNotification(event: ReportDataChangeEvent): void {
    // todo call webhook with arguments and placeholder

    this.webhookStorage
      .fetchAllWebhooks()
      .pipe(
        map((webhooks): Webhook[] =>
          webhooks.filter(
            (webhook) =>
              webhook.reportSubscriptions.findIndex(
                (reportRef) => reportRef.id === event.report.id,
              ) !== -1,
          ),
        ),
        mergeMap((webhooks) =>
          webhooks.map((webhook) => {
            // todo: support more placeholder and better checks
            const url = this.urlParser.replacePlaceholder(webhook.target.url, {
              reportId: event.report.id,
            });

            return this.httpService
              .request<any>({
                method: webhook.target.method,
                url: url,
                headers: {
                  'X-API-KEY': webhook.authentication.apiKey,
                },
                timeout: 5000,
              })
              .pipe(
                map((response) => {
                  console.log('axios response', response);
                }),
                catchError((err) => {
                  console.log('could not send notification to webhook', err);
                  throw err;
                }),
              );
          }),
        ),
        zipAll(),
      )
      .subscribe({
        next: () => {
          console.log('webhook send');
        },
        error: (err) => {
          console.log(err);
        },
        complete: () => {
          console.log('webhook trigger completed');
        },
      });
  }

  registerForReportEvents(
    webhook: Reference,
    report: Reference,
  ): Observable<null> {
    return this.webhookStorage.addSubscription(webhook, report).pipe(
      map(() => {
        if (!this._activeReports.value.find((ref) => ref.id === report.id)) {
          this._activeReports.next([...this._activeReports.value, report]);
        }
        return null;
      }),
    );
  }

  unregisterForReportEvents(
    webhook: Reference,
    report: Reference,
  ): Observable<null> {
    return this.webhookStorage.removeSubscription(webhook, report).pipe(
      map(() => {
        this._activeReports.next(
          this._activeReports.value.filter((ref) => ref.id !== report.id),
        );
        return null;
      }),
    );
  }
}
