import { map, Observable, switchMap } from 'rxjs';
import { CreateWebhookRequest, Webhook } from '../domain/webhook';
import { Reference } from '../../domain/reference';
import {
  WebhookEntity,
  WebhookRepository,
} from '../repository/webhook-repository.service';
import { v4 as uuidv4 } from 'uuid';
import { CryptoService } from '../../crypto/core/crypto.service';
import { NotFoundException } from '@nestjs/common';

// todo interface
export class WebhookStorage {
  constructor(
    private webhookRepository: WebhookRepository,
    private cryptoService: CryptoService,
  ) {}

  addSubscription(
    webhookRef: Reference,
    entityRef: Reference,
  ): Observable<null> {
    return this.fetchWebhook(webhookRef).pipe(
      map((webhook): Webhook => {
        if (!webhook) {
          throw new NotFoundException();
        }

        if (
          !webhook.reportSubscriptions.find((ref) => ref.id === entityRef.id)
        ) {
          webhook.reportSubscriptions.push(entityRef);
        }

        return webhook;
      }),
      switchMap((webhook) =>
        this.webhookRepository.storeWebhook(this.mapToEntity(webhook)),
      ),
      map(() => {
        return null;
      }),
    );
  }

  removeSubscription(
    webhookRef: Reference,
    entityRef: Reference,
  ): Observable<null> {
    return this.fetchWebhook(webhookRef).pipe(
      map((webhook): Webhook => {
        if (!webhook) {
          throw new NotFoundException();
        }

        webhook.reportSubscriptions = webhook.reportSubscriptions.filter(
          (ref) => ref.id !== entityRef.id,
        );

        return webhook;
      }),
      switchMap((webhook) =>
        this.webhookRepository.storeWebhook(this.mapToEntity(webhook)),
      ),
      map(() => {
        return null;
      }),
    );
  }

  /**
   * Get all registered webhooks subscribe by the user authenticated with the given token
   * @param token
   */
  fetchAllWebhooks(token?: string): Observable<Webhook[]> {
    return this.webhookRepository
      .fetchAllWebhooks()
      .pipe(
        map((entities) => entities.map((entity) => this.mapFromEntity(entity))),
      );
  }

  fetchWebhook(webhookRef: Reference): Observable<Webhook | undefined> {
    return this.webhookRepository
      .fetchWebhook(webhookRef)
      .pipe(map((entity) => this.mapFromEntity(entity)));
  }

  /**
   * Creates a new webhook with the given configuration, stores it and returns a reference to the new webhook.
   * @param request
   */
  createWebhook(request: CreateWebhookRequest): Observable<Reference> {
    return this.webhookRepository
      .storeWebhook({
        id: `Webhook:${uuidv4()}`,
        label: request.label,
        target: request.target,
        authentication: {
          type: 'API_KEY',
          apiKey: this.cryptoService.encrypt(request.authentication.apiKey),
        },
        owner: {
          type: 'USER',
          id: 'todo-user-id-here', // todo
        },
        reportSubscriptions: [],
      })
      .pipe(map((value) => new Reference(value.id)));
  }

  private mapFromEntity(entity: WebhookEntity): Webhook {
    return {
      id: entity.id,
      label: entity.label,
      authentication: {
        type: entity.authentication.type,
        apiKey: this.cryptoService.decrypt(entity.authentication.apiKey),
      },
      owner: entity.owner,
      target: entity.target,
      reportSubscriptions: entity.reportSubscriptions,
    };
  }

  private mapToEntity(entity: Webhook): WebhookEntity {
    return {
      id: entity.id,
      label: entity.label,
      authentication: {
        type: entity.authentication.type,
        apiKey: this.cryptoService.encrypt(entity.authentication.apiKey),
      },
      owner: entity.owner,
      target: entity.target,
      reportSubscriptions: entity.reportSubscriptions,
    };
  }
}
