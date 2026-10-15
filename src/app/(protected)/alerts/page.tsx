import Link from "next/link";
import { items } from "@/lib/queries";
import { InventoryTable, PageTitle } from "@/components/ui";
export default async function Alerts() {
  const low = (await items())
    .filter((i) => i.active && i.current_stock <= i.minimum_stock)
    .sort(
      (a, b) =>
        (a.minimum_stock ? a.current_stock / a.minimum_stock : 0) -
        (b.minimum_stock ? b.current_stock / b.minimum_stock : 0),
    );
  return (
    <>
      <PageTitle
        title="Peringatan stok"
        description="Periksa item yang mencapai atau berada di bawah batas minimum."
        action={
          <Link href="/stock-count" className="btn">
            Catat stok
          </Link>
        }
      />
      <div className="notice">
        {low.length} item memerlukan perhatian. Stok menipis ketika jumlah saat
        ini ≤ stok minimum.
      </div>
      <InventoryTable items={low} />
    </>
  );
}
