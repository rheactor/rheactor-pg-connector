import { describe, expect, it } from "vitest";

import type { Client } from "#/Features/Client";
import { ClientTransaction } from "#/Features/ClientTransaction";
import { client } from "#tests/fixtures";

async function select(transaction: Client | ClientTransaction, table: string) {
  const { rows } = await transaction.query<{ id: number }>(`SELECT id FROM ${table}`);

  return rows;
}

describe(ClientTransaction, () => {
  it("nested transactions", async () => {
    expect.assertions(11);

    await client.transaction(async (transactionA) => {
      await transactionA.query("CREATE TEMPORARY TABLE nested_test_a (id INT)");

      // Level 1: insert 10
      await transactionA.query("INSERT INTO nested_test_a VALUES (10)");
      await expect(select(transactionA, "nested_test_a")).resolves.toStrictEqual([{ id: 10 }]);

      // Level 2
      await transactionA.transaction(async (transactionB) => {
        await transactionB.query("INSERT INTO nested_test_a VALUES (20)");
        await expect(select(transactionB, "nested_test_a")).resolves.toStrictEqual([
          { id: 10 },
          { id: 20 },
        ]);

        // Level 3a: insert 30 (committed within l2)
        await transactionB.transaction(async (transactionC) => {
          await transactionC.query("INSERT INTO nested_test_a VALUES (30)");
          await expect(select(transactionC, "nested_test_a")).resolves.toStrictEqual([
            { id: 10 },
            { id: 20 },
            { id: 30 },
          ]);
        });

        await expect(select(transactionB, "nested_test_a")).resolves.toStrictEqual([
          { id: 10 },
          { id: 20 },
          { id: 30 },
        ]);

        // Level 3b: insert 40 then rollback (only 40 undone)
        await transactionB.transaction(async (transactionC) => {
          await transactionC.query("INSERT INTO nested_test_a VALUES (40)");
          await expect(select(transactionC, "nested_test_a")).resolves.toStrictEqual([
            { id: 10 },
            { id: 20 },
            { id: 30 },
            { id: 40 },
          ]);

          transactionC.rollback();
        });

        await expect(select(transactionB, "nested_test_a")).resolves.toStrictEqual([
          { id: 10 },
          { id: 20 },
          { id: 30 },
        ]);
      });

      // back at l1: 10,20,30 remain (40 rolled back)
      await expect(select(transactionA, "nested_test_a")).resolves.toStrictEqual([
        { id: 10 },
        { id: 20 },
        { id: 30 },
      ]);

      // Level 2 again: insert 50 then whole l2 rolls back (50 undone)
      await transactionA.transaction(async (transactionB) => {
        await transactionB.query("INSERT INTO nested_test_a VALUES (50)");
        await expect(select(transactionB, "nested_test_a")).resolves.toStrictEqual([
          { id: 10 },
          { id: 20 },
          { id: 30 },
          { id: 50 },
        ]);

        transactionB.rollback();
      });

      await expect(select(transactionA, "nested_test_a")).resolves.toStrictEqual([
        { id: 10 },
        { id: 20 },
        { id: 30 },
      ]);

      // Level 1: final insert 60
      await transactionA.query("INSERT INTO nested_test_a VALUES (60)");
      await expect(select(transactionA, "nested_test_a")).resolves.toStrictEqual([
        { id: 10 },
        { id: 20 },
        { id: 30 },
        { id: 60 },
      ]);
    });

    // After top-level commit, a fresh scope must see 10,20,30,60.
    await expect(select(client, "nested_test_a")).resolves.toStrictEqual([
      { id: 10 },
      { id: 20 },
      { id: 30 },
      { id: 60 },
    ]);
  });

  it("top-level rollback", async () => {
    expect.assertions(1);

    await client.transaction(async (transactionA) => {
      await transactionA.query("CREATE TEMPORARY TABLE nested_test_b (id INT)");
      await transactionA.query("INSERT INTO nested_test_b VALUES (10)");

      await transactionA.transaction(async (transactionB) => {
        await transactionB.query("INSERT INTO nested_test_b VALUES (20)");
        await transactionB.transaction(async (transactionC) => {
          await transactionC.query("INSERT INTO nested_test_b VALUES (30)");
        });
      });

      await expect(select(transactionA, "nested_test_b")).resolves.toStrictEqual([
        { id: 10 },
        { id: 20 },
        { id: 30 },
      ]);

      transactionA.rollback();

      // Should never get here.
      expect(true).toBe(false);
    });
  });

  it("top-level query error", async () => {
    expect.assertions(2);

    try {
      await client.transaction(async (transactionA) => {
        await transactionA.query('SELECT * FROM "table_that_does_not_exist_xyz"');

        // Should never get here.
        expect(true).toBe(false);
      });
    } catch (error) {
      // oxlint-disable-next-line vitest/no-conditional-expect
      expect(error).toBeInstanceOf(Error);
      // oxlint-disable-next-line vitest/no-conditional-expect
      expect((error as Error).message).not.toMatch(/savepoint ".+" does not exist/v);
    }
  });

  it("immediate transaction", async () => {
    expect.assertions(1);

    await client.transaction(async (transactionA) => {
      await transactionA.transaction(async (transactionB) => {
        await transactionB.transaction(async (transactionC) => {
          const { rows } = await transactionC.query("SELECT TRUE AS value");

          expect(rows).toStrictEqual([{ value: true }]);
        });
      });
    });
  });
});
