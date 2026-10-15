"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ClipboardCheck,
  ArrowLeftRight,
  History,
  Bell,
  ChartNoAxesCombined,
  Settings,
} from "lucide-react";
const links = [
  ["/dashboard", "Dashboard", LayoutDashboard],
  ["/inventory", "Persediaan", Package],
  ["/stock-count", "Catat stok", ClipboardCheck],
  ["/stock-adjustment", "Penyesuaian stok", ArrowLeftRight],
  ["/stock-history", "Riwayat stok", History],
  ["/alerts", "Peringatan stok", Bell],
  ["/reports", "Laporan", ChartNoAxesCombined],
  ["/settings", "Kategori", Settings],
] as const;
export function Navigation({ management }: { management: boolean }) {
  const path = usePathname();
  return (
    <nav aria-label="Navigasi utama">
      {links
        .filter(
          ([href]) => management || !["/reports", "/settings"].includes(href),
        )
        .map(([href, label, Icon]) => (
          <Link
            key={href}
            className={`nav-link ${path.startsWith(href) ? "selected" : ""}`}
            href={href}
            aria-current={path.startsWith(href) ? "page" : undefined}
          >
            <Icon size={19} />
            <span>{label}</span>
          </Link>
        ))}
    </nav>
  );
}
