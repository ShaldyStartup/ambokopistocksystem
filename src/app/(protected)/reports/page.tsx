import { session } from "@/lib/server";
import {
  items,
  categories,
  history,
  filteredItems,
  type Params,
} from "@/lib/queries";
import {
  PageTitle,
  InventoryFilters,
  InventoryTable,
  HistoryFilters,
  HistoryTable,
  Pagination,
} from "@/components/ui";
import { PrintButton } from "@/components/print-button";
export default async function Reports({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await session(true);
  const p = await searchParams;
  const [all, cats, movements] = await Promise.all([
    items(),
    categories(),
    history(p, 50),
  ]);
  const inventory = filteredItems(all, {
    q: p.q,
    category: p.inventory_category,
    status: p.inventory_status,
    sort: p.sort,
  });
  return (
    <>
      <PageTitle
        title="Laporan persediaan"
        description="Tinjau posisi stok saat ini dan pergerakan stok berdasarkan periode. Waktu dalam WIB."
        action={<PrintButton />}
      />
      <div className="section-title">
        <div>
          <h2>Status persediaan saat ini</h2>
          <p className="muted small">
            Filter status berikut berlaku pada kondisi terkini.
          </p>
        </div>
      </div>
      <InventoryReportFilters p={p} categories={cats} />
      <InventoryTable items={inventory} />
      <div className="section-title">
        <div>
          <h2>Pergerakan stok</h2>
          <p className="muted small">
            Filter kategori dan status menggunakan nilai saat pencatatan. Hasil
            dicetak per halaman.
          </p>
        </div>
      </div>
      <HistoryFilters p={p} items={all} report />
      <HistoryTable records={movements.records} />
      <Pagination {...movements} p={p} />
    </>
  );
}
function InventoryReportFilters({
  p,
  categories: cats,
}: {
  p: Params;
  categories: { id: string; name: string }[];
}) {
  return (
    <div className="report-inventory-filters">
      <InventoryFilters
        p={{ ...p, category: p.inventory_category, status: p.inventory_status }}
        categories={cats}
        report
      />
    </div>
  );
}
