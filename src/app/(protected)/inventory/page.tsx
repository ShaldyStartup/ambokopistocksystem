import Link from "next/link";
import { Plus } from "lucide-react";
import { items, categories, filteredItems, type Params } from "@/lib/queries";
import { session } from "@/lib/server";
import { canManage } from "@/lib/domain";
import { PageTitle, InventoryFilters, InventoryTable } from "@/components/ui";
export default async function Inventory({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const { profile } = await session();
  const p = await searchParams;
  const [all, cats] = await Promise.all([items(), categories()]);
  const filtered = filteredItems(all, p);
  return (
    <>
      <PageTitle
        title="Persediaan"
        description="Satu tempat untuk memantau seluruh stok kedai."
        action={
          canManage(profile.role) && (
            <Link className="btn" href="/inventory/new">
              <Plus size={18} /> Tambah item
            </Link>
          )
        }
      />
      <InventoryFilters p={p} categories={cats} />
      <div className="section-title">
        <h2>
          Daftar persediaan{" "}
          <span className="count-pill">{filtered.length}</span>
        </h2>
        <span className="muted small">Jumlah dalam satuan masing-masing</span>
      </div>
      <InventoryTable items={filtered} />
    </>
  );
}
