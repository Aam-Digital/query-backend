import { Test, TestingModule } from '@nestjs/testing';
import {
  AppConfigFile,
  EntityConfigResolver,
  EntityConfigResolverConfig,
} from './entity-config-resolver';
import { CouchDbClient } from '../../couchdb/couch-db-client.service';
import { of } from 'rxjs';

describe('EntityConfigResolver', () => {
  let service: EntityConfigResolver;

  let mockCouchDbClient: {
    getDatabaseDocument: jest.Mock;
  };

  beforeEach(async () => {
    mockCouchDbClient = {
      getDatabaseDocument: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: EntityConfigResolver,
          useFactory: (couchDbClient) => {
            const config = new EntityConfigResolverConfig();
            config.FILENAME_CONFIG_ENTITY = 'foo.config';
            return new EntityConfigResolver(couchDbClient, config);
          },
          inject: [CouchDbClient],
        },
        {
          provide: CouchDbClient,
          useValue: mockCouchDbClient,
        },
      ],
    }).compile();

    service = module.get<EntityConfigResolver>(EntityConfigResolver);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getEntityConfig() should return EntityConfig with all entities from foo.config', (done) => {
    jest.spyOn(mockCouchDbClient, 'getDatabaseDocument').mockReturnValue(
      of({
        _id: 'id-1',
        _rev: 'rev-1',
        data: {
          'view:v1': {
            label: 'v-1',
            attributes: {},
          },
          'entity:conf-1': {
            label: 'conf-1',
            attributes: {
              'att-1': {
                dataType: 'TEXT',
              },
              'att-2': {
                dataType: 'INTEGER',
              },
            },
          },
          'entity:conf-2': {
            attributes: {
              'att-21': {
                dataType: 'TEXT',
              },
              'att-22': {
                dataType: 'INTEGER',
              },
            },
          },
        },
      } as AppConfigFile),
    );

    service.getEntityConfig().subscribe({
      next: (value) => {
        expect(mockCouchDbClient.getDatabaseDocument).toHaveBeenCalledWith({
          documentId: 'foo.config',
          config: {},
        });

        expect(value).toEqual({
          version: 'rev-1',
          entities: [
            {
              label: 'conf-1',
              attributes: [
                {
                  name: 'att-1',
                  type: 'TEXT',
                },
                {
                  name: 'att-2',
                  type: 'INTEGER',
                },
              ],
            },
            {
              label: 'conf-2',
              attributes: [
                {
                  name: 'att-21',
                  type: 'TEXT',
                },
                {
                  name: 'att-22',
                  type: 'INTEGER',
                },
              ],
            },
          ],
        });

        done();
      },
      error: (err) => {
        done(err);
      },
    });
  });
});
