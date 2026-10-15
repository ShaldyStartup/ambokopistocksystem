import { cache } from "react";
import type { Database } from "./database.types";
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Profile } from "./types";
import { canManage } from "./domain";
export function configured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
export async function db() {
  const jar = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll(values) {
          try {
            values.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            /* Server Component: refreshed by proxy. */
          }
        },
      },
    },
  );
}
export const session = cache(async (management = false) => {
  if (!configured()) redirect("/login");
  const client = await db();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await client
    .from("profiles")
    .select("id,name,role,active")
    .eq("id", user.id)
    .single();
  if (error || !data?.active) redirect("/login?inactive=1");
  const profile = data as Profile;
  if (management && !canManage(profile.role)) redirect("/dashboard?denied=1");
  return { client, profile };
});
export function check(error: { message: string } | null) {
  if (error) {
    console.error("Database operation failed:", error.message);
    throw new Error("Data tidak dapat dimuat. Silakan coba kembali.");
  }
}
