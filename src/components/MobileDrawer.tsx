import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  X,
  Sparkles,
  Calendar,
  CheckSquare,
  MessageSquareText,
  Search,
  BarChart3,
  Database,
  User,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Key,
} from "lucide-react";
import { UserProfile } from "../types";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGuide: () => void;
  profile: UserProfile | null;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  onOpenGuide,
  profile,
}) => {
  const location = useLocation();

  // Tutup drawer ketika route berganti
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname]);

  // Tutup dengan Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navLinks = [
    { path: "/", label: "Generator Utas (Idea Fusion)", icon: Sparkles, desc: "Ubah ide kasar jadi 3 varian utas" },
    { path: "/kalender", label: "Kalender Konten", icon: Calendar, desc: "Jadwal 7-14 hari siap posting" },
    { path: "/cek", label: "Cek Utas & Kepatuhan", icon: CheckSquare, desc: "Audit anti-bait dan batas karakter" },
    { path: "/balas", label: "Asisten Balas Komentar", icon: MessageSquareText, desc: "Bangun reply depth dua arah" },
    { path: "/ulas", label: "Ulas Utas Viral", icon: Search, desc: "Bedah formula psikologi konten" },
    { path: "/metrik", label: "Metrik Tracker", icon: BarChart3, desc: "Pantau performa & rasio algoritma" },
    { path: "/bank", label: "Bank Pola Referensi", icon: Database, desc: "Katalog pola hook teruji" },
    { path: "/admin/api-lab", label: "Threads API Lab & Kunci", icon: ShieldCheck, desc: "Token akun Threads & Gemini key" },
    { path: "/profil", label: "Profil & Niche Kreator", icon: User, desc: "Atur target audiens & gaya bahasa" },
    { path: "/onboarding", label: "Onboarding Akun Threads", icon: Key, desc: "Status koneksi akun Threads & syarat akses" },
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-xs bg-zinc-950 border-l border-zinc-800 h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-500 flex items-center justify-center text-white font-bold text-sm">
              @
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Menu AutoThreads</h3>
              <p className="text-[10px] text-zinc-400">Navigasi Kreator Cepat</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Niche Card */}
        {profile && (
          <div className="p-3 mx-3 my-2 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex items-center justify-between text-xs">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] text-zinc-400 block font-medium">Niche Aktif:</span>
              <span className="font-bold text-white truncate block">
                {profile.niche} ({profile.tone})
              </span>
            </div>
            <Link
              to="/profil"
              onClick={onClose}
              className="px-2 py-1 rounded-lg bg-zinc-800 text-indigo-300 font-semibold text-[11px] shrink-0"
            >
              Ubah
            </Link>
          </div>
        )}

        {/* Quick Panduan Banner */}
        <div className="px-3 pb-2">
          <button
            onClick={() => {
              onClose();
              onOpenGuide();
            }}
            className="w-full p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 hover:border-indigo-500/40 text-left transition flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-white block">Buku Panduan Interaktif</span>
                <span className="text-[10px] text-zinc-400 block">Kaidah algoritma & tutorial lengkap</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 transition shrink-0" />
          </button>
        </div>

        {/* Navigation Links List */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1 scrollbar-none">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-start gap-3 p-2.5 rounded-xl transition ${
                  isActive
                    ? "bg-zinc-900 text-white font-semibold border border-zinc-800"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                }`}
              >
                <Icon
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    isActive ? "text-indigo-400" : "text-zinc-400"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold block truncate text-zinc-200">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-zinc-500 block truncate">
                    {item.desc}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/40 text-center text-[10px] text-zinc-500 pb-safe">
          AutoThreads ID • Generator Utas Ramah Algoritma
        </div>
      </div>
    </div>
  );
};
