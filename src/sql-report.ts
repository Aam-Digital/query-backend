/**
 * The report entity needs to have the following format in order to work.
 * This aligns with the same interface in {@link https://github.com/Aam-Digital/ndb-core}
 */
export interface SqlReport {
  mode: 'sql';
  aggregationDefinitions: string[];
}
