import { items } from "@/lib/queries";
import { PageTitle, Empty } from "@/components/ui";
import { AdjustmentForm } from "@/components/forms";
export default async function Adjustment() {
  const active = (await items()).filter((i) => i.active);
  return (
    <>
      <PageTitle
        title="Penyesuaian stok"
        description="Catat penambahan, pengurangan, atau koreksi beserta alasannya."
      />
      {active.length ? (
        <AdjustmentForm items={active} />
      ) : (
        <Empty text="Belum ada item aktif untuk disesuaikan." />
      )}
    </>
  );
}
