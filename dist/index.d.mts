import { i as QueryResult, n as ClientOptions, r as ClientTransaction, t as Client } from "./Client-C8FFGXgy.mjs";
import { DatabaseError } from "pg";
//#region src/errors/QueryError.d.ts
export declare class QueryError extends Error {
  readonly severity: string | undefined;
  readonly code: string | undefined;
  constructor(error: DatabaseError);
}
//#endregion
export { Client, type ClientOptions, type ClientTransaction, type QueryResult };