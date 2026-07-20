import { i as QueryResult, n as ClientOptions, r as ClientTransaction, t as Client } from "./Client-_I9A-wIl.mjs";
//#region src/Services/EscapeService.d.ts
declare function escapeIdentifier(identifier: string): string;
declare function escapeLiteral(value: unknown): string;
//#endregion
export { Client, type ClientOptions, type ClientTransaction, type QueryResult, escapeIdentifier, escapeLiteral };