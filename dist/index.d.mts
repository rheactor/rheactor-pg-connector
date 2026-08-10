import { i as QueryResult, n as ClientOptions, r as ClientTransaction, t as Client } from "./Client-DyRvAb1K.mjs";
import { DatabaseError } from "pg";
//#region src/Errors/QueryError.d.ts
declare class QueryError extends Error {
  readonly severity: string | undefined;
  readonly code: string | undefined;
  constructor(error: DatabaseError);
}
//#endregion
export { Client, type ClientOptions, type ClientTransaction, QueryError, type QueryResult };