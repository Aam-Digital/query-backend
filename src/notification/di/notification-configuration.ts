import { ConfigService } from '@nestjs/config';
import { WebhookStorage } from '../storage/webhook-storage.service';
import { WebhookRepository } from '../repository/webhook-repository.service';
import { CryptoService } from '../../crypto/core/crypto.service';
import { DefaultCouchDbClientFactory } from '../../couchdb/default-factory';
import { NotificationService } from '../core/notification.service';
import { HttpService } from '@nestjs/axios';
import axios from 'axios';
import { UrlParser } from '../core/url-parser.service';

export const WebhookStorageFactory = (
  cryptoService: CryptoService,
  configService: ConfigService,
): WebhookStorage => {
  const couchDbClient = DefaultCouchDbClientFactory(
    'NOTIFICATION_COUCH_DB_CLIENT_CONFIG_',
    configService,
  );
  const webhookRepository = new WebhookRepository(couchDbClient);
  return new WebhookStorage(webhookRepository, cryptoService);
};

export const NotificationServiceFactory = (
  webhookStorage: WebhookStorage,
): NotificationService => {
  return new NotificationService(
    webhookStorage,
    WebhookWebClient(),
    new UrlParser(),
  );
};

export const WebhookWebClient = (): HttpService => {
  const axiosInstance = axios.create();
  axiosInstance.interceptors.request.use((config) => {
    console.log('Execute Webhook: ', config.url);
    return config;
  });
  return new HttpService(axiosInstance);
};
