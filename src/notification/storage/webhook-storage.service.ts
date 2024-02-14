import { Injectable } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { Webhook, WebhookConfiguration } from '../core/webhook';
import { Reference } from '../../domain/reference';

@Injectable()
export class WebhookStorageService {
  /**
   * Get all registered webhooks subscribe by the user authenticated with the given token
   * @param token
   */
  fetchAllWebhooks(token: string): Observable<Webhook[]> {
    return of([]);
  }

  fetchWebhook(webhook: Reference): Observable<Webhook | undefined> {
    return of(undefined);
  }

  /**
   * Creates a new webhook with the given configuration, stores it and returns a reference to the new webhook.
   * @param webhookConfig
   */
  createWebhook(webhookConfig: WebhookConfiguration): Observable<Reference> {
    return of(new Reference('new-webhook-id'));
  }
}
