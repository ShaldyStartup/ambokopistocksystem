import "server-only";
import { session, check } from "./server";
import type { Item, Category, StockRecord } from "./types";
export type Params = Record<string, string | string[] | undefined>;
export const param = (p: Params, key: string) =>
  typeof p[key] === "string" ? (p[key] as string) : "";
export async function categories() {
  const { client } = await session();
  const { data, error } = await client
    .from("inventory_categories")
    .select("id,name,active")
    .order("name");
  check(error);
  return data as Category[];
}
export async function items() {
  const { client } = await session();
  const { data, error } = await client
    .from("inventory_items")
    .select("*,category:inventory_categories(name)")
    .order("name");
  check(error);
  return data as Item[];
}
export async function history(p: Params = {}, size = 25) {
  const { client, profile } = await session();
  const raw = Number(param(p, "page"));
  const page = Number.isInteger(raw) && raw > 0 ? Math.min(raw, 100000) : 1;
  let query = client
    .from("stock_records")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id");
  const item = param(p, "item");
  if (/^[0-9a-f-]{36}$/i.test(item))
    query = query.eq("inventory_item_id", item);
  const type = param(p, "type");
  if (
    ["initial", "stock_count", "addition", "reduction", "correction"].includes(
      type,
    )
  )
    query = query.eq("record_type", type);
  const from = param(p, "from"),
    to = param(p, "to");
  if (/^\d{4}-\d{2}-\d{2}$/.test(from) && !Number.isNaN(Date.parse(from)))
    query = query.gte("created_at", `${from}T00:00:00+07:00`);
  if (/^\d{4}-\d{2}-\d{2}$/.test(to) && !Number.isNaN(Date.parse(to)))
    query = query.lte("created_at", `${to}T23:59:59.999999+07:00`);
  if (param(p, "mine") === "1") query = query.eq("recorded_by", profile.id);
  else if (/^[0-9a-f-]{36}$/i.test(param(p, "user")))
    query = query.eq("recorded_by", param(p, "user"));
  if (param(p, "category"))
    query = query.eq("category_name", param(p, "category"));
  // Snapshot status: evaluated against the minimum at the time of the record.
  if (param(p, "status") === "low") query = query.eq("was_low_stock", true);
  if (param(p, "status") === "normal") query = query.eq("was_low_stock", false);
  const { data, error, count } = await query.range(
    (page - 1) * size,
    page * size - 1,
  );
  check(error);
  return { records: data as StockRecord[], count: count ?? 0, page, size };
}
export function filteredItems(all: Item[], p: Params) {
  const result = all.filter(
    (i) =>
      (!param(p, "q") ||
        i.name
          .toLocaleLowerCase("id")
          .includes(param(p, "q").toLocaleLowerCase("id"))) &&
      (!param(p, "category") || i.category_id === param(p, "category")) &&
      (param(p, "status") === "inactive"
        ? !i.active
        : i.active &&
          (param(p, "status") === "low"
            ? i.current_stock <= i.minimum_stock
            : param(p, "status") === "normal"
              ? i.current_stock > i.minimum_stock
              : true)),
  );
  return result.sort((a, b) =>
    param(p, "sort") === "quantity"
      ? a.current_stock - b.current_stock
      : param(p, "sort") === "updated"
        ? Date.parse(b.updated_at) - Date.parse(a.updated_at)
        : a.name.localeCompare(b.name, "id"),
  );
}
