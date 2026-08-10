import { DatabaseError } from "pg";
import type { Pool, PoolClient, QueryResultRow } from "pg";

import { QueryError } from "#/Errors/QueryError";
import { QueryResult } from "#/Features/QueryResult";

export class ClientAbstract<T extends Pool | PoolClient> {
  protected constructor(protected readonly client: T) {}

  public async query<Result extends QueryResultRow>(text: string, values?: unknown[]) {
    try {
      const queryResult = await this.client.query<Result>({ text, values });

      return new QueryResult<Result>(queryResult);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw new QueryError(error);
      }

      throw error;
    }
  }
}
