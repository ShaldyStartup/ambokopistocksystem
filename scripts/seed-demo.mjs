import { createClient } from "@supabase/supabase-js";
// Run only against a disposable DEVELOPMENT project.
if (process.env.DEMO_SEED_CONFIRM !== "DEVELOPMENT_ONLY")
  throw new Error(
    "Set DEMO_SEED_CONFIRM=DEVELOPMENT_ONLY on a development project.",
  );
const {
  NEXT_PUBLIC_SUPABASE_URL: url,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
  SUPABASE_SECRET_KEY: newSecret,
  SUPABASE_SERVICE_ROLE_KEY: legacySecret,
  DEMO_OWNER_PASSWORD: ownerPassword,
  DEMO_STAFF_PASSWORD: staffPassword,
} = process.env;
const secret = newSecret || legacySecret;
if (!url || !key || !secret || !ownerPassword || !staffPassword)
  throw new Error("Missing development Supabase settings/passwords.");
if (ownerPassword.length < 12 || staffPassword.length < 12)
  throw new Error("Use development passwords of at least 12 characters.");
const admin = createClient(url, secret, { auth: { persistSession: false } });
const ensure = (r) => {
  if (r.error) throw r.error;
  return r.data;
};
for (const [email, role, password] of [
  ["owner@example.com", "owner", ownerPassword],
  ["staff@example.com", "staff", staffPassword],
]) {
  const result = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (result.error)
    throw new Error(
      "Seed stopped: account creation failed. Use a fresh development project; no existing passwords are overwritten.",
    );
  ensure(
    await admin.from("profiles").insert({
      id: result.data.user.id,
      name: `DEMO ${role === "owner" ? "Pemilik" : "Barista"}`,
      role,
      active: true,
    }),
  );
}
const client = createClient(url, key, { auth: { persistSession: false } });
ensure(
  await client.auth.signInWithPassword({
    email: "owner@example.com",
    password: ownerPassword,
  }),
);
for (const [category, name, unit, initial, minimum] of [
  ["DEMO Biji kopi", "DEMO Biji kopi", "kg", 10, 5],
  ["DEMO Susu", "DEMO Susu", "liter", 3, 5],
  ["DEMO Kemasan", "DEMO Gelas", "pcs", 100, 30],
]) {
  const categoryId = ensure(
    await client.rpc("save_category", {
      p_id: null,
      p_name: category,
      p_active: true,
    }),
  );
  ensure(
    await client.rpc("save_item", {
      p_id: null,
      p_data: {
        name,
        category_id: categoryId,
        unit,
        initial_stock: initial,
        minimum_stock: minimum,
        active: true,
        notes: "DATA CONTOH PENGEMBANGAN — bukan stok riil Ambo Coffee.",
      },
    }),
  );
}
ensure(
  await client.rpc("save_category", {
    p_name: "DEMO E2E Pengujian",
    p_active: true,
  }),
);
await client.auth.signOut();
console.log(
  "Development demo created. All names are marked DEMO; quantities are fictional.",
);
