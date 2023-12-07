/**
 * The report entity needs to have the following format in order to work.
 */
export interface SqlReport {
  mode: 'sql';
  aggregationDefinitions: string[];
}
