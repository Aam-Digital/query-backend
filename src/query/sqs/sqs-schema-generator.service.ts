import { EMPTY, map, Observable, switchMap } from 'rxjs';
import { CouchDbClient } from '../../couchdb/couch-db-client.service';
import { IEntityConfigResolver } from '../core/entity-config-resolver.interface';
import { SqsSchema } from './dtos';
import { DocSuccess } from '../../couchdb/dtos';
import { EntityAttribute, EntityConfig } from '../domain/EntityConfig';

export class SqsSchemaGeneratorConfig {
  SCHEMA_PATH = '';
}

export class SqsSchemaService {
  private _entityConfigVersion = '';

  constructor(
    private couchDbClient: CouchDbClient,
    private entityConfigResolver: IEntityConfigResolver,
    private config: SqsSchemaGeneratorConfig,
  ) {}

  getSchemaPath(): string {
    return this.config.SCHEMA_PATH;
  }

  /**
   * Loads EntityConfig and updates SqsSchema if necessary
   */
  updateSchema(): Observable<void> {
    return this.entityConfigResolver.getEntityConfig().pipe(
      switchMap((entityConfig) => {
        if (entityConfig.version === this._entityConfigVersion) {
          return EMPTY;
        } else {
          return this.couchDbClient
            .putDatabaseDocument<DocSuccess>({
              documentId: this.config.SCHEMA_PATH,
              body: this.mapToSqsSchema(entityConfig),
              config: {},
            })
            .pipe(
              map((result) => {
                this._entityConfigVersion = result.rev;
              }),
            );
        }
      }),
    );
  }

  private mapToSqsSchema(entityConfig: EntityConfig): SqsSchema {
    const sqsSchema = new SqsSchema({
      tables: {},
      indexes: [],
      options: {
        table_name: {
          operation: 'prefix',
          field: '_id',
          separator: ':',
        },
      },
    });

    entityConfig.entities.forEach((entityConfig) => {
      const fields: {
        [column: string]: 'TEXT' | 'INTEGER';
      } = {};

      entityConfig.attributes.forEach((ea) => {
        if (!this.ignoreDataType(ea.type)) {
          fields[ea.name] = this.mapConfigDataTypeToSqsDataType(ea.type);
        }
      });

      this.getDefaultEntityAttributes().forEach((ea) => {
        if (fields[ea.name] === undefined && !this.ignoreDataType(ea.type)) {
          fields[ea.name] = this.mapConfigDataTypeToSqsDataType(ea.type);
        }
      });

      sqsSchema.sql.tables[entityConfig.label] = {
        fields: fields,
      };
    });

    return sqsSchema;
  }

  private getDefaultEntityAttributes(): EntityAttribute[] {
    return [
      { name: '_id', type: 'TEXT' },
      { name: '_rev', type: 'TEXT' },
      { name: 'created', type: 'TEXT' },
      { name: 'updated', type: 'TEXT' },
      { name: 'inactive', type: 'INTEGER' },
      { name: 'anonymized', type: 'INTEGER' },
    ];
  }

  private mapConfigDataTypeToSqsDataType(dataType: string): 'TEXT' | 'INTEGER' {
    switch (dataType.toLowerCase()) {
      case 'boolean':
      case 'number':
      case 'integer':
        return 'INTEGER';
      default:
        return 'TEXT';
    }
  }

  private ignoreDataType(dataType: string): boolean {
    switch (dataType) {
      case 'file':
        return true;
      default:
        return false;
    }
  }
}
