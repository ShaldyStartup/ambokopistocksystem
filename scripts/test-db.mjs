import pg from "pg";
import { setup, scenarios } from "./db-scenarios.mjs";
if (!process.env.TEST_DATABASE_URL)
  throw new Error(
    "TEST_DATABASE_URL is required. Use a fresh disposable local PostgreSQL/Supabase database.",
  );
const client = new pg.Client({
  connectionString: process.env.TEST_DATABASE_URL,
});
await client.connect();
const query = async (sql, args = []) => {
  // A savepoint per operation allows the scenario to inspect state after expected SQL errors.
  await client.query("savepoint test_operation");
  try {
    const result = await client.query(sql, args);
    await client.query("release savepoint test_operation");
    return Array.isArray(result) ? result.at(-1) : result;
  } catch (error) {
    await client.query("rollback to savepoint test_operation");
    await client.query("release savepoint test_operation");
    throw error;
  }
};
try {
  await client.query("begin");
  const exists = await client.query(
    "select to_regclass('public.inventory_items') as existing",
  );
  if (exists.rows[0].existing)
    throw new Error(
      "Refusing an existing application database. Use a fresh disposable database.",
    );
  await setup(query, { real: true });
  console.log(`${await scenarios(query)} database integration checks passed.`);
} finally {
  await client.query("rollback");
  await client.end();
}
