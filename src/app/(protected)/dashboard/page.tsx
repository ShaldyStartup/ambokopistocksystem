import Link from "next/link";
import {
  Package,
  TriangleAlert,
  ClipboardCheck,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { items, history, type Params } from "@/lib/queries";
import { check, session } from "@/lib/server";
import { canManage, dateTime, number, todayJakarta } from "@/lib/domain";
import { PageTitle, InventoryTable, HistoryTable } from "@/components/ui";
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const { client, profile } = await session();
  const p = await searchParams;
  const [all, recent, today, latest] = await Promise.all([
    items(),
    history({}, 6),
    client
      .from("stock_records")
      .select("id", { count: "exact", head: true })
      .gte("created_at", `${todayJakarta()}T00:00:00+07:00`),
    client
      .from("stock_records")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);
  check(today.error);
  check(latest.error);
  const active = all.filter((i) => i.active),
    low = active
      .filter((i) => i.current_stock <= i.minimum_stock)
      .sort(
        (a, b) =>
          (a.minimum_stock ? a.current_stock / a.minimum_stock : 0) -
          (b.minimum_stock ? b.current_stock / b.minimum_stock : 0),
      );
  return (
    <>
      <PageTitle
        title="Ringkasan persediaan"
        description={`Selamat datang, ${profile.name}. Berikut kondisi persediaan kedai Anda.`}
        action={
          <Link className="btn" href="/stock-count">
            <Plus size={18} /> Catat stok
          </Link>
        }
      />
      {p.denied && (
        <p role="alert" className="notice error">
          Akses halaman tersebut hanya untuk pemilik atau pengelola.
        </p>
      )}
      <div className="stats">
        <div className="stat panel">
          <span>
            Total item aktif <Package size={20} />
          </span>
          <strong>{active.length}</strong>
          <small className="muted">Item dalam persediaan</small>
        </div>
        <Link href="/alerts" className="stat panel warning-stat">
          <span>
            Stok menipis <TriangleAlert size={20} />
          </span>
          <strong>
            {low.length}
            <small> item</small>
          </strong>
          <small>
            Perlu diperiksa kembali <ArrowUpRight size={14} />
          </small>
        </Link>
        <div className="stat panel">
          <span>
            Pencatatan hari ini <ClipboardCheck size={20} />
          </span>
          <strong>{today.count ?? 0}</strong>
          <small className="muted">Perubahan stok · WIB</small>
        </div>
      </div>
      <div className="section-title">
        <div>
          <h2>Perlu perhatian</h2>
          <p className="muted small">
            Stok yang mencapai atau di bawah batas minimum.
          </p>
        </div>
        <Link href="/alerts" className="text-link">
          Lihat semua →
        </Link>
      </div>
      <InventoryTable items={low.slice(0, 5)} />
      <div className="dashboard-bottom">
        <section className="panel">
          <span className="eyebrow">STATUS PERSEDIAAN</span>
          <h2>
            {active.length
              ? `${number(active.length - low.length)} dari ${active.length} item normal`
              : "Belum ada persediaan"}
          </h2>
          <div
            className="status-bar"
            role="img"
            aria-label={`${active.length - low.length} item normal, ${low.length} stok menipis`}
          >
            <span
              style={{
                width: `${active.length ? ((active.length - low.length) / active.length) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="legend">
            <span>● Normal {active.length - low.length}</span>
            <span>● Stok menipis {low.length}</span>
          </div>
        </section>
        <section className="panel">
          <span className="eyebrow">PEMBARUAN TERAKHIR</span>
          <h2 className="last-update">
            {latest.data?.[0]
              ? dateTime(latest.data[0].created_at)
              : "Belum ada pencatatan"}
          </h2>
          <p className="muted small">
            Jumlah stok diperbarui melalui hitung fisik dan penyesuaian manual.
          </p>
          {canManage(profile.role) && (
            <Link href="/inventory/new" className="text-link">
              Tambah item persediaan →
            </Link>
          )}
        </section>
      </div>
      <div className="section-title">
        <div>
          <h2>Aktivitas terbaru</h2>
          <p className="muted small">Riwayat pencatatan yang tersimpan.</p>
        </div>
        <Link href="/stock-history" className="text-link">
          Lihat riwayat →
        </Link>
      </div>
      <HistoryTable records={recent.records} />
      <div className="section-title">
        <h2>Persediaan terbaru diperbarui</h2>
        <Link href="/inventory?sort=updated" className="text-link">
          Lihat persediaan →
        </Link>
      </div>
      <InventoryTable
        items={[...active]
          .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
          .slice(0, 5)}
      />
    </>
  );
}
