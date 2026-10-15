import Link from "next/link";
import { ArrowUpRight, PackageOpen } from "lucide-react";
import { dateTime, lowStock, number, recordLabels } from "@/lib/domain";
import type { Item, StockRecord } from "@/lib/types";
import { param, type Params } from "@/lib/queries";
export function PageTitle({
  eyebrow = "AMBO COFFEE / PERSEDIAAN",
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {action}
    </header>
  );
}
export function Empty({
  text = "Belum ada data untuk ditampilkan.",
  action,
}: {
  text?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty panel">
      <PackageOpen size={36} />
      <h3>Belum ada data</h3>
      <p className="muted">{text}</p>
      {action}
    </div>
  );
}
export function Badge({
  item,
}: {
  item: Pick<Item, "active" | "current_stock" | "minimum_stock">;
}) {
  const status = !item.active
    ? "inactive"
    : lowStock(item.current_stock, item.minimum_stock)
      ? "low"
      : "normal";
  return (
    <span className={`badge ${status}`}>
      <span aria-hidden>●</span>{" "}
      {status === "inactive"
        ? "Tidak aktif"
        : status === "low"
          ? "Stok menipis"
          : "Normal"}
    </span>
  );
}
export function InventoryTable({ items }: { items: Item[] }) {
  if (!items.length)
    return (
      <Empty text="Tidak ada item sesuai filter. Pengelola dapat menambahkan item untuk mulai mencatat persediaan." />
    );
  return (
    <div className="table-wrap panel">
      <table>
        <thead>
          <tr>
            <th>Nama item</th>
            <th>Kategori</th>
            <th>Stok saat ini</th>
            <th>Minimum</th>
            <th>Status</th>
            <th>Terakhir diperbarui</th>
            <th>
              <span className="sr-only">Detail</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td data-label="Item">
                <Link className="item-link" href={`/inventory/${i.id}`}>
                  {i.name}
                </Link>
                <small className="muted">{i.unit}</small>
              </td>
              <td data-label="Kategori">{i.category?.name ?? "—"}</td>
              <td data-label="Stok saat ini">
                <strong>{number(i.current_stock)}</strong>{" "}
                <span className="muted">{i.unit}</span>
              </td>
              <td data-label="Minimum">
                {number(i.minimum_stock)} {i.unit}
              </td>
              <td data-label="Status">
                <Badge item={i} />
              </td>
              <td data-label="Diperbarui" className="small muted">
                {dateTime(i.updated_at)}
              </td>
              <td>
                <Link
                  className="icon-link"
                  href={`/inventory/${i.id}`}
                  aria-label={`Detail ${i.name}`}
                >
                  <ArrowUpRight size={18} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function HistoryTable({ records }: { records: StockRecord[] }) {
  if (!records.length)
    return (
      <Empty text="Belum ada riwayat untuk pilihan ini. Pencatatan stok yang berhasil akan tampil di sini." />
    );
  return (
    <div className="table-wrap panel">
      <table>
        <thead>
          <tr>
            <th>Waktu & item</th>
            <th>Jenis</th>
            <th>Sebelum → sesudah</th>
            <th>Selisih</th>
            <th>Dicatat oleh</th>
            <th>Catatan</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id}>
              <td data-label="Item">
                <Link
                  className="item-link"
                  href={`/inventory/${r.inventory_item_id}`}
                >
                  {r.item_name}
                </Link>
                <small className="muted">{dateTime(r.created_at)}</small>
              </td>
              <td data-label="Jenis">
                <span className="type-label">
                  {recordLabels[r.record_type]}
                </span>
                {r.shift_label && (
                  <small className="muted">
                    {r.shift_date} · {r.shift_label}
                  </small>
                )}
              </td>
              <td data-label="Jumlah">
                {number(r.previous_quantity)} →{" "}
                <strong>{number(r.new_quantity)}</strong> {r.unit}
              </td>
              <td
                data-label="Selisih"
                className={r.quantity_change < 0 ? "negative" : "positive"}
              >
                {r.quantity_change > 0 ? "+" : ""}
                {number(r.quantity_change)} {r.unit}
              </td>
              <td data-label="Pengguna">{r.recorder_name}</td>
              <td data-label="Catatan" className="small note-cell">
                {[r.reason, r.notes].filter(Boolean).join(" · ") || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function InventoryFilters({
  p,
  categories,
  report = false,
}: {
  p: Params;
  categories: { id: string; name: string }[];
  report?: boolean;
}) {
  return (
    <form className="filters panel">
      <label>
        Cari item
        <input name="q" placeholder="Nama item…" defaultValue={param(p, "q")} />
      </label>
      <label>
        Kategori
        <select
          name={report ? "inventory_category" : "category"}
          defaultValue={param(p, "category")}
        >
          <option value="">Semua kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Status
        <select
          name={report ? "inventory_status" : "status"}
          defaultValue={param(p, "status")}
        >
          <option value="">Semua item aktif</option>
          <option value="normal">Normal</option>
          <option value="low">Stok menipis</option>
          <option value="inactive">Tidak aktif</option>
        </select>
      </label>
      <label>
        Urutkan
        <select name="sort" defaultValue={param(p, "sort")}>
          <option value="">Nama item</option>
          <option value="quantity">Stok terendah</option>
          <option value="updated">Pembaruan terbaru</option>
        </select>
      </label>
      <button className="btn secondary">Terapkan</button>
      <Link className="small text-link" href="?">
        Reset
      </Link>
    </form>
  );
}
export function HistoryFilters({
  p,
  items,
  users = [],
  report = false,
}: {
  p: Params;
  items: Item[];
  users?: { id: string; name: string }[];
  report?: boolean;
}) {
  return (
    <form className="filters panel">
      <label>
        Dari tanggal
        <input type="date" name="from" defaultValue={param(p, "from")} />
      </label>
      <label>
        Sampai tanggal
        <input type="date" name="to" defaultValue={param(p, "to")} />
      </label>
      <label>
        Item
        <select name="item" defaultValue={param(p, "item")}>
          <option value="">Semua item</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Jenis
        <select name="type" defaultValue={param(p, "type")}>
          <option value="">Semua jenis</option>
          {Object.entries(recordLabels).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label>
        Status saat pencatatan
        <select name="status" defaultValue={param(p, "status")}>
          <option value="">Semua status</option>
          <option value="low">Stok menipis</option>
          <option value="normal">Normal</option>
        </select>
      </label>
      {report && (
        <label>
          Kategori saat pencatatan
          <input
            name="category"
            defaultValue={param(p, "category")}
            placeholder="Nama kategori"
          />
        </label>
      )}
      {users.length > 0 && (
        <label>
          Pengguna
          <select name="user" defaultValue={param(p, "user")}>
            <option value="">Semua pengguna</option>
            {users.map((u) => (
              <option value={u.id} key={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="check">
        <input
          type="checkbox"
          name="mine"
          value="1"
          defaultChecked={param(p, "mine") === "1"}
        />{" "}
        Catatan saya
      </label>
      <button className="btn secondary">Terapkan</button>
      <Link href="?" className="text-link small">
        Reset
      </Link>
    </form>
  );
}
export function Pagination({
  count,
  page,
  size,
  p,
}: {
  count: number;
  page: number;
  size: number;
  p: Params;
}) {
  const pages = Math.max(1, Math.ceil(count / size));
  const href = (n: number) => {
    const q = new URLSearchParams();
    Object.entries(p).forEach(([k, v]) => {
      if (typeof v === "string" && k !== "saved") q.set(k, v);
    });
    q.set("page", String(n));
    return `?${q}`;
  };
  return (
    <div className="pagination">
      <span className="muted small">
        {count} catatan · Halaman {page} / {pages}
      </span>
      <div className="actions">
        {page > 1 && (
          <Link className="btn secondary" href={href(page - 1)}>
            Sebelumnya
          </Link>
        )}
        {page < pages && (
          <Link className="btn secondary" href={href(page + 1)}>
            Berikutnya
          </Link>
        )}
      </div>
    </div>
  );
}
