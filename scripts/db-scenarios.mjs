import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
export const owner = "10000000-0000-4000-8000-000000000001",
  staff = "10000000-0000-4000-8000-000000000002",
  manager = "10000000-0000-4000-8000-000000000003";
export async function setup(q, { real = false } = {}) {
  await q(`create schema if not exists auth;`);
  await q(
    `do $$ begin if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if; if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if; end $$;`,
  );
  await q(`create table if not exists auth.users(id uuid primary key);`);
  // A test-only auth.uid implementation; transaction rollback restores a pre-existing Supabase function.
  await q(
    `create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`,
  );
  await q(
    `grant usage on schema public,auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`,
  );
  const directory = new URL("../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(directory))
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    let migration = await readFile(new URL(file, directory), "utf8");
    if (!real)
      migration = migration.replace(
        "create extension if not exists pgcrypto;",
        "",
      );
    await q(migration);
  }
  await q(
    `insert into auth.users(id) values ('${owner}'),('${staff}'),('${manager}'); insert into public.profiles(id,name,role) values ('${owner}','DEMO Pemilik','owner'),('${staff}','DEMO Barista','staff'),('${manager}','DEMO Manager','manager');`,
  );
}
export async function scenarios(q) {
  let checks = 0;
  const ok = (value, message) => {
    assert.ok(value, message);
    checks++;
  };
  const role = async (id) => {
    await q("reset role");
    await q(`select set_config('request.jwt.claim.sub',$1,false)`, [id]);
    await q("set role authenticated");
  };
  const rejects = async (sql, args, pattern) => {
    let failure;
    try {
      await q(sql, args);
    } catch (e) {
      failure = e;
    }
    ok(
      failure && (!pattern || pattern.test(failure.message)),
      `Expected SQL rejection: ${pattern}; got ${failure?.message}`,
    );
  };
  const rpc = `select public.record_stock($1::jsonb,$2::text,'2026-10-15','DEMO Shift',$3::text,$4::text) as n`;
  const record = (
    id,
    quantity,
    expected,
    type = "stock_count",
    reason = null,
    notes = "",
  ) =>
    q(rpc, [JSON.stringify([{ id, quantity, expected }]), type, reason, notes]);
  await role(owner);
  const cat = (
    await q(`select public.save_category(null,'DEMO Kategori',true) as id`)
  ).rows[0].id;
  const make = async (name, initial = 10) =>
    (
      await q(`select public.save_item(null,$1::jsonb) as id`, [
        JSON.stringify({
          name,
          category_id: cat,
          unit: "kg",
          initial_stock: initial,
          minimum_stock: 5,
          notes: "DEMO",
          active: true,
        }),
      ])
    ).rows[0].id;
  const item = await make("DEMO Kopi"),
    other = await make("DEMO Susu", 20);
  const get = async (id) =>
    (
      await q(
        "select current_stock,minimum_stock,active from public.inventory_items where id=$1",
        [id],
      )
    ).rows[0];
  const count = async () =>
    Number(
      (await q("select count(*) as n from public.stock_records")).rows[0].n,
    );
  ok((await count()) === 2, "Initial records created for both items");
  await role(staff);
  await record(item, 5, 10);
  let row = await get(item);
  ok(Number(row.current_stock) === 5, "Count updates inventory");
  const audit = (
    await q(
      `select * from public.stock_records where inventory_item_id=$1 and record_type='stock_count'`,
      [item],
    )
  ).rows[0];
  ok(
    Number(audit.previous_quantity) === 10 &&
      Number(audit.new_quantity) === 5 &&
      Number(audit.quantity_change) === -5,
    "Audit stores old/new/difference",
  );
  ok(
    audit.recorded_by === staff &&
      audit.recorder_name === "DEMO Barista" &&
      audit.created_at &&
      audit.shift_label === "DEMO Shift",
    "Audit stores identity/time/shift",
  );
  ok(audit.was_low_stock === true, "Threshold equality is low stock");
  await record(item, 2, 5, "addition", "DEMO Stok diterima");
  ok(Number((await get(item)).current_stock) === 7, "Addition");
  await record(item, 1, 7, "reduction", "DEMO Barang rusak");
  ok(Number((await get(item)).current_stock) === 6, "Reduction");
  await record(item, 3, 6, "correction", "DEMO Koreksi");
  ok(Number((await get(item)).current_stock) === 3, "Correction");
  await rejects(
    rpc,
    [
      JSON.stringify([{ id: item, quantity: 4, expected: 3 }]),
      "reduction",
      "DEMO",
      "",
    ],
    /negatif/,
  );
  ok(
    Number((await get(item)).current_stock) === 3,
    "Negative reduction cannot change stock",
  );
  await rejects(
    rpc,
    [
      JSON.stringify([{ id: item, quantity: 0, expected: 3 }]),
      "correction",
      "DEMO",
      "",
    ],
    /tidak valid/,
  );
  await rejects(
    rpc,
    [
      JSON.stringify([{ id: item, quantity: 7, expected: 10 }]),
      "stock_count",
      null,
      "",
    ],
    /Stok berubah/,
  );
  ok(Number((await get(item)).current_stock) === 3, "Stale writes rejected");
  await rejects(
    `update public.inventory_items set minimum_stock=0 where id=$1`,
    [item],
    /permission denied/,
  );
  await rejects(
    `select public.save_item($1,$2::jsonb)`,
    [
      item,
      JSON.stringify({
        name: "Hacked",
        category_id: cat,
        unit: "kg",
        minimum_stock: 0,
        active: true,
      }),
    ],
    /Akses ditolak/,
  );
  await rejects(
    `select public.save_category(null,'Forbidden',true)`,
    [],
    /Akses ditolak/,
  );
  await rejects(
    `update public.profiles set role='owner' where id=$1`,
    [staff],
    /permission denied/,
  );
  await rejects(`delete from public.stock_records`, [], /permission denied/);
  await rejects(
    `insert into public.stock_records default values`,
    [],
    /permission denied/,
  );
  // Insert failure AFTER an earlier batch entry succeeded must roll back the entire RPC.
  await q("reset role");
  await q(
    `create function public.test_fail_insert() returns trigger language plpgsql as $$ begin if new.inventory_item_id::text=(select max(id::text) from public.inventory_items) and new.record_type='stock_count' then raise exception 'FORCED_HISTORY_FAILURE'; end if; return new; end $$; create trigger test_fail before insert on public.stock_records for each row execute function public.test_fail_insert();`,
  );
  await role(staff);
  const before = await count();
  await rejects(
    rpc,
    [
      JSON.stringify([
        { id: item, quantity: 1, expected: 3 },
        { id: other, quantity: 2, expected: 20 },
      ]),
      "stock_count",
      null,
      "",
    ],
    /FORCED_HISTORY_FAILURE/,
  );
  ok(
    Number((await get(item)).current_stock) === 3 &&
      Number((await get(other)).current_stock) === 20,
    "Batch rollback preserves every item",
  );
  ok((await count()) === before, "Batch rollback preserves history");
  await q("reset role");
  await q(
    "drop trigger test_fail on public.stock_records; drop function public.test_fail_insert();",
  );
  // Trigger preserves audit even for privileged ordinary SQL updates.
  await rejects(
    `update public.stock_records set notes='overwrite'`,
    [],
    /permanen/,
  );
  await role(manager);
  await q(`select public.save_item($1,$2::jsonb)`, [
    item,
    JSON.stringify({
      name: "DEMO Kopi Baru",
      category_id: cat,
      unit: "gram",
      minimum_stock: 1,
      active: false,
      notes: "",
    }),
  ]);
  row = await get(item);
  ok(
    !row.active &&
      Number(row.current_stock) === 3 &&
      Number(row.minimum_stock) === 1,
    "Manager can configure without changing quantity",
  );
  const snapshot = (
    await q(
      `select item_name,unit,minimum_stock from public.stock_records where id=$1`,
      [audit.id],
    )
  ).rows[0];
  ok(
    snapshot.item_name === "DEMO Kopi" &&
      snapshot.unit === "kg" &&
      Number(snapshot.minimum_stock) === 5,
    "Audit snapshot survives metadata edits",
  );
  await role(staff);
  await rejects(
    rpc,
    [
      JSON.stringify([{ id: item, quantity: 1, expected: 3 }]),
      "stock_count",
      null,
      "",
    ],
    /tidak aktif/,
  );
  await q("reset role");
  // Insert historical fixture as DB administrator; regular app users cannot insert directly.
  await q(
    `insert into public.stock_records(inventory_item_id,record_type,previous_quantity,new_quantity,quantity_change,recorded_by,item_name,unit,minimum_stock,category_name,recorder_name,created_at) values($1,'initial',0,0,0,$2,'DEMO Lama','kg',0,'DEMO','DEMO',now()-interval '31 days')`,
    [other, owner],
  );
  await role(staff);
  ok(
    Number(
      (
        await q(
          `select count(*) as n from public.stock_records where item_name='DEMO Lama'`,
        )
      ).rows[0].n,
    ) === 0,
    "Staff cannot read old history",
  );
  await role(owner);
  ok(
    Number(
      (
        await q(
          `select count(*) as n from public.stock_records where item_name='DEMO Lama'`,
        )
      ).rows[0].n,
    ) === 1,
    "Owner reads old history",
  );
  await q("reset role");
  await q(`update public.profiles set active=false where id=$1`, [staff]);
  await role(staff);
  ok(
    (await q("select * from public.inventory_items")).rows.length === 0,
    "Inactive profiles cannot read inventory",
  );
  await rejects(
    rpc,
    [
      JSON.stringify([{ id: other, quantity: 1, expected: 20 }]),
      "stock_count",
      null,
      "",
    ],
    /Akses ditolak/,
  );
  await q("reset role");
  await q("set role anon");
  ok(
    (
      await q(
        `select has_table_privilege('anon','public.inventory_items','SELECT') as allowed`,
      )
    ).rows[0].allowed === false,
    "Anonymous has no table access",
  );
  await q("reset role");
  return checks;
}
