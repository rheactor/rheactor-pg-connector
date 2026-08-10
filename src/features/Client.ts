import { Pool, TypeOverrides, types } from "pg";

import { ClientAbstract } from "#/features/ClientAbstract";
import { ClientTransaction } from "#/features/ClientTransaction";
import type { ClientTransactionCallback } from "#/features/ClientTransaction";
import type { ClientOptions } from "#/types/ClientOptions";

export const typesExtended = new TypeOverrides();

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
