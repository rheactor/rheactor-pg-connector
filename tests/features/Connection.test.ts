import { describe, expect, it } from "vitest";

import { Client } from "#/features/Client";
import { QueryResult } from "#/features/QueryResult";

describe("Connection", () => {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
  });

  it("query()", async () => {
    const queryResult = await client.query<{ abc: boolean }>("SELECT TRUE AS ABC");

    expect(queryResult).instanceOf(QueryResult);
    expect(queryResult.command).toBe("SELECT");
    expect(queryResult.rowCount).toBe(1);

    for (const row of queryResult.rows) {
      expect(row).haveOwnProperty("abc");
      expect(row.abc).toBe(true);
    }
  });

  it("transaction()", async () => {
    const queryResult = await client.transaction(async (transaction) =>
      transaction.query<{ abc: boolean }>("SELECT TRUE AS ABC"),
    );

    expect(queryResult).instanceOf(QueryResult);
    expect(queryResult.command).toBe("SELECT");
    expect(queryResult.rowCount).toBe(1);

    for (const row of queryResult.rows) {
      expect(row).haveOwnProperty("abc");
      expect(row.abc).toBe(true);
    }
  });

  describe("types", () => {
    type FromTest = [text: string, value: unknown];

    const fromTests: FromTest[] = [
      ["TRUE", true],
      ["NULL", null],
      ["123", 123],
      ["123::BOOLEAN", true],
      ["TIMESTAMP '2000-01-01T00:00:00.123456Z'", new Date(2000, 0, 1, 0, 0, 0, 123)],
      ["'\\xDEADBEEF'::BYTEA", Buffer.from([0xde, 0xad, 0xbe, 0xef])],
      ["'A'::CHAR", "A"],
      ["9223372036854775807::BIGINT", 9_223_372_036_854_775_807n],
      ["'{\"abc\":123}'::JSON", { abc: 123 }],
      ["'{\"abc\":123}'::JSONB", { abc: 123 }],
    ];

    it.each(fromTests)("from (%j)", async (text, value) => {
      const queryResult = await client.query<{ value: unknown }>(`SELECT ${text} AS value`);

      expect(queryResult).instanceOf(QueryResult);
      expect(queryResult.rows[0]).toStrictEqual({ value });
    });

    type ToTest = [value: unknown, verification: string, result?: unknown];

    const toTests: ToTest[] = [
      [true, "TRUE"],
      [null, "NULL", null],
      [undefined, "NULL", null],
      [123, "123"],
      [true, "123::BOOLEAN"],
      [new Date(2000, 0, 1, 0, 0, 0, 123), "TIMESTAMP '2000-01-01T00:00:00.123000Z'"],
      [Buffer.from([0xde, 0xad, 0xbe, 0xef]), "'\\xDEADBEEF'::BYTEA"],
      ["A", "'A'::CHAR"],
      [{ abc: 123 }, "'{\"abc\":123}'::JSONB"],
    ];

    it.each(toTests)("to (%j)", async (input, verification, result: unknown = true) => {
      const queryResult = await client.query<{ verification: boolean }>(
        `SELECT $1 = ${verification} AS verification`,
        [input],
      );

      expect(queryResult).instanceOf(QueryResult);
      expect(queryResult.rows[0]).toStrictEqual({ verification: result });
    });
  });
});
