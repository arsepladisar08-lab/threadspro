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
  ShieldCheck,
  BookOpen,
  User,
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

  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname]);

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
    { path: "/", label: "Generator Utas", icon: Sparkles },
    { path: "/kalender", label: "Kalender Konten", icon: Calendar },
    { path: "/cek", label: "Cek Utas", icon: CheckSquare },
    { path: "/balas", label: "Balas Komen", icon: MessageSquareText },
    { path: "/ulas", label: "Ulas Utas", icon: Search },
    { path: "/metrik", label: "Metrik Tracker", icon: BarChart3 },
    { path: "/bank", label: "Bank Referensi", icon: Database },
    { path: "/profil", label: "Pengaturan Profil", icon: User },
    { path: "/onboarding", label: "Onboarding Threads", icon: ShieldCheck },
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-xs bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-900 h-full flex flex-col z-10 shadow-xl animate-in slide-in-from-right duration-200 text-zinc-900 dark:text-zinc-100">
        {/* Drawer Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center font-bold text-xs">
              @
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                AutoThreads
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Niche Card */}
        {profile && (
          <div className="p-3 mx-3 my-2 rounded-xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-xs">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">Niche:</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-200 truncate block">
                {profile.niche} ({profile.tone})
              </span>
            </div>
            <Link
              to="/profil"
              onClick={onClose}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:text-white font-medium text-xs shrink-0"
            >
              Atur Profil
            </Link>
          </div>
        )}

        {/* Quick Panduan Button */}
        <div className="px-3 pb-2">
          <button
            onClick={() => {
              onClose();
              onOpenGuide();
            }}
            className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-left transition flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
              <span>Buku Panduan Algoritma</span>
            </div>
            <span className="text-zinc-400 dark:text-zinc-500">→</span>
          </button>
        </div>

        {/* Navigation Links List */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5 scrollbar-none">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = item.path.includes("?")
              ? `${location.pathname}${location.search}` === item.path
              : location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? "text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-400 dark:text-zinc-500"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-900 text-center text-[10px] text-zinc-400 dark:text-zinc-500 pb-safe">
          AutoThreads · Minimalist Threads Writing Engine
        </div>
      </div>
    </div>
  );
};
