import {
  CouchSqsClient,
  CouchSqsClientConfig,
} from '../../couchdb/couch-sqs.client';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import axios from 'axios';

export const CouchSqsClientFactory = (
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

  const axiosInstance = axios.create();

  axiosInstance.defaults.baseURL = config.BASE_URL;
  axiosInstance.defaults.headers['Authorization'] = `Basic ${Buffer.from(
    `${config.BASIC_AUTH_USER}:${config.BASIC_AUTH_PASSWORD}`,
  ).toString('base64')}`;

  return new CouchSqsClient(new HttpService(axiosInstance));
};
