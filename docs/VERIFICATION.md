# Verifikasi implementasi

Dijalankan pada Windows dengan Node.js 24.14.0, 15 Oktober 2026.

## Proyek terhubung

- Supabase: **AmboKopi**, ref `fljtmusdvaykxxnqgiiv`.
- Skema awal `public` kosong dan tidak memiliki migrasi ketika diperiksa.
- Tidak dibuat proyek Supabase kedua.
- Migrasi diterapkan melalui koneksi MCP Supabase terautentikasi; versi file lokal diselaraskan dengan riwayat server.
- Tipe TypeScript dihasilkan dari database cloud dan digunakan oleh client SSR.

## Pemeriksaan

| Pemeriksaan                 | Hasil                                                       |
| --------------------------- | ----------------------------------------------------------- |
| `npm ci`                    | Lulus dari lockfile                                         |
| `npm run lint`              | Lulus                                                       |
| `npm run typecheck`         | Lulus                                                       |
| `npm test`                  | 29 tes lulus, mencakup unit dan integrasi PostgreSQL/PGlite |
| `npm run build`             | Lulus                                                       |
| `npm audit`                 | 0 kerentanan                                                |
| Playwright + Supabase nyata | 5 tes browser lulus, tidak ada skip                         |
| Supabase security advisors  | Tidak ada temuan schema/RLS; 1 warning konfigurasi Auth     |

Setelah akun uji dibuat, advisors menampilkan warning konfigurasi Auth: **Leaked Password Protection Disabled**. Fitur ini diatur pada proyek Supabase dan tersedia pada paket Pro ke atas; implementasi tidak mengubah paket atau menambah biaya. [Remediasi resmi](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Advisors performa hanya memberi informasi bahwa beberapa indeks belum digunakan pada tabel baru. Indeks untuk foreign key, riwayat item/pengguna, dan urutan waktu tetap dipertahankan sesuai kebutuhan query. [Penjelasan unused index](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

## Alur yang diverifikasi

- Tanpa sesi, seluruh route operasional mengarahkan ke login.
- Login pada viewport ponsel tidak menyebabkan overflow horizontal.
- Staf login melalui Supabase Auth, ditolak dari konfigurasi item, mencatat stok fisik lewat viewport 390px, memeriksa konfirmasi, menyimpan, melihat persediaan terbaru, riwayat pengguna/shift, dan peringatan stok menipis.
- Pemilik login, membuat item, mengubah minimum stok, melihat status menipis, riwayat, dan laporan, lalu menonaktifkan item tanpa kehilangan riwayat.
- Staf membuat penambahan, pengurangan, dan koreksi; pengurangan yang membuat stok negatif ditolak pada form, dan seluruh penyesuaian berhasil masuk riwayat.
- Logout kembali ke login.

Suite PostgreSQL/PGlite menjalankan seluruh migrasi dengan stub auth lokal dan memeriksa stok awal, hitung fisik, penambahan/pengurangan/koreksi, snapshot audit, batas minimum, penolakan stok negatif/stale-write, rollback batch ketika insert audit gagal setelah item sebelumnya diproses, staff/manager/owner, RLS 30 hari, akun/item nonaktif, dan larangan mutasi langsung atau penimpaan riwayat.

## Data pengujian dan batasan

Akun dan item cloud khusus pengujian diberi nama DEMO; jumlahnya fiktif. Akun uji tidak mengirim email dan menggunakan hash kata sandi acak; kata sandi hanya berada dalam memori proses pengujian. Sesudah pengujian, sesi dicabut, akun diblokir/profil dinonaktifkan, dan item demo dinonaktifkan. Riwayat audit sengaja tetap disimpan. Tidak ada stok riil Ambo Coffee yang dikarang.

Tidak ada `.env.local`, secret key, token GitHub, atau kata sandi yang disimpan dalam repositori. Dua variabel publik Supabase diberikan melalui environment pada proses pengujian/build. Sebelum operasional, pengelola perlu menyiapkan akun nyata dan environment pada host aplikasi. Deployment dan merge PR tidak dilakukan.

Pemeriksaan akhir database: 0 item aktif, 0 profil uji aktif, 2 akun uji diblokir, dan 15 catatan audit tetap tersimpan dengan selisih kuantitas yang konsisten.
