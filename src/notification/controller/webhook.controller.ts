import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { defaultIfEmpty, map, Observable, zipAll } from 'rxjs';
import { Reference } from '../../domain/reference';
import { WebhookStorage } from '../storage/webhook-storage.service';
import { Webhook } from '../domain/webhook';
import { NotificationService } from '../core/notification.service';
import { CreateWebhookDto, WebhookDto } from './dtos';
import { JwtAuthGuard } from '../../auth/core/jwt-auth.guard';
import { Scopes } from '../../auth/core/scopes.decorator';

@Controller('/api/v1/reporting/webhook')
export class WebhookController {
  constructor(
    private webhookStorage: WebhookStorage,
    private notificationService: NotificationService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Scopes(['reporting_read'])
  fetchWebhooksOfUser(): Observable<WebhookDto[]> {
    return this.webhookStorage.fetchAllWebhooks('user-token').pipe(
      map((webhooks) => webhooks.map((webhook) => this.mapToDto(webhook))),
      zipAll(),
      defaultIfEmpty([]),
    );
  }

  @Get('/:webhookId')
  @UseGuards(JwtAuthGuard)
  @Scopes(['reporting_read'])
  fetchWebhook(
    @Headers('Authorization') token: string,
    @Param('webhookId') webhookId: string,
  ): Observable<WebhookDto> {
    return this.webhookStorage.fetchWebhook(new Reference(webhookId)).pipe(
      // TODO: check auth?
      map((webhook) => {
        if (!webhook) {
          throw new BadRequestException();
        }
        return this.mapToDto(webhook);
      }),
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Scopes(['reporting_write'])
  createWebhook(
    @Headers('Authorization') token: string,
    @Body() requestBody: CreateWebhookDto,
  ): Observable<Reference> {
    return this.webhookStorage
      .createWebhook({
        label: requestBody.label,
        target: requestBody.target,
        authentication: requestBody.authentication,
      })
      .pipe(
        // TODO: check auth?
        // TODO: map errors to response codes
        map((webhookRef: Reference) => webhookRef),
      );
  }

  @Post('/:webhookId/subscribe/report/:reportId')
  @UseGuards(JwtAuthGuard)
  @Scopes(['reporting_write'])
  subscribeReportNotifications(
    @Headers('Authorization') token: string,
    @Param('webhookId') webhookId: string,
    @Param('reportId') reportId: string,
  ): Observable<null> {
    return this.notificationService.registerForReportEvents(
      new Reference(webhookId),
      new Reference(reportId),
    );
    // TODO: check auth?
    // TODO: map errors to response codes
  }

  @Delete('/:webhookId/subscribe/report/:reportId')
  @UseGuards(JwtAuthGuard)
  @Scopes(['reporting_write'])
  unsubscribeReportNotifications(
    @Headers('Authorization') token: string,
    @Param('webhookId') webhookId: string,
    @Param('reportId') reportId: string,
  ): Observable<null> {
    return this.notificationService.unregisterForReportEvents(
      new Reference(webhookId),
      new Reference(reportId),
    );
    // TODO: check auth?
    // TODO: map errors to response codes
  }

  private mapToDto(webhook: Webhook): WebhookDto {
    return {
      id: webhook.id,
      name: webhook.label,
      target: webhook.target,
      authenticationType: webhook.authentication.type,
      reportSubscriptions: webhook.reportSubscriptions,
    };
  }
}
