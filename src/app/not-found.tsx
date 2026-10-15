import Link from "next/link";
export default function NotFound() {
  return (
    <main className="panel empty">
      <h1>Halaman tidak ditemukan</h1>
      <p>Item atau halaman yang Anda cari tidak tersedia.</p>
      <Link className="btn" href="/dashboard">
        Kembali ke dashboard
      </Link>
    </main>
  );
}
