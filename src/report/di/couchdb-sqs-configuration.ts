import {
  CouchSqsClient,
  CouchSqsClientConfig,
} from '../../couchdb/couch-sqs.client';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

export const CouchSqsClientFactory = (
  httpService: HttpService,
  configService: ConfigService,
): CouchSqsClient => {
  const CONFIG_BASE = 'COUCH_SQS_CLIENT_CONFIG_';

  const config: CouchSqsClientConfig = {
    BASE_URL: configService.getOrThrow(CONFIG_BASE + 'BASE_URL'),
    BASIC_AUTH_USER: configService.getOrThrow(CONFIG_BASE + 'BASIC_AUTH_USER'),
    BASIC_AUTH_PASSWORD: configService.getOrThrow(
      CONFIG_BASE + 'BASIC_AUTH_PASSWORD',
    ),
  };

  httpService.axiosRef.defaults.baseURL = config.BASE_URL;
  httpService.axiosRef.defaults.headers['Authorization'] = `Basic ${Buffer.from(
    `${config.BASIC_AUTH_USER}:${config.BASIC_AUTH_PASSWORD}`,
  ).toString('base64')}`;

  return new CouchSqsClient(httpService);
};
