import { it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { setup, scenarios } from "../scripts/db-scenarios.mjs";
it("PostgreSQL integration: atomic stock changes, audit, RLS and permissions", async () => {
  const database = new PGlite();
  const query = async (sql: string, args: unknown[] = []) => {
    if (args.length) return database.query(sql, args);
    const results = await database.exec(sql);
    return results.at(-1) ?? { rows: [] };
  };
  try {
    await setup(query);
    const checks = await scenarios(query);
    console.info(
      `${checks} PostgreSQL integrity and authorization checks passed.`,
    );
    expect(checks).toBeGreaterThanOrEqual(30);
  } finally {
    await database.close();
  }
}, 60000);
