/**
 * Sumber tunggal daftar menu navigasi.
 * Dipakai oleh Sidebar, BottomNav, dan MobileDrawer agar label, ikon, dan
 * urutan menu selalu konsisten di semua ukuran layar.
 */
import {
  Sparkles,
  Link2,
  Calendar,
  CheckSquare,
  MessageSquareText,
  Search,
  BarChart3,
  Database,
  ShieldCheck,
  User,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  /** Label pendek untuk ruang sempit (bottom bar) */
  shortLabel?: string;
  icon: LucideIcon;
  shortcut?: string;
}

export const MAIN_NAV: NavItem[] = [
  { path: "/", label: "Generator Utas", shortLabel: "Generator", icon: Sparkles, shortcut: "Alt+1" },
  { path: "/link", label: "Link Lab", shortLabel: "Link Lab", icon: Link2, shortcut: "Alt+6" },
  { path: "/kalender", label: "Kalender Konten", shortLabel: "Kalender", icon: Calendar, shortcut: "Alt+2" },
  { path: "/cek", label: "Cek Utas", icon: CheckSquare, shortcut: "Alt+3" },
  { path: "/balas", label: "Balas Komen", shortLabel: "Balas", icon: MessageSquareText, shortcut: "Alt+4" },
  { path: "/ulas", label: "Ulas Utas", icon: Search },
  { path: "/metrik", label: "Metrik Tracker", shortLabel: "Metrik", icon: BarChart3, shortcut: "Alt+5" },
  { path: "/bank", label: "Bank Referensi", icon: Database },
];

export const SECONDARY_NAV: NavItem[] = [
  { path: "/profil", label: "Pengaturan Profil", icon: User },
  { path: "/onboarding", label: "Onboarding Threads", icon: ShieldCheck },
];

/** Menu utama untuk bottom bar mobile (urutan mengikuti MAIN_NAV) */
export const BOTTOM_NAV: NavItem[] = MAIN_NAV.filter((item) =>
  ["/", "/link", "/kalender", "/cek", "/balas", "/metrik"].includes(item.path),
);

/** Menu aktif jika path sama persis, atau berada di bawah path tersebut. */
export function isPathActive(pathname: string, path: string): boolean {
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}
