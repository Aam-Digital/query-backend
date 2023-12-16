/**
 * The dates can be used in the SQL SELECT statements with a "?"
 * "from" will replace the first "?"
 * "to" will replace the second "?"
 */
export class QueryBody {
  from: string;
  to: string;
}
