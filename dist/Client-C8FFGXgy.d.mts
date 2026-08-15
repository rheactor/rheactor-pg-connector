import { Pool, PoolClient, PoolConfig, QueryResult, QueryResultRow, TypeOverrides } from "pg";
//#region src/features/QueryResult.d.ts
declare class QueryResult$1<T extends QueryResultRow> {
  readonly command: string;
  readonly rows: T[];
  readonly rowCount: number | null;
  constructor(result: QueryResult<T>);
}
//#endregion
//#region src/features/ClientAbstract.d.ts
declare class ClientAbstract<T extends Pool | PoolClient> {
  protected readonly client: T;
  protected constructor(client: T);
  query<Result extends QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult$1<Result>>;
}
//#endregion
//#region src/features/ClientTransaction.d.ts
type ClientTransactionCallback<T> = (transaction: ClientTransaction) => Promise<T>;
declare class ClientTransaction extends ClientAbstract<PoolClient> {
  private savepointCounter;
  static begin<T>(pool: Pool, callback: ClientTransactionCallback<T>): Promise<T>;
  transaction<T>(callback: ClientTransactionCallback<T>): Promise<T>;
  rollback<R>(result?: R): never;
}
//#endregion
//#region src/types/ClientOptions.d.ts
interface ClientOptions {
  host: string;
  user: string;
  password: string;
  database?: string;
  port?: number;
  applicationName?: string;
  ssl?: PoolConfig["ssl"];
}
//#endregion
//#region src/features/Client.d.ts
declare class Client extends ClientAbstract<Pool> {
  constructor(options: ClientOptions);
  transaction<T>(callback: ClientTransactionCallback<T>): Promise<T>;
  close(): Promise<void>;
}
//#endregion
export { QueryResult$1 as i, ClientOptions as n, ClientTransaction as r, Client as t };