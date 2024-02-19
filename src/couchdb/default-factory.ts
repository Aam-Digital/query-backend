import { ConfigService } from '@nestjs/config';
import { CouchDbClient, CouchDbClientConfig } from './couch-db-client.service';
import { HttpService } from '@nestjs/axios';
import axios from 'axios';

export const DefaultCouchDbClientFactory = (
  configPrefix: string,
  configService: ConfigService,
): CouchDbClient => {
  const config: CouchDbClientConfig = {
    BASE_URL: configService.getOrThrow(configPrefix + 'BASE_URL'),
    TARGET_DATABASE: configService.getOrThrow(configPrefix + 'TARGET_DATABASE'),
    BASIC_AUTH_USER: configService.getOrThrow(configPrefix + 'BASIC_AUTH_USER'),
    BASIC_AUTH_PASSWORD: configService.getOrThrow(
      configPrefix + 'BASIC_AUTH_PASSWORD',
    ),
  };

  const axiosInstance = axios.create();

  axiosInstance.defaults.baseURL = `${config.BASE_URL}/${config.TARGET_DATABASE}`;
  axiosInstance.defaults.headers['Authorization'] = `Basic ${Buffer.from(
    `${config.BASIC_AUTH_USER}:${config.BASIC_AUTH_PASSWORD}`,
  ).toString('base64')}`;

  return new CouchDbClient(new HttpService(axiosInstance));
};
