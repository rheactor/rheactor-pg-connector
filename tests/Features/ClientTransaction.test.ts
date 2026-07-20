import { describe, expect, it } from "vitest";

import { client } from "#tests/fixtures";

import type { Client } from "#/Features/Client";
import type { ClientTransaction } from "#/Features/ClientTransaction";

async function select(transaction: Client | ClientTransaction, table: string) {
  const { rows } = await transaction.query<{ id: number }>(`SELECT id FROM ${table}`);

  return rows;
}

describe("ClientTransaction", () => {
  it("nested transactions", async () => {
    expect.assertions(11);

    await client.transaction(async (l1) => {
      await l1.query("CREATE TEMPORARY TABLE nested_test_a (id INT)");

      // Level 1: insert 10
      await l1.query("INSERT INTO nested_test_a VALUES (10)");
      await expect(select(l1, "nested_test_a")).resolves.toStrictEqual([{ id: 10 }]);

      // Level 2
      await l1.transaction(async (l2) => {
        await l2.query("INSERT INTO nested_test_a VALUES (20)");
        await expect(select(l2, "nested_test_a")).resolves.toStrictEqual([{ id: 10 }, { id: 20 }]);

        // Level 3a: insert 30 (committed within l2)
        await l2.transaction(async (l3a) => {
          await l3a.query("INSERT INTO nested_test_a VALUES (30)");
          await expect(select(l3a, "nested_test_a")).resolves.toStrictEqual([
            { id: 10 },
            { id: 20 },
            { id: 30 },
          ]);
        });

        await expect(select(l2, "nested_test_a")).resolves.toStrictEqual([
          { id: 10 },
          { id: 20 },
          { id: 30 },
        ]);

        // Level 3b: insert 40 then rollback (only 40 undone)
        await l2.transaction(async (l3b) => {
          await l3b.query("INSERT INTO nested_test_a VALUES (40)");
          await expect(select(l3b, "nested_test_a")).resolves.toStrictEqual([
            { id: 10 },
            { id: 20 },
            { id: 30 },
            { id: 40 },
          ]);

          l3b.rollback();
        });

        await expect(select(l2, "nested_test_a")).resolves.toStrictEqual([
          { id: 10 },
          { id: 20 },
          { id: 30 },
        ]);
      });

      // back at l1: 10,20,30 remain (40 rolled back)
      await expect(select(l1, "nested_test_a")).resolves.toStrictEqual([
        { id: 10 },
        { id: 20 },
        { id: 30 },
      ]);

      // Level 2 again: insert 50 then whole l2 rolls back (50 undone)
      await l1.transaction(async (l2b) => {
        await l2b.query("INSERT INTO nested_test_a VALUES (50)");
        await expect(select(l2b, "nested_test_a")).resolves.toStrictEqual([
          { id: 10 },
          { id: 20 },
          { id: 30 },
          { id: 50 },
        ]);

        l2b.rollback();
      });

      await expect(select(l1, "nested_test_a")).resolves.toStrictEqual([
        { id: 10 },
        { id: 20 },
        { id: 30 },
      ]);

      // Level 1: final insert 60
      await l1.query("INSERT INTO nested_test_a VALUES (60)");
      await expect(select(l1, "nested_test_a")).resolves.toStrictEqual([
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

    await client.transaction(async (l1) => {
      await l1.query("CREATE TEMPORARY TABLE nested_test_b (id INT)");
      await l1.query("INSERT INTO nested_test_b VALUES (10)");

      await l1.transaction(async (l2) => {
        await l2.query("INSERT INTO nested_test_b VALUES (20)");
        await l2.transaction(async (l3) => {
          await l3.query("INSERT INTO nested_test_b VALUES (30)");
        });
      });

      await expect(select(l1, "nested_test_b")).resolves.toStrictEqual([
        { id: 10 },
        { id: 20 },
        { id: 30 },
      ]);

      l1.rollback();

      // Should never get here.
      expect(true).toBeFalsy();
    });
  });

  it("top-level query error", async () => {
    expect.assertions(2);

    try {
      await client.transaction(async (l1) => {
        await l1.query('SELECT * FROM "table_that_does_not_exist_xyz"');

        // Should never get here.
        expect(true).toBeFalsy();
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).not.toMatch(/savepoint ".+" does not exist/);
    }
  });

  it("immediate transaction", async () => {
    expect.assertions(1);

    await client.transaction(async (t1) => {
      await t1.transaction(async (t2) => {
        await t2.transaction(async (t3) => {
          const { rows } = await t3.query("SELECT TRUE AS value");

          expect(rows).toStrictEqual([{ value: true }]);
        });
      });
    });
  });
});
