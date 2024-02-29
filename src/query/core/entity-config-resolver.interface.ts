import { Observable } from 'rxjs';
import { EntityConfig } from '../domain/EntityConfig';

/**
 * EntityConfigResolver
 * Notice: Could be moved to a separate module for handling configuration
 */
export interface IEntityConfigResolver {
  getEntityConfig(): Observable<EntityConfig>;
}
