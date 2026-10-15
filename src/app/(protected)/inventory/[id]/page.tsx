import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { check, session } from "@/lib/server";
import { history, type Params } from "@/lib/queries";
import { canManage, dateTime, number } from "@/lib/domain";
import type { Item } from "@/lib/types";
import { Badge, PageTitle, HistoryTable } from "@/components/ui";
export default async function Detail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Params>;
}) {
  const { client, profile } = await session();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { data, error } = await client
    .from("inventory_items")
    .select("*,category:inventory_categories(name)")
    .eq("id", id)
    .maybeSingle();
  check(error);
  if (!data) notFound();
  const item = data as Item;
  const recent = await history({ item: id }, 10);
  const p = await searchParams;
  return (
    <>
      <PageTitle
        title={item.name}
        description={`${item.category?.name ?? "Lainnya"} · Satuan ${item.unit}`}
        action={
          canManage(profile.role) && (
            <Link href={`/inventory/${id}/edit`} className="btn secondary">
              Edit item
            </Link>
          )
        }
      />
      {p.saved && (
        <p className="notice success" role="status">
          Item berhasil disimpan.
        </p>
      )}
      <section className="panel detail-summary">
        <div>
          <span className="eyebrow">STOK SAAT INI</span>
          <p className="big-quantity">
            {number(item.current_stock)} <small>{item.unit}</small>
          </p>
          <Badge item={item} />
        </div>
        <dl>
          <dt>Stok minimum</dt>
          <dd>
            {number(item.minimum_stock)} {item.unit}
          </dd>
          <dt>Terakhir diperbarui</dt>
          <dd>{dateTime(item.updated_at)}</dd>
          <dt>Catatan</dt>
          <dd>{item.notes || "Tidak ada catatan."}</dd>
        </dl>
      </section>
      {item.active && (
        <div className="actions">
          <Link href="/stock-count" className="btn">
            Catat stok fisik
          </Link>
          <Link href="/stock-adjustment" className="btn secondary">
            Penyesuaian stok
          </Link>
        </div>
      )}
      <div className="section-title">
        <h2>Riwayat item terbaru</h2>
        <Link href={`/stock-history?item=${id}`} className="text-link">
          Semua riwayat →
        </Link>
      </div>
      <HistoryTable records={recent.records} />
    </>
  );
}
