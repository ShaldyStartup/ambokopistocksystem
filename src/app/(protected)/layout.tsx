import { Coffee, LogOut } from "lucide-react";
import { session } from "@/lib/server";
import { canManage } from "@/lib/domain";
import { logout } from "@/lib/actions";
import { Navigation } from "@/components/navigation";
export const dynamic = "force-dynamic";
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await session();
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Lewati navigasi
      </a>
      <aside className="sidebar">
        <div className="brand">
          <Coffee size={30} />
          <span>
            ambo<span className="brand-sub">COFFEE</span>
          </span>
        </div>
        <p className="sidebar-caption">MANAJEMEN PERSEDIAAN</p>
        <Navigation management={canManage(profile.role)} />
        <div className="sidebar-bottom">
          <div className="profile">
            <span className="avatar">
              {profile.name.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong>{profile.name}</strong>
              <small>
                {profile.role === "staff"
                  ? "Staf / Barista"
                  : profile.role === "owner"
                    ? "Pemilik"
                    : "Pengelola"}
              </small>
            </div>
          </div>
          <form action={logout}>
            <button className="logout">
              <LogOut size={17} /> Keluar
            </button>
          </form>
        </div>
      </aside>
      <div className="main-shell">
        <div className="topbar">
          <span>
            Operasional kedai <span className="muted">/ Persediaan</span>
          </span>
          <span className="topbar-status">
            <i /> Ambo Coffee
          </span>
        </div>
        <main id="main-content">{children}</main>
        <footer>
          AMBO COFFEE <span>Dicatat dengan teliti. Dikelola dengan mudah.</span>
        </footer>
      </div>
    </div>
  );
}
