import { TransactionRollback } from "#/Errors/TransactionRollback";
import { ClientAbstract } from "#/Features/ClientAbstract";

import type { Pool, PoolClient } from "pg";

export type ClientTransactionCallback<T> = (transaction: ClientTransaction) => Promise<T>;

export class ClientTransaction extends ClientAbstract<PoolClient> {
  private savepointCounter = 0;

  public static async begin<T>(pool: Pool, callback: ClientTransactionCallback<T>) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const result = await callback(new ClientTransaction(client));
      await client.query("COMMIT");

      return result;
    } catch (error) {
      await client.query("ROLLBACK");

      if (error instanceof TransactionRollback) {
        return error.result as T;
      }

      throw error;
    } finally {
      client.release();
    }
  }

  public async transaction<T>(callback: ClientTransactionCallback<T>) {
    const savepointName = `sp_${++this.savepointCounter}`;

    try {
      await this.query(`SAVEPOINT ${savepointName}`);
      const result = await callback(this);
      await this.query(`RELEASE SAVEPOINT ${savepointName}`);

      return result;
    } catch (error) {
      try {
        await this.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
      } catch {
        // Empty.
      }

      if (error instanceof TransactionRollback) {
        return error.result as T;
      }

      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  public rollback<R>(result?: R): never {
    throw new TransactionRollback<R>(result);
  }
}
