import type { DatabaseError } from "pg";

export class QueryError extends Error {
  public readonly severity;

  public readonly code;

  public constructor(error: DatabaseError) {
    super(error.message, { cause: error });

    this.name = "QueryError";
    this.severity = error.severity;
    this.code = error.code;
  }
}
