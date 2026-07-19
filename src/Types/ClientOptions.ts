import type { PoolConfig } from "pg";

export interface ClientOptions {
  host: string;
  user: string;
  password: string;
  database: string;
  port?: number;
  applicationName?: string;
  ssl?: PoolConfig["ssl"];
}
