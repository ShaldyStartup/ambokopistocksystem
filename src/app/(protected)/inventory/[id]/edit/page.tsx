import { notFound } from "next/navigation";
import { z } from "zod";
import { check, session } from "@/lib/server";
import { categories } from "@/lib/queries";
import type { Item } from "@/lib/types";
import { PageTitle } from "@/components/ui";
import { ItemForm } from "@/components/forms";
export default async function Edit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { client } = await session(true);
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { data, error } = await client
    .from("inventory_items")
    .select("*,category:inventory_categories(name)")
    .eq("id", id)
    .maybeSingle();
  check(error);
  if (!data) notFound();
  return (
    <>
      <PageTitle
        title="Edit item"
        description="Perbarui informasi, ambang minimum, atau status aktif item."
      />
      <ItemForm item={data as Item} categories={await categories()} />
    </>
  );
}
