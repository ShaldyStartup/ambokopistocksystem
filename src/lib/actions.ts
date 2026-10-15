"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, session, configured } from "./server";
import { itemSchema, countSchema, adjustmentSchema } from "./domain";
import type { ActionResult } from "./types";
const string = (form: FormData, key: string) => String(form.get(key) ?? "");
const numeric = (form: FormData, key: string) => {
  const s = string(form, key).trim();
  return s === "" ? NaN : Number(s);
};
const invalid = (error: z.ZodError): ActionResult => ({
  error: "Periksa kembali data yang diisi.",
  fields: z.flattenError(error).fieldErrors as Record<string, string[]>,
});
function failure(error: { code?: string; message: string }): ActionResult {
  console.error("Inventory action failed:", error.code, error.message);
  return {
    error:
      error.code === "40001"
        ? "Stok telah berubah. Muat ulang halaman lalu periksa jumlah terbaru."
        : "Data gagal disimpan. Periksa jumlah, status item, dan hak akses, lalu coba kembali.",
  };
}
function refresh() {
  revalidatePath("/", "layout");
}
export async function login(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  if (!configured())
    return {
      error: "Koneksi Supabase belum dikonfigurasi. Lihat petunjuk setup.",
    };
  const email = string(form, "email").trim();
  const password = string(form, "password");
  if (!z.email().safeParse(email).success || !password)
    return { error: "Isi email dan kata sandi yang valid." };
  const client = await db();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error)
    return {
      error: "Login gagal. Periksa kredensial atau coba kembali nanti.",
    };
  redirect("/dashboard");
}
export async function logout() {
  const client = await db();
  await client.auth.signOut();
  redirect("/login");
}
export async function saveItem(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { client } = await session(true);
  const id = string(form, "id");
  if (id && !z.uuid().safeParse(id).success)
    return { error: "Item tidak valid." };
  const parsed = itemSchema.safeParse({
    name: string(form, "name"),
    category_id: string(form, "category_id"),
    unit: string(form, "unit"),
    minimum_stock: numeric(form, "minimum_stock"),
    initial_stock: id ? 0 : numeric(form, "initial_stock"),
    notes: string(form, "notes"),
    active: form.get("active") === "on",
  });
  if (!parsed.success) return invalid(parsed.error);
  const { data, error } = await client.rpc("save_item", {
    ...(id ? { p_id: id } : {}),
    p_data: parsed.data,
  });
  if (error) return failure(error);
  refresh();
  redirect(`/inventory/${data}?saved=1`);
}
export async function saveCategory(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { client } = await session(true);
  const parsed = z
    .object({
      id: z.union([z.literal(""), z.uuid()]),
      name: z.string().trim().min(1, "Nama wajib diisi.").max(80),
    })
    .safeParse({ id: string(form, "id"), name: string(form, "name") });
  if (!parsed.success) return invalid(parsed.error);
  const { error } = await client.rpc("save_category", {
    ...(parsed.data.id ? { p_id: parsed.data.id } : {}),
    p_name: parsed.data.name,
    p_active: form.get("active") === "on",
  });
  if (error) return failure(error);
  refresh();
  return { success: "Kategori berhasil disimpan." };
}
export async function submitCount(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { client } = await session();
  let entries: unknown;
  try {
    entries = JSON.parse(string(form, "entries"));
  } catch {
    return { error: "Data item tidak valid." };
  }
  const parsed = countSchema.safeParse({
    entries,
    shift_date: string(form, "shift_date"),
    shift_label: string(form, "shift_label"),
    notes: string(form, "notes"),
  });
  if (!parsed.success) return invalid(parsed.error);
  const { error } = await client.rpc("record_stock", {
    p_entries: parsed.data.entries,
    p_type: "stock_count",
    p_shift_date: parsed.data.shift_date,
    p_shift_label: parsed.data.shift_label,
    p_notes: parsed.data.notes,
  });
  if (error) return failure(error);
  refresh();
  redirect("/stock-history?saved=count&mine=1");
}
export async function submitAdjustment(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { client } = await session();
  const parsed = adjustmentSchema.safeParse({
    item_id: string(form, "item_id"),
    type: string(form, "type"),
    quantity: numeric(form, "quantity"),
    expected: numeric(form, "expected"),
    reason: string(form, "reason"),
    notes: string(form, "notes"),
  });
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;
  const { error } = await client.rpc("record_stock", {
    p_entries: [{ id: d.item_id, quantity: d.quantity, expected: d.expected }],
    p_type: d.type,
    p_reason: d.reason,
    p_notes: d.notes,
  });
  if (error) return failure(error);
  refresh();
  redirect("/stock-history?saved=adjustment&mine=1");
}
