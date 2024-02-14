import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { defaultIfEmpty, map, Observable, zipAll } from 'rxjs';
import { Reference } from '../../domain/reference';
import { WebhookStorageService } from '../storage/webhook-storage.service';
import { Webhook } from '../core/webhook';
import { NotificationService } from '../core/notification.service';
import { WebhookConfigurationDto, WebhookDto } from './dtos';

@Controller('/api/v1/notifications/webhook')
export class WebhookController {
  constructor(
    private webhookStorage: WebhookStorageService,
    private notificationService: NotificationService,
  ) {}

  @Get()
  fetchWebhooksOfUser(
    @Headers('Authorization') token: string,
  ): Observable<WebhookDto[]> {
    return this.webhookStorage.fetchAllWebhooks(token).pipe(
      map((webhooks) => webhooks.map((webhook) => this.getWebhookDto(webhook))),
      zipAll(),
      defaultIfEmpty([]),
    );
  }

  @Get('/:webhookId')
  fetchWebhook(
    @Headers('Authorization') token: string,
    @Param('webhookId') webhookId: string,
  ): Observable<WebhookDto> {
    return this.webhookStorage.fetchWebhook(new Reference(webhookId)).pipe(
      // TODO: check auth?
      // TODO: map to 404 if undefined
      map((webhook) => this.getWebhookDto(webhook as any)),
    );
  }

  @Post()
  createWebhook(
    @Headers('Authorization') token: string,
    @Body() requestBody: WebhookConfigurationDto,
  ): Observable<string> {
    return this.webhookStorage.createWebhook(requestBody).pipe(
      // TODO: check auth?
      // TODO: map errors to response codes
      map((webhookRef: Reference) => webhookRef.id),
    );
  }

  @Post('/:webhookId/subscribe/report/:reportId')
  subscribeReportNotifications(
    @Headers('Authorization') token: string,
    @Param('webhookId') webhookId: string,
    @Param('reportId') reportId: string,
  ): Observable<void> {
    return this.notificationService
      .registerForReportEvents(
        new Reference(webhookId),
        new Reference(reportId),
      )
      .pipe
      // TODO: check auth?
      // TODO: map errors to response codes
      // TODO: map to 200 Response without body (otherwise service throws error)
      ();
  }

  @Delete('/:webhookId/subscribe/report/:reportId')
  unsubscribeReportNotifications(
    @Headers('Authorization') token: string,
    @Param('webhookId') webhookId: string,
    @Param('reportId') reportId: string,
  ): Observable<void> {
    return this.notificationService
      .unregisterForReportEvents(
        new Reference(webhookId),
        new Reference(reportId),
      )
      .pipe
      // TODO: check auth?
      // TODO: map errors to response codes
      // TODO: map to 200 Response without body (otherwise service throws error)
      ();
  }

  private getWebhookDto(webhook: Webhook): WebhookDto {
    return webhook;
  }
}
