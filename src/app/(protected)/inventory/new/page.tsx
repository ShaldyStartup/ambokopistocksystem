import { session } from "@/lib/server";
import { categories } from "@/lib/queries";
import { PageTitle } from "@/components/ui";
import { ItemForm } from "@/components/forms";
export default async function NewItem() {
  await session(true);
  return (
    <>
      <PageTitle
        title="Tambah item"
        description="Daftarkan item dan tentukan stok minimum sesuai kebutuhan kedai."
      />
      <ItemForm categories={await categories()} />
    </>
  );
}
