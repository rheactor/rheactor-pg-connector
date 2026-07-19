import { ClientAbstract } from "#/features/ClientAbstract";

import type { Pool, PoolClient } from "pg";

export type ClientTransactionCallback<T> = (transaction: ClientTransaction) => Promise<T>;

export class ClientTransaction extends ClientAbstract<PoolClient> {
  public static async begin<T>(pool: Pool, callback: ClientTransactionCallback<T>) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const result = await callback(new ClientTransaction(client));
      await client.query("COMMIT");

      return result;
    } catch (error) {
      await client.query("ROLLBACK");

      throw error;
    } finally {
      client.release();
    }
  }
}
