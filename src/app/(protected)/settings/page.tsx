import { session } from "@/lib/server";
import { categories } from "@/lib/queries";
import { PageTitle } from "@/components/ui";
import { CategoryForm } from "@/components/forms";
export default async function Settings() {
  await session(true);
  const cats = await categories();
  return (
    <>
      <PageTitle
        title="Kategori persediaan"
        description="Kelola pengelompokan item. Kategori yang dinonaktifkan tetap tersedia pada item dan riwayat lama."
      />
      <div className="count-grid">
        <CategoryForm />
        {cats.map((c) => (
          <CategoryForm key={c.id} category={c} />
        ))}
      </div>
    </>
  );
}
