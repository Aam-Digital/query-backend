import { ConfigService } from '@nestjs/config';
import { CouchSqsClientConfig, SqsClient } from '../sqs/sqs.client';
import axios from 'axios';
import { HttpService } from '@nestjs/axios';
import { SqsSchemaService } from '../sqs/sqs-schema-generator.service';
import { DefaultCouchDbClientFactory } from '../../couchdb/default-factory';
import { EntityConfigResolver } from '../core/entity-config-resolver';
import { QueryService } from '../core/query-service';
import { IEntityConfigResolver } from '../core/entity-config-resolver.interface';

export const SqsClientFactory = (
  configService: ConfigService,
  sqsSchemaService: SqsSchemaService,
): SqsClient => {
  const CONFIG_PREFIX = 'QUERY_SQS_CLIENT_';

  const couchSqsClientConfig: CouchSqsClientConfig = {
    BASE_URL: configService.getOrThrow(CONFIG_PREFIX + 'BASE_URL'),
    BASIC_AUTH_USER: configService.getOrThrow(
      CONFIG_PREFIX + 'BASIC_AUTH_USER',
    ),
    BASIC_AUTH_PASSWORD: configService.getOrThrow(
      CONFIG_PREFIX + 'BASIC_AUTH_PASSWORD',
    ),
  };

  const axiosInstance = axios.create();

  axiosInstance.defaults.baseURL = `${
    couchSqsClientConfig.BASE_URL
  }/${configService.getOrThrow(CONFIG_PREFIX + 'TARGET_DATABASE')}`;
  axiosInstance.defaults.headers['Authorization'] = `Basic ${Buffer.from(
    `${couchSqsClientConfig.BASIC_AUTH_USER}:${couchSqsClientConfig.BASIC_AUTH_PASSWORD}`,
  ).toString('base64')}`;

  return new SqsClient(new HttpService(axiosInstance), sqsSchemaService);
};

export const SqsSchemaServiceFactory = (
  configService: ConfigService,
  entityConfigResolver: IEntityConfigResolver,
): SqsSchemaService => {
  const couchDbClient = DefaultCouchDbClientFactory(
    'COUCH_DB_CLIENT_APP_',
    configService,
  );
  return new SqsSchemaService(couchDbClient, entityConfigResolver, {
    SCHEMA_PATH: configService.getOrThrow('QUERY_SCHEMA_DESIGN_CONFIG'),
  });
};

export const QueryServiceFactory = (sqsClient: SqsClient): QueryService =>
  new QueryService(sqsClient);

export const EntityConfigResolverFactory = (
  configService: ConfigService,
): EntityConfigResolver => {
  const couchDbClient = DefaultCouchDbClientFactory(
    'COUCH_DB_CLIENT_APP_',
    configService,
  );
  return new EntityConfigResolver(couchDbClient, {
    FILENAME_CONFIG_ENTITY: 'Config:CONFIG_ENTITY',
  });
};
