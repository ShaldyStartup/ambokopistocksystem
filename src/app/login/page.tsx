import { Coffee, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/forms";
import { configured } from "@/lib/server";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;
  const enabled = configured();
  return (
    <main className="login-shell">
      <section className="login-story">
        <div className="brand">
          <Coffee size={32} />
          <span>
            ambo<span className="brand-sub">COFFEE</span>
          </span>
        </div>
        <div>
          <span className="eyebrow">MANAJEMEN STOK</span>
          <h1>Persediaan Ambo Coffee</h1>
          <p>Catat hasil hitung fisik dan pantau persediaan kedai.</p>
        </div>
        <span className="small">Ambo Coffee · Sistem Manajemen Stok</span>
      </section>
      <section className="login-form">
        <div className="login-box">
          <div className="login-icon">
            <Coffee size={28} />
          </div>
          <span className="eyebrow">SELAMAT DATANG KEMBALI</span>
          <h2>Masuk ke Ambo Coffee</h2>
          <p className="muted">Persediaan kedai, dalam satu tempat.</p>
          {!enabled && (
            <div className="notice">
              Setup diperlukan: isi variabel Supabase di .env.local dan jalankan
              migrasi database sesuai README. Belum ada data operasional yang
              digunakan.
            </div>
          )}
          {p.inactive && (
            <div className="notice error" role="alert">
              Akun tidak aktif atau belum memiliki profil. Hubungi pengelola.
            </div>
          )}
          <LoginForm enabled={enabled} />
          <p className="secure-note">
            <ShieldCheck size={16} /> Akses khusus staf dan pengelola Ambo
            Coffee
          </p>
        </div>
      </section>
    </main>
  );
}
