import { test, expect } from "@playwright/test";
test("unauthenticated routes require login", async ({ page }) => {
  for (const route of [
    "/dashboard",
    "/inventory",
    "/inventory/new",
    "/stock-count",
    "/stock-adjustment",
    "/stock-history",
    "/alerts",
    "/reports",
    "/settings",
  ]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login/);
  }
  await expect(
    page.getByRole("heading", { name: "Masuk ke Ambo Coffee" }),
  ).toBeVisible();
});

test("mobile login stays within the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Masuk ke Ambo Coffee" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("staff: login, count, history, inventory and low-stock alert", async ({
  page,
}) => {
  test.skip(
    !process.env.E2E_STAFF_PASSWORD,
    "Requires a disposable Supabase project with demo seed.",
  );
  await page.goto("/login");
  await page
    .getByLabel("Email", { exact: true })
    .fill(process.env.E2E_STAFF_EMAIL ?? "staff@example.com");
  await page
    .getByLabel("Kata sandi", { exact: true })
    .fill(process.env.E2E_STAFF_PASSWORD!);
  await page.getByRole("button", { name: "Masuk ke persediaan" }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.goto("/inventory/new");
  await expect(page).toHaveURL(/dashboard\?denied=1/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/stock-count");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const shift = "DEMO E2E " + Date.now();
  await page.getByLabel("Nama shift").fill(shift);
  const card = page.locator("section.count-card").filter({
    has: page.getByRole("heading", { name: "DEMO Susu", exact: true }),
  });
  await card.getByLabel("Jumlah fisik").fill("1");
  await page.screenshot({
    path: "test-results/stock-count-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Periksa pencatatan" }).click();
  await expect(
    page.getByRole("heading", { name: "Periksa 1 item sebelum menyimpan" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Konfirmasi & simpan" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Data stok berhasil disimpan",
  );
  await expect(page.getByText(shift)).toBeVisible();
  await page.goto("/inventory?q=DEMO+Susu");
  await expect(
    page.getByRole("link", { name: "DEMO Susu", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".badge.low")).toBeVisible();
  await expect(
    page
      .locator("tbody tr")
      .filter({
        has: page.getByRole("link", { name: "DEMO Susu", exact: true }),
      })
      .locator("td")
      .nth(2),
  ).toContainText("1");
  await page.goto("/alerts");
  await expect(
    page.getByRole("link", { name: "DEMO Susu", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keluar", exact: true }).click();
  await expect(page).toHaveURL(/login/);
});

test("owner: manage inventory, configure minimum, inspect reports and deactivate", async ({
  page,
}) => {
  test.skip(
    !process.env.E2E_OWNER_PASSWORD,
    "Requires owner account on a development Supabase project.",
  );
  await page.goto("/login");
  await page
    .getByLabel("Email", { exact: true })
    .fill(process.env.E2E_OWNER_EMAIL ?? "owner@example.com");
  await page
    .getByLabel("Kata sandi", { exact: true })
    .fill(process.env.E2E_OWNER_PASSWORD!);
  await page.getByRole("button", { name: "Masuk ke persediaan" }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.goto("/inventory/new");
  const name = "DEMO E2E Item " + Date.now();
  await page.getByLabel("Nama item", { exact: true }).fill(name);
  await page
    .getByLabel("Kategori", { exact: true })
    .selectOption({ label: "DEMO E2E Pengujian" });
  await page.getByLabel("Satuan", { exact: true }).fill("pcs");
  await page.getByLabel("Stok minimum", { exact: true }).fill("1");
  await page.getByLabel("Stok awal", { exact: true }).fill("2");
  await page
    .getByLabel("Catatan (opsional)", { exact: true })
    .fill("DATA DEMO — pengujian otomatis, bukan persediaan riil.");
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Item berhasil disimpan",
  );
  const id = new URL(page.url()).pathname.split("/").at(-1)!;
  await expect(page.locator(".badge.normal")).toBeVisible();
  await page.getByRole("link", { name: "Edit item", exact: true }).click();
  await page.getByLabel("Stok minimum", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(page.locator(".badge.low")).toBeVisible();
  await page.goto("/alerts");
  await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  await page.goto("/stock-history?item=" + id);
  await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  await expect(
    page.locator("table").getByText("Stok awal", { exact: true }),
  ).toBeVisible();
  await page.goto("/reports?q=" + encodeURIComponent(name));
  await expect(
    page.getByRole("heading", { name: "Laporan persediaan", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator("table").first().getByRole("link", { name, exact: true }),
  ).toBeVisible();
  await page.goto("/inventory/" + id + "/edit");
  await page.getByLabel("Item aktif", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(page.locator(".badge.inactive")).toBeVisible();
  await page.goto("/stock-history?item=" + id);
  await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Keluar", exact: true }).click();
  await expect(page).toHaveURL(/login/);
});

test("staff: adjustment addition, reduction, correction and negative-stock prevention", async ({
  page,
}) => {
  test.skip(
    !process.env.E2E_STAFF_PASSWORD,
    "Requires seeded development accounts.",
  );
  await page.goto("/login");
  await page
    .getByLabel("Email", { exact: true })
    .fill(process.env.E2E_STAFF_EMAIL!);
  await page
    .getByLabel("Kata sandi", { exact: true })
    .fill(process.env.E2E_STAFF_PASSWORD!);
  await page.getByRole("button", { name: "Masuk ke persediaan" }).click();
  await expect(page).toHaveURL(/dashboard/);
  const reference = "DEMO E2E " + Date.now();
  for (const [type, quantity] of [
    ["addition", "2"],
    ["reduction", "3"],
    ["correction", "4"],
  ]) {
    await page.goto("/stock-adjustment");
    const item = await page
      .getByRole("option", { name: /^DEMO Biji kopi/ })
      .getAttribute("value");
    await page
      .getByLabel("Item persediaan", { exact: true })
      .selectOption(item!);
    await page
      .getByLabel("Jenis penyesuaian", { exact: true })
      .selectOption(type);
    const amount = page.getByLabel(
      type === "correction" ? "Jumlah akhir yang benar" : "Jumlah penyesuaian",
      { exact: true },
    );
    if (type === "reduction") {
      await amount.fill("999999");
      await expect(
        page.getByRole("button", { name: "Simpan penyesuaian" }),
      ).toBeDisabled();
    }
    await amount.fill(quantity);
    await page
      .getByLabel("Alasan", { exact: true })
      .fill(reference + " penyesuaian " + type);
    await page.getByRole("button", { name: "Simpan penyesuaian" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Data stok berhasil disimpan",
    );
    await expect(
      page
        .locator("table")
        .getByText(reference + " penyesuaian " + type, { exact: true }),
    ).toBeVisible();
  }
  await page.goto("/alerts");
  await expect(
    page.getByRole("link", { name: "DEMO Biji kopi", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keluar", exact: true }).click();
  await expect(page).toHaveURL(/login/);
});
