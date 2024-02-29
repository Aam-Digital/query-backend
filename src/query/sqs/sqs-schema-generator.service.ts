import { catchError, Observable, of, switchMap, tap, zipWith } from 'rxjs';
import { IEntityConfigResolver } from '../core/entity-config-resolver.interface';
import { SqsSchema } from './dtos';
import { DocSuccess } from '../../couchdb/dtos';
import { EntityAttribute, EntityConfig } from '../domain/EntityConfig';
import { ICouchDbClient } from '../../couchdb/couch-db-client.interface';

export class SqsSchemaGeneratorConfig {
  SCHEMA_PATH = '';
}

export class SqsSchemaService {
  constructor(
    private couchDbClient: ICouchDbClient,
    private entityConfigResolver: IEntityConfigResolver,
    private config: SqsSchemaGeneratorConfig,
  ) {}

  getSchemaPath(): string {
    return this.config.SCHEMA_PATH;
  }

  /**
   * Loads EntityConfig and current SQS Schema. Updates SqsSchema if necessary
   */
  updateSchema(): Observable<void> {
    return this.entityConfigResolver.getEntityConfig().pipe(
      zipWith(
        this.couchDbClient
          .getDatabaseDocument<SqsSchema>({
            documentId: this.config.SCHEMA_PATH,
          })
          .pipe(
            catchError(() => {
              console.debug(
                '[SqsSchemaService] No active sqs schema found in db.',
              );
              return of(undefined);
            }),
          ),
      ),
      switchMap((result) => {
        const entityConfig = result[0];
        const currentSqsSchema = result[1];
        const newSqsSchema = this.mapToSqsSchema(entityConfig);

        if (currentSqsSchema?.configVersion === newSqsSchema.configVersion) {
          console.debug(
            '[SqsSchemaService] sqs schema is up to date. not updated.',
          );
          return of(undefined);
        }

        return this.couchDbClient
          .putDatabaseDocument<DocSuccess>({
            documentId: this.config.SCHEMA_PATH,
            body: newSqsSchema,
            config: {},
          })
          .pipe(
            tap((result) => {
              console.debug(
                '[SqsSchemaService] sqs schema updated to latest version',
                result,
              );
            }),
            switchMap(() => of(undefined)),
          );
      }),
    );
  }

  private mapToSqsSchema(entityConfig: EntityConfig): SqsSchema {
    const sqsSchema: any = {
      tables: {},
      indexes: [],
      options: {
        table_name: {
          operation: 'prefix',
          field: '_id',
          separator: ':',
        },
      },
    };

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

      sqsSchema.tables[entityConfig.label] = {
        fields: fields,
      };
    });

    return new SqsSchema(
      sqsSchema.tables,
      sqsSchema.indexes,
      sqsSchema.options,
    );
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
