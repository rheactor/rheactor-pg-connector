import { after } from "next/server";

import { Client } from "#/Features/Client";
import type { ClientOptions } from "#/Types/ClientOptions";

export class ClientServerless extends Client {
  public constructor(options: ClientOptions) {
    super(options);

    after(async () => this.close());
  }
}
