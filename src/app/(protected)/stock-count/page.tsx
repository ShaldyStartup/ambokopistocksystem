import { items } from "@/lib/queries";
import { PageTitle, Empty } from "@/components/ui";
import { CountForm } from "@/components/forms";
export default async function StockCount() {
  const active = (await items()).filter((i) => i.active);
  return (
    <>
      <PageTitle
        title="Catat stok fisik"
        description="Hitung persediaan, isi jumlah aktual, lalu periksa sebelum menyimpan."
      />
      <div className="notice small">
        Cukup isi item yang sudah dihitung. Angka 0 berarti stok habis; kolom
        kosong tidak mengubah stok.
      </div>
      {active.length ? (
        <CountForm items={active} />
      ) : (
        <Empty text="Belum ada item aktif. Minta pengelola menambahkan item persediaan." />
      )}
    </>
  );
}
