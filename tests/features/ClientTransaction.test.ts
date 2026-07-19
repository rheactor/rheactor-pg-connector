/* eslint-disable unicorn/prefer-await */
import { describe, expect, it } from "vitest";

import { client } from "#tests/fixtures";

import type { Client } from "#/features/Client";
import type { ClientTransaction } from "#/features/ClientTransaction";

async function select(transaction: Client | ClientTransaction) {
  const { rows } = await transaction.query<{ id: number }>("SELECT id FROM nested_test");

  return rows;
}

describe("ClientTransaction", () => {
  it("nested transaction", async () => {
    await client.transaction(async (l1) => {
      await l1.query("CREATE TEMPORARY TABLE nested_test (id INT)");

      // Level 1: insert 10
      await l1.query("INSERT INTO nested_test VALUES (10)");
      await expect(select(l1)).resolves.toStrictEqual([{ id: 10 }]);

      // Level 2
      await l1.transaction(async (l2) => {
        await l2.query("INSERT INTO nested_test VALUES (20)");
        await expect(select(l2)).resolves.toStrictEqual([{ id: 10 }, { id: 20 }]);

        // Level 3a: insert 30 (committed within l2)
        await l2.transaction(async (l3a) => {
          await l3a.query("INSERT INTO nested_test VALUES (30)");
          await expect(select(l3a)).resolves.toStrictEqual([{ id: 10 }, { id: 20 }, { id: 30 }]);
        });

        expect(await select(l2)).toStrictEqual([{ id: 10 }, { id: 20 }, { id: 30 }]);

        // Level 3b: insert 40 then rollback (only 40 undone)
        await l2
          .transaction(async (l3b) => {
            await l3b.query("INSERT INTO nested_test VALUES (40)");
            await expect(select(l3b)).resolves.toStrictEqual([
              { id: 10 },
              { id: 20 },
              { id: 30 },
              { id: 40 },
            ]);

            throw new Error("rollback l3b");
          })
          .catch(() => {
            // Empty.
          });

        expect(await select(l2)).toStrictEqual([{ id: 10 }, { id: 20 }, { id: 30 }]);
      });

      // back at l1: 10,20,30 remain (40 rolled back)
      await expect(select(l1)).resolves.toStrictEqual([{ id: 10 }, { id: 20 }, { id: 30 }]);

      // Level 2 again: insert 50 then whole l2 rolls back (50 undone)
      await l1
        .transaction(async (l2b) => {
          await l2b.query("INSERT INTO nested_test VALUES (50)");
          await expect(select(l2b)).resolves.toStrictEqual(4);

          throw new Error("rollback l2b");
        })
        .catch(() => {
          // Empty.
        });

      await expect(select(l1)).resolves.toStrictEqual([{ id: 10 }, { id: 20 }, { id: 30 }]);

      // Level 1: final insert 60
      await l1.query("INSERT INTO nested_test VALUES (60)");
      await expect(select(l1)).resolves.toStrictEqual([
        { id: 10 },
        { id: 20 },
        { id: 30 },
        { id: 60 },
      ]);
    });

    // After top-level commit, a fresh scope must see 10,20,30,60.
    await expect(select(client)).resolves.toStrictEqual([
      { id: 10 },
      { id: 20 },
      { id: 30 },
      { id: 60 },
    ]);
  });

  it("top-level rollback undoes every nested level", async () => {
    const outcome = await client
      .transaction(async (l1) => {
        await l1.query("CREATE TEMPORARY TABLE nested_test (id INT)");
        await l1.query("INSERT INTO nested_test VALUES (1)");

        await l1.transaction(async (l2) => {
          await l2.query("INSERT INTO nested_test VALUES (2)");
          await l2.transaction(async (l3) => {
            await l3.query("INSERT INTO nested_test VALUES (3)");
          });
        });

        expect(await select(l1)).toStrictEqual(3);

        throw new Error("rollback all");
      })
      .catch(() => "rolled-back");

    expect(outcome).toBe("rolled-back");
  });
});
