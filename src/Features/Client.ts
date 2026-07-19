/* eslint-disable unicorn/no-top-level-side-effects */
import { Pool } from "pg";
import { TypeOverrides, types } from "pg";

import { ClientAbstract } from "#/Features/ClientAbstract";
import { ClientTransaction } from "#/Features/ClientTransaction";

import type { ClientTransactionCallback } from "#/Features/ClientTransaction";
import type { ClientOptions } from "#/Types/ClientOptions";

export const typesExtended = new TypeOverrides();

// BigInt
typesExtended.setTypeParser(types.builtins.INT8, BigInt);

export class Client extends ClientAbstract<Pool> {
  public constructor(options: ClientOptions) {
    super(
      new Pool({
        host: options.host,
        user: options.user,
        password: options.password,
        database: options.database,
        port: options.port,
        application_name: options.applicationName,
        ssl: options.ssl,
        types: typesExtended,
      }),
    );
  }

  public async transaction<T>(callback: ClientTransactionCallback<T>) {
    return ClientTransaction.begin(this.client, callback);
  }

  public async close() {
    return this.client.end();
  }
}
