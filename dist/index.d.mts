import { i as QueryResult, n as ClientOptions, r as ClientTransaction, t as Client } from "./Client-_I9A-wIl.mjs";
import { DatabaseError } from "pg";
//#region src/Errors/QueryError.d.ts
declare class QueryError extends Error {
  readonly severity: string | undefined;
  readonly code: string | undefined;
  constructor(error: DatabaseError);
}
//#endregion
//#region src/Services/EscapeService.d.ts
declare function escapeIdentifier(identifier: string): string;
declare function escapeLiteral(value: unknown): string;
//#endregion
export { Client, type ClientOptions, type ClientTransaction, QueryError, type QueryResult, escapeIdentifier, escapeLiteral };