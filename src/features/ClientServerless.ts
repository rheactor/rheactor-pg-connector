import { after } from "next/server";

import { Client } from "#/features/Client";

import type { ClientOptions } from "#/types/ClientOptions";

export class ClientServerless extends Client {
  public constructor(options: ClientOptions) {
    super(options);

    after(async () => this.close());
  }
}
