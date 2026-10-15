import { describe, it, expect } from "vitest";
import {
  lowStock,
  stockResult,
  requireManage,
  quantity,
  countSchema,
  adjustmentSchema,
  itemSchema,
} from "../src/lib/domain";
const id = "11111111-1111-4111-8111-111111111111";
describe("status stok", () => {
  it.each([
    [10, 5, false],
    [5, 5, true],
    [3, 5, true],
    [0, 0, true],
    [1, 0, false],
  ])("%s dengan minimum %s", (current, minimum, result) =>
    expect(lowStock(current, minimum)).toBe(result),
  );
});
describe("perhitungan stok", () => {
  it("hitung fisik mengganti jumlah dan mempertahankan sebelumnya", () =>
    expect(stockResult(10, 7, "stock_count")).toEqual({
      previous: 10,
      next: 7,
      difference: -3,
    }));
  it("hitung fisik boleh nol dan tanpa selisih", () => {
    expect(stockResult(5, 0, "stock_count").next).toBe(0);
    expect(stockResult(5, 5, "stock_count").difference).toBe(0);
  });
  it("penambahan", () => expect(stockResult(10, 3, "addition").next).toBe(13));
  it("pengurangan", () => expect(stockResult(10, 3, "reduction").next).toBe(7));
  it("koreksi menggunakan jumlah akhir", () =>
    expect(stockResult(10, 3, "correction").next).toBe(3));
  it("desimal tetap akurat", () =>
    expect(stockResult(0.3, 0.1, "reduction")).toEqual({
      previous: 0.3,
      next: 0.2,
      difference: -0.1,
    }));
  it("menolak stok negatif", () =>
    expect(() => stockResult(1, 2, "reduction")).toThrow());
  it.each([-1, NaN, Infinity, 0.0001, 1000000000])("menolak jumlah %s", (n) =>
    expect(quantity.safeParse(n).success).toBe(false),
  );
  it("penyesuaian harus positif", () =>
    expect(() => stockResult(5, 0, "addition")).toThrow());
});
describe("otorisasi pengaturan item dan minimum", () => {
  it("staf ditolak", () =>
    expect(() => requireManage("staff")).toThrow("Akses ditolak."));
  it.each(["owner", "manager"] as const)("%s diizinkan", (role) =>
    expect(() => requireManage(role)).not.toThrow(),
  );
});
describe("validasi formulir", () => {
  const count = {
    shift_date: "2026-10-15",
    shift_label: "Penutupan",
    notes: "",
    entries: [{ id, quantity: 0, expected: 10, notes: "" }],
  };
  it("menerima penghitungan parsial dan nol", () =>
    expect(countSchema.safeParse(count).success).toBe(true));
  it("menolak item duplikat", () =>
    expect(
      countSchema.safeParse({
        ...count,
        entries: [...count.entries, ...count.entries],
      }).success,
    ).toBe(false));
  it("mewajibkan shift", () =>
    expect(countSchema.safeParse({ ...count, shift_label: "" }).success).toBe(
      false,
    ));
  it("mewajibkan tanggal nyata", () =>
    expect(
      countSchema.safeParse({ ...count, shift_date: "2026-02-31" }).success,
    ).toBe(false));
  it("menolak penghitungan kosong", () =>
    expect(countSchema.safeParse({ ...count, entries: [] }).success).toBe(
      false,
    ));
  it("mewajibkan alasan", () =>
    expect(
      adjustmentSchema.safeParse({
        item_id: id,
        type: "addition",
        quantity: 1,
        expected: 10,
        reason: "",
        notes: "",
      }).success,
    ).toBe(false));
  it("menolak minimum negatif", () =>
    expect(
      itemSchema.safeParse({
        name: "Sampel",
        category_id: id,
        unit: "pcs",
        initial_stock: 0,
        minimum_stock: -1,
        notes: "",
        active: true,
      }).success,
    ).toBe(false));
});
