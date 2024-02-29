import { Test, TestingModule } from '@nestjs/testing';
import {
  SqsSchemaGeneratorConfig,
  SqsSchemaService,
} from './sqs-schema-generator.service';
import { of, throwError } from 'rxjs';
import { EntityConfig } from '../domain/EntityConfig';
import { DocSuccess } from '../../couchdb/dtos';
import spyOn = jest.spyOn;

describe('SqsSchemaService', () => {
  let service: SqsSchemaService;

  let mockCouchDbClient: {
    changes: jest.Mock;
    headDatabaseDocument: jest.Mock;
    getDatabaseDocument: jest.Mock;
    find: jest.Mock;
    putDatabaseDocument: jest.Mock;
  };

  let mockEntityConfigResolver: {
    getEntityConfig: jest.Mock;
  };

  const sqsSchemaGeneratorConfig: SqsSchemaGeneratorConfig = {
    SCHEMA_PATH: '/_design/sqlite:config',
  };

  const entityConfig: EntityConfig = {
    version: 'rev-1',
    entities: [
      {
        label: 'Child',
        attributes: [
          {
            name: 'name',
            type: 'TEXT',
          },
          {
            name: 'age',
            type: 'INTEGER',
          },
        ],
      },
      {
        label: 'School',
        attributes: [
          {
            name: 'name',
            type: 'TEXT',
          },
          {
            name: 'type',
            type: 'TEXT',
          },
          {
            name: 'numberOfStudents',
            type: 'INTEGER',
          },
        ],
      },
    ],
  };

  const sqsConfig = {
    _id: '_design/sqlite:config',
    _rev: '1-00000000',
    sql: {
      tables: {
        Child: {
          fields: {
            name: 'TEXT',
            age: 'INTEGER',
            _id: 'TEXT',
            _rev: 'TEXT',
            created: 'TEXT',
            updated: 'TEXT',
            inactive: 'INTEGER',
            anonymized: 'INTEGER',
          },
        },
        School: {
          fields: {
            name: 'TEXT',
            type: 'TEXT',
            numberOfStudents: 'INTEGER',
            _id: 'TEXT',
            _rev: 'TEXT',
            created: 'TEXT',
            updated: 'TEXT',
            inactive: 'INTEGER',
            anonymized: 'INTEGER',
          },
        },
      },
      indexes: [],
      options: {
        table_name: {
          operation: 'prefix',
          field: '_id',
          separator: ':',
        },
      },
    },
    language: 'sqlite',
    configVersion:
      '2a26f7bc7e7e69940d811a4845a5f88374cbbb9868c8f4ce13303c3be71f2ad8',
  };

  beforeEach(async () => {
    mockCouchDbClient = {
      changes: jest.fn(),
      headDatabaseDocument: jest.fn(),
      getDatabaseDocument: jest.fn(),
      find: jest.fn(),
      putDatabaseDocument: jest.fn(),
    };

    mockEntityConfigResolver = {
      getEntityConfig: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: SqsSchemaService,
          useFactory: () =>
            new SqsSchemaService(
              mockCouchDbClient,
              mockEntityConfigResolver,
              sqsSchemaGeneratorConfig,
            ),
        },
      ],
    }).compile();

    service = module.get<SqsSchemaService>(SqsSchemaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getSchemaPath() should return Schema', () => {
    expect(service.getSchemaPath()).toEqual('/_design/sqlite:config');
  });

  it('updateSchema() should update Schema when new sqs config version is different then current', (done) => {
    // given
    resolveEntityConfig();
    resolveSqsConfigWithOtherVersion();
    resolveDocSuccess();
    // when
    service.updateSchema().subscribe({
      next: () => {
        // then
        expect(mockCouchDbClient.putDatabaseDocument).toHaveBeenCalled();
        done();
      },
      error: (err) => {
        done(err);
      },
    });
  });

  it('updateSchema() should update Schema when no sqs could be fetched', (done) => {
    // given
    resolveEntityConfig();
    resolveSqsConfigNotFound();
    resolveDocSuccess();
    // when
    service.updateSchema().subscribe({
      next: () => {
        // then
        expect(mockCouchDbClient.putDatabaseDocument).toHaveBeenCalled();
        done();
      },
      error: (err) => {
        done(err);
      },
    });
  });

  it('updateSchema() should not update Schema when entity:config is unchanged', (done) => {
    // given
    resolveEntityConfig();
    resolveSqsConfig();
    // when
    service.updateSchema().subscribe({
      next: () => {
        // then
        expect(mockCouchDbClient.putDatabaseDocument).not.toHaveBeenCalled();
        done();
      },
      error: (err) => {
        done(err);
      },
    });
  });

  function resolveEntityConfig() {
    spyOn(mockEntityConfigResolver, 'getEntityConfig').mockReturnValue(
      of(entityConfig),
    );
  }

  function resolveSqsConfig() {
    spyOn(mockCouchDbClient, 'getDatabaseDocument').mockReturnValue(
      of(sqsConfig),
    );
  }

  function resolveDocSuccess() {
    spyOn(mockCouchDbClient, 'putDatabaseDocument').mockReturnValue(
      of(new DocSuccess(true, 'id-123', 'r-123')),
    );
  }

  function resolveSqsConfigWithOtherVersion() {
    const sqsConfigWithNewVersion = { ...sqsConfig };
    sqsConfigWithNewVersion.configVersion = '123';
    spyOn(mockCouchDbClient, 'getDatabaseDocument').mockReturnValue(
      of(sqsConfigWithNewVersion),
    );
  }

  function resolveSqsConfigNotFound() {
    const sqsConfigWithNewVersion = { ...sqsConfig };
    sqsConfigWithNewVersion.configVersion = '123';
    spyOn(mockCouchDbClient, 'getDatabaseDocument').mockReturnValue(
      throwError(() => {
        throw new Error('not found');
      }),
    );
  }
});
