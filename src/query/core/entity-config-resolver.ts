import { IEntityConfigResolver } from './entity-config-resolver.interface';
import { map, Observable } from 'rxjs';
import {
  EntityAttribute,
  EntityConfig,
  EntityType,
} from '../domain/EntityConfig';
import { CouchDbClient } from '../../couchdb/couch-db-client.service';

export interface AppConfigFile {
  _id: string;
  _rev: string;
  data: {
    [key: string]: {
      label?: string;
      attributes: {
        [key: string]: {
          dataType: string;
        };
      };
    };
  };
}

export class EntityConfigResolverConfig {
  FILENAME_CONFIG_ENTITY = '';
}

export class EntityConfigResolver implements IEntityConfigResolver {
  constructor(
    private couchDbClient: CouchDbClient,
    private config: EntityConfigResolverConfig,
  ) {}

  getEntityConfig(): Observable<EntityConfig> {
    return this.couchDbClient
      .getDatabaseDocument<AppConfigFile>({
        documentId: this.config.FILENAME_CONFIG_ENTITY,
        config: {},
      })
      .pipe(
        map((config) => {
          const keys = Object.keys(config.data).filter((key) =>
            key.startsWith('entity:'),
          );
          const entities: EntityType[] = [];
          for (let i = 0; i < keys.length; i++) {
            entities.push(this.parseEntityConfig(keys[i], config));
          }
          return new EntityConfig(config._rev, entities);
        }),
      );
  }

  private parseEntityConfig(
    entityKey: string,
    config: AppConfigFile,
  ): EntityType {
    const data = config.data[entityKey];

    let label: string;

    if (data.label) {
      label = data.label;
    } else {
      label = entityKey.split(':')[1];
    }

    const attributes: EntityAttribute[] = Object.keys(data.attributes).map(
      (attributeKey) =>
        new EntityAttribute(
          attributeKey,
          data.attributes[attributeKey].dataType,
        ),
    );

    return new EntityType(label, attributes);
  }
}
