import { Module } from '@nestjs/common';
import { SqsSchemaService } from './sqs/sqs-schema-generator.service';
import { SqsClient } from './sqs/sqs.client';
import { ConfigService } from '@nestjs/config';
import {
  EntityConfigResolverFactory,
  QueryServiceFactory,
  SqsClientFactory,
  SqsSchemaServiceFactory,
} from './di/query.configuration';
import { QueryService } from './core/query-service';
import { EntityConfigResolver } from './core/entity-config-resolver';

@Module({
  providers: [
    {
      provide: SqsSchemaService,
      useFactory: SqsSchemaServiceFactory,
      inject: [ConfigService, EntityConfigResolver],
    },
    {
      provide: SqsClient,
      useFactory: SqsClientFactory,
      inject: [ConfigService, SqsSchemaService],
    },
    {
      provide: QueryService,
      useFactory: QueryServiceFactory,
      inject: [SqsClient],
    },
    {
      provide: EntityConfigResolver,
      useFactory: EntityConfigResolverFactory,
      inject: [ConfigService],
    },
  ],
  exports: [QueryService],
})
export class QueryModule {}
