import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  CouchDbClient,
  CouchDbClientConfig,
} from '../../couchdb/couch-db-client.service';
import { WebhookStorage } from '../storage/webhook-storage.service';
import { WebhookRepository } from '../repository/webhook-repository.service';
import { CryptoService } from '../../crypto/core/crypto.service';
import axios from 'axios';

export const CouchDbClientFactory = (
  configService: ConfigService,
): CouchDbClient => {
  const CONFIG_BASE = 'NOTIFICATION_COUCH_DB_CLIENT_CONFIG_';

  const config: CouchDbClientConfig = {
    BASE_URL: configService.getOrThrow(CONFIG_BASE + 'BASE_URL'),
    TARGET_DATABASE: configService.getOrThrow(CONFIG_BASE + 'TARGET_DATABASE'),
    BASIC_AUTH_USER: configService.getOrThrow(CONFIG_BASE + 'BASIC_AUTH_USER'),
    BASIC_AUTH_PASSWORD: configService.getOrThrow(
      CONFIG_BASE + 'BASIC_AUTH_PASSWORD',
    ),
  };

  const axiosInstance = axios.create();

  axiosInstance.defaults.baseURL = `${config.BASE_URL}/${config.TARGET_DATABASE}`;
  axiosInstance.defaults.headers['Authorization'] = `Basic ${Buffer.from(
    `${config.BASIC_AUTH_USER}:${config.BASIC_AUTH_PASSWORD}`,
  ).toString('base64')}`;

  return new CouchDbClient(new HttpService(axiosInstance));
};

export const WebhookStorageFactory = (
  cryptoService: CryptoService,
  configService: ConfigService,
): WebhookStorage => {
  const couchDbClient = CouchDbClientFactory(configService);
  const webhookRepository = new WebhookRepository(couchDbClient);
  return new WebhookStorage(webhookRepository, cryptoService);
};
