# Ambo Coffee — Inventory Stock Management

Aplikasi persediaan untuk satu kedai: hitung fisik, penyesuaian manual, riwayat audit, stok minimum, dashboard, peringatan, dan laporan. Antarmuka Bahasa Indonesia. Tidak mencakup POS, penjualan, akuntansi, pembelian pemasok, atau pengurangan otomatis.

## Stack dan kebutuhan

- Node.js 24+, npm
- Next.js App Router, React, TypeScript, Tailwind CSS
- Supabase PostgreSQL dan Supabase Auth
- Vitest, PostgreSQL/PGlite untuk integrasi transaksi, Playwright untuk alur browser

Repositori tujuan: `ShaldyStartup/ambokopistocksystem`. Aplikasi mengikuti `AMBO_COFFEE_WEB_SYSTEM_SPEC_FOR_CODEX.md`.

## Menjalankan secara lokal

```powershell
npm ci
```

1. Gunakan proyek Supabase **AmboKopi** yang sudah terhubung (project ref: `fljtmusdvaykxxnqgiiv`). Jangan buat proyek kedua. Kedua migrasi dalam `supabase/migrations/` sudah diterapkan ke proyek ini. Untuk database pengujian baru, jalankan semua file SQL menurut urutan nama, atau gunakan Supabase CLI dengan proyek yang ditautkan.
2. Siapkan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` sebagai environment variables. Dapatkan nilainya dari Connect / Settings → API Keys di Supabase. Gunakan publishable key `sb_publishable_...`; jangan gunakan secret key untuk variabel publik. `.env.example` hanya berisi nama variabel kosong. Tidak ada `.env.local` atau credential yang dibuat/di-commit oleh implementasi ini.

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL="<URL proyek dari Supabase>"
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<publishable key dari Supabase>"
```

3. Di Authentication → Providers, aktifkan email/password dan matikan pendaftaran publik karena akun disiapkan oleh administrator. Terapkan kebijakan kata sandi dan pembatasan login Supabase sesuai operasional.
4. Buat pengguna di Authentication → Users. Setelah itu buat profil menggunakan UUID pengguna:

```sql
insert into public.profiles (id, name, role, active)
values ('UUID-DARI-AUTH-USERS', 'Nama Pengguna', 'owner', true);
-- Role lain: staff atau manager.
```

Tidak ada endpoint publik untuk mendaftar atau mengubah peran. Administrator dapat menonaktifkan profil dengan `active=false`. Staf aktif dapat melihat riwayat 30 hari terakhir; pemilik/pengelola dapat melihat seluruh riwayat.

```powershell
npm run dev
```

Buka http://localhost:3000. Folder XAMPP hanya dipakai sebagai lokasi proyek; aplikasi berjalan dengan Node.js, bukan PHP/Apache. Tanpa konfigurasi Supabase, halaman login memberi petunjuk setup dan tidak memakai penyimpanan palsu atau data demo tersembunyi.

Setelah login sebagai pemilik: buka **Kategori**, tambah kategori; buka **Persediaan → Tambah item**; isi satuan, stok awal, dan minimum; kemudian staf dapat mencatat hasil hitung.

## Data demo terpisah

**Hanya gunakan proyek development kosong.** Nama akun/item/kategori berawalan DEMO; kuantitas dan batas minimum sepenuhnya fiktif. Migrasi produksi tidak memasukkan seed.

Siapkan environment development: `SUPABASE_SECRET_KEY` (server-only; legacy `SUPABASE_SERVICE_ROLE_KEY` juga didukung), `DEMO_SEED_CONFIRM=DEVELOPMENT_ONLY`, `DEMO_OWNER_PASSWORD`, `DEMO_STAFF_PASSWORD` (minimal 12 karakter). Jalankan:

```powershell
npm run seed:demo
```

Akun: `owner@example.com` dan `staff@example.com`, menggunakan kata sandi yang Anda isi. Skrip menolak menimpa akun yang sudah ada dan berhenti jika pembuatan gagal. Jika terjadi kegagalan parsial, gunakan proyek development baru atau bersihkan data uji secara administratif sebelum mengulang. Secret key hanya dipakai skrip seed untuk provisioning akun/profil, tidak dipakai aplikasi web. Hapus kunci ini dari lingkungan deployment aplikasi.

## Integritas dan keamanan

- Semua halaman operasional memeriksa sesi Supabase di server; semua server action memeriksa profil aktif/peran.
- RLS membatasi pembacaan dan tidak mengizinkan mutasi tabel langsung oleh anon/staf/pengelola. Entrypoint RPC publik memakai `SECURITY INVOKER`; implementasi transaksi dengan `SECURITY DEFINER` berada dalam schema privat `inventory_private`, memakai `search_path` kosong dan pemeriksaan peran database.
- `record_stock` mengunci item dengan urutan UUID konsisten dan membandingkan stok awal yang dilihat pengguna. Jika stok berubah, simpan ditolak; muat ulang dan periksa angka terbaru.
- Satu kiriman hitung fisik bersifat atomik untuk seluruh item. Penyesuaian dan stok awal juga menulis stok serta riwayat dalam transaksi yang sama. Kegagalan insert riwayat membatalkan perubahan.
- Riwayat append-only, tidak ada tombol/API hapus. Trigger menolak UPDATE/DELETE bahkan melalui koneksi administratif biasa. Administrator database tetap merupakan pihak tepercaya yang dapat mengubah skema.
- Setiap riwayat menyimpan item, jumlah sebelum/sesudah/selisih, jenis, UUID/nama pengguna, waktu, catatan, serta snapshot nama/satuan/kategori/minimum. Data lama tidak ditulis ulang saat item diedit.
- Item dinonaktifkan, tidak dihapus. Angka tidak boleh negatif; maksimal 3 desimal dan 999.999.999 per kuantitas. Status menipis adalah `current_stock <= minimum_stock`, termasuk 0/0.
- Tidak ada kata sandi plaintext atau kunci server dalam kode. React meng-escape teks pengguna; query memakai Supabase parameter binding. Server Actions menggunakan pemeriksaan origin bawaan Next.js.
- Gunakan HTTPS dan pengaturan keamanan proyek Supabase sebelum produksi. Backup dan pengelolaan akun dilakukan melalui Supabase.

## Halaman

- `/login`: login email/password
- `/dashboard`: ringkasan, stok menipis, aktivitas terbaru
- `/inventory`: cari, kategori, status, urut nama/jumlah/waktu
- `/inventory/new`, `/inventory/[id]/edit`: hanya owner/manager
- `/inventory/[id]`: detail dan riwayat item
- `/stock-count`: hitung parsial, tanggal/shift bebas, catatan per item, pratinjau, konfirmasi
- `/stock-adjustment`: penambahan/pengurangan/koreksi beserta alasan
- `/stock-history`: filter tanggal/item/jenis/pengguna/status dan catatan sendiri; paginasi
- `/alerts`: peringatan di dalam aplikasi
- `/reports`: hanya owner/manager; status terkini dan pergerakan, filter, cetak halaman hasil
- `/settings`: pengelolaan kategori, hanya owner/manager

## Asumsi yang dipilih

1. Satu kedai, timezone operasional Asia/Jakarta (WIB); filter tanggal memakai hari WIB. Waktu audit berasal dari database, terpisah dari tanggal hitung yang dimasukkan staf.
2. Staff dapat membaca seluruh riwayat kedai 30 hari terakhir, termasuk catatan sendiri; pemilik/pengelola tanpa batas waktu. UUID pengguna tetap ada di audit meskipun nama berubah.
3. Akun/peran disiapkan di Supabase. Pengelolaan pengguna dari UI tidak dibuat karena opsional pada spesifikasi.
4. Kategori dapat dibuat, diganti nama, atau dinonaktifkan oleh pengelola. Satuan berupa teks bebas dengan saran. Tidak ada asumsi kategori/minimum/jumlah riil.
5. Koreksi mengikuti aturan penyesuaian `quantity > 0`. Untuk mengoreksi ke nol, gunakan hitung fisik atau pengurangan penuh. Penghitungan tanpa selisih tetap dicatat sebagai bukti pemeriksaan fisik.
6. Perubahan konfigurasi item mempertahankan stok saat ini dan metadata `updated_by/updated_at`. Riwayat kuantitas hanya dibuat untuk stok awal, hitung fisik, dan penyesuaian.
7. Status/kategori pada riwayat dan laporan pergerakan memakai snapshot saat pencatatan. Laporan status memakai kondisi saat ini, tidak membuat rekonstruksi saldo historis. Jumlah lintas satuan tidak dijumlahkan.
8. Laporan dicetak per halaman hasil, 50 riwayat/halaman; riwayat biasa 25/halaman. CSV tidak diimplementasikan karena opsional. Daftar item memuat seluruh master data untuk skala satu UMKM.

## Verifikasi

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Unit test mencakup hitung fisik, penambahan, pengurangan, koreksi, angka negatif, desimal, ambang menipis, peran, dan validasi. Tes integrasi menjalankan migrasi PostgreSQL nyata di PGlite (PostgreSQL WASM) dengan auth/role stub lokal: transaksi, rollback kegagalan riwayat, batch atomik, RLS, otorisasi, audit immutable, item nonaktif, dan stale-write. Tidak membutuhkan kredensial cloud.

Untuk mengulang tes database pada PostgreSQL/Supabase lokal disposable, isi `TEST_DATABASE_URL`, lalu jalankan:

```powershell
npm run test:db
```

Runner menggunakan transaksi yang di-rollback dan menolak database yang sudah mempunyai tabel aplikasi. Jangan arahkan ke produksi.

Browser test dasar (server lokal dijalankan otomatis jika belum ada):

```powershell
npx playwright install chromium
npm run test:e2e
```

Untuk alur lengkap, seed proyek development, isi `E2E_STAFF_PASSWORD`/`E2E_STAFF_EMAIL` di environment, dan jalankan `npm run test:e2e`. Alur ini **mengubah item DEMO Susu menjadi 1 liter**, menyesuaikan DEMO Biji kopi, dan membuat/menonaktifkan item uji owner. Tanpa akun, alur autentikasi penuh ditandai skip. Alur owner juga memerlukan `E2E_OWNER_EMAIL` dan `E2E_OWNER_PASSWORD`, serta kategori aktif `DEMO E2E Pengujian`. Kedua akun harus memakai proyek development. Browser perlu tersedia; test tidak memakai bypass autentikasi. Alternatif pada Windows yang sudah mempunyai Edge: set `$env:E2E_BROWSER_CHANNEL="msedge"` sebelum menjalankan test agar tidak perlu mengunduh Chromium.

## Struktur penting

- `src/app`: halaman Next.js dan layout
- `src/components`: formulir, navigasi, tabel/kartu responsif
- `src/lib/actions.ts`: validasi dan mutasi server
- `src/lib/server.ts`: koneksi SSR dan otorisasi server
- `src/lib/domain.ts`: aturan stok dan schema validasi
- `src/lib/queries.ts`: filter dan paginasi
- `src/proxy.ts`: refresh cookie sesi Supabase
- `supabase/migrations`: skema, RLS, RPC transaksi dan trigger audit
- `scripts`: seed demo dan runner integrasi database
- `tests`: unit, integrasi PostgreSQL, browser

## Build produksi

```powershell
npm run build
npm start
```

Gunakan hosting Node.js yang mendukung Next.js 16; konfigurasikan dua variabel publik Supabase saat build/runtime. Migrasi dan provisioning akun harus dilakukan pada proyek tujuan sebelum digunakan. Belum ada deployment atau akun operasional produksi yang dibuat. Pengujian cloud memakai akun/item berlabel DEMO dengan kata sandi acak sementara. Akun dan item uji dinonaktifkan sesudah pengujian; riwayatnya tetap tersimpan. Buat akun operasional dan profilnya melalui Supabase sebelum penggunaan harian.

Hasil verifikasi cloud dan batasan pengujian tersedia di [docs/VERIFICATION.md](docs/VERIFICATION.md).
