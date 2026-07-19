import { QueryResult } from "#/features/QueryResult";

import type { Pool, PoolClient, QueryResultRow } from "pg";

export class ClientAbstract<T extends Pool | PoolClient> {
  protected constructor(protected readonly client: T) {}

  public async query<Result extends QueryResultRow>(text: string, values?: unknown[]) {
    const queryResult = await this.client.query<Result>({ text, values });

    return new QueryResult<Result>(queryResult);
  }
}
