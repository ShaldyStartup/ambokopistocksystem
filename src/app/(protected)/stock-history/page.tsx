import { items, history, type Params } from "@/lib/queries";
import { session, check } from "@/lib/server";
import { canManage } from "@/lib/domain";
import {
  PageTitle,
  HistoryTable,
  HistoryFilters,
  Pagination,
} from "@/components/ui";
export default async function StockHistory({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const p = await searchParams;
  const { client, profile } = await session();
  const [all, result] = await Promise.all([items(), history(p)]);
  let users: { id: string; name: string }[] = [];
  if (canManage(profile.role)) {
    const r = await client.from("profiles").select("id,name").order("name");
    check(r.error);
    users = r.data ?? [];
  }
  return (
    <>
      <PageTitle
        title="Riwayat stok"
        description={
          canManage(profile.role)
            ? "Jejak setiap perubahan stok. Riwayat tidak dapat diedit atau dihapus."
            : "Riwayat 30 hari terakhir. Setiap pencatatan tersimpan sebagai jejak audit."
        }
      />
      {p.saved && (
        <p role="status" className="notice success">
          Data stok berhasil disimpan. Persediaan dan riwayat telah diperbarui.
        </p>
      )}
      <HistoryFilters p={p} items={all} users={users} />
      <HistoryTable records={result.records} />
      <Pagination {...result} p={p} />
    </>
  );
}
