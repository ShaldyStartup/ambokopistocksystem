import { z } from "zod";
import type { Role, RecordType } from "./types";
export const canManage = (role: Role) => role === "owner" || role === "manager";
export const lowStock = (current: number, minimum: number) =>
  current <= minimum;
export const quantity = z
  .number({ error: "Isi angka yang valid." })
  .finite("Isi angka yang valid.")
  .min(0, "Jumlah stok tidak boleh negatif.")
  .max(999999999, "Jumlah terlalu besar.")
  .refine(
    (n) => Math.abs(n * 1000 - Math.round(n * 1000)) < 0.0001,
    "Maksimal 3 angka desimal.",
  );
export const itemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama wajib diisi.")
    .max(120, "Maksimal 120 karakter."),
  category_id: z.uuid("Pilih kategori."),
  unit: z
    .string()
    .trim()
    .min(1, "Satuan wajib diisi.")
    .max(30, "Maksimal 30 karakter."),
  initial_stock: quantity,
  minimum_stock: quantity,
  notes: z.string().trim().max(1000, "Maksimal 1000 karakter."),
  active: z.boolean(),
});
export const countSchema = z
  .object({
    shift_date: z.iso.date("Tanggal wajib diisi."),
    shift_label: z
      .string()
      .trim()
      .min(1, "Shift wajib diisi.")
      .max(80, "Maksimal 80 karakter."),
    notes: z.string().trim().max(1000, "Maksimal 1000 karakter."),
    entries: z
      .array(
        z.object({
          id: z.uuid("Item tidak valid."),
          quantity,
          expected: quantity,
          notes: z.string().trim().max(500, "Maksimal 500 karakter."),
        }),
      )
      .min(1, "Isi setidaknya satu item.")
      .max(500, "Maksimal 500 item per pencatatan."),
  })
  .refine(
    (v) => new Set(v.entries.map((e) => e.id)).size === v.entries.length,
    "Item tidak boleh duplikat.",
  );
export const adjustmentSchema = z.object({
  item_id: z.uuid("Pilih item."),
  type: z.enum(["addition", "reduction", "correction"]),
  quantity: quantity.refine((n) => n > 0, "Jumlah harus lebih dari 0."),
  expected: quantity,
  reason: z
    .string()
    .trim()
    .min(1, "Alasan wajib diisi.")
    .max(200, "Maksimal 200 karakter."),
  notes: z.string().trim().max(1000, "Maksimal 1000 karakter."),
});
export function stockResult(current: number, value: number, type: RecordType) {
  quantity.parse(current);
  quantity.parse(value);
  if (["addition", "reduction", "correction"].includes(type) && value <= 0)
    throw new Error("Jumlah harus lebih dari 0.");
  const next =
    Math.round(
      (type === "addition"
        ? current + value
        : type === "reduction"
          ? current - value
          : value) * 1000,
    ) / 1000;
  quantity.parse(next);
  return {
    previous: current,
    next,
    difference: Math.round((next - current) * 1000) / 1000,
  };
}
export function requireManage(role: Role) {
  if (!canManage(role)) throw new Error("Akses ditolak.");
}
export const recordLabels: Record<RecordType, string> = {
  initial: "Stok awal",
  stock_count: "Hitung fisik",
  addition: "Penambahan",
  reduction: "Pengurangan",
  correction: "Koreksi",
};
export const number = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(n);
export const dateTime = (s: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(s));
export const todayJakarta = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
