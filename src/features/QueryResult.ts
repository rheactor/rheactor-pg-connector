import type { QueryResult as PgQueryResult, QueryResultRow } from "pg";

export class QueryResult<T extends QueryResultRow> {
  public readonly command;

  public readonly rows;

  public readonly rowCount;

  public constructor(result: PgQueryResult<T>) {
    this.command = result.command;
    this.rows = result.rows;
    this.rowCount = result.rowCount;
  }
}
