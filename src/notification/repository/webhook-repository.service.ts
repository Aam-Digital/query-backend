import { NotFoundException } from '@nestjs/common';
import { catchError, map, Observable } from 'rxjs';
import { Reference } from '../../domain/reference';
import { CouchDbClient } from '../../couchdb/couch-db-client.service';
import { CouchDbRow, CouchDbRows, DocSuccess } from '../../couchdb/dtos';

/**
 * Representation of a WebHook stored in the database.
 *
 * @field owner: represents the creator of the WebhookEntity. Normally the User/Client who created the Webhook.
 * Just owners can read their own entities or the entities of groups they are part of.
 */
export interface WebhookEntity {
  id: string;
  label: string;
  target: {
    method: 'GET' | 'POST';
    url: string;
  };
  authentication: {
    type: 'API_KEY';
    apiKey: {
      iv: string;
      data: string;
    };
  };
  owner: {
    type: 'USER'; // TODO: group support?
    id: string;
  };
  reportSubscriptions: Reference[];
}

export class WebhookRepository {
  constructor(private http: CouchDbClient) {}

  fetchAllWebhooks(): Observable<WebhookEntity[]> {
    return this.http
      .getDatabaseDocument<CouchDbRows<CouchDbRow<WebhookEntity>>>({
        documentId: '_all_docs',
        config: {
          params: {
            include_docs: true,
            start_key: '"Webhook"',
            end_key: '"Webhook' + '\ufff0"', // ufff0 -> high value unicode character
          },
        },
      })
      .pipe(
        map((rows) => rows.rows),
        map((row) => row.map((entity) => entity.doc)),
      );
  }

  fetchWebhook(webhookRef: Reference): Observable<WebhookEntity> {
    return this.http
      .getDatabaseDocument<WebhookEntity>({
        documentId: webhookRef.id,
      })
      .pipe(
        catchError((err) => {
          if (err.response.status === 404) {
            throw new NotFoundException();
          }
          throw err;
        }),
      );
  }

  storeWebhook(webhook: WebhookEntity): Observable<DocSuccess> {
    return this.http.putDatabaseDocument<DocSuccess>({
      documentId: webhook.id,
      body: webhook,
      config: {},
    });
  }
}
