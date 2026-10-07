import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  User,
  ShieldCheck,
  BookOpen,
  PanelLeft,
  PanelLeftClose,
  Menu,
  Sun,
  Moon,
  Laptop,
  Search,
  Check,
} from "lucide-react";
import { storage } from "../lib/storage";
import { UserProfile } from "../types";
import { useTheme, ThemeMode } from "../hooks/useTheme";

interface NavbarProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenGuide: () => void;
  onOpenMobileMenu: () => void;
  onOpenCommandPalette?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenGuide,
  onOpenMobileMenu,
  onOpenCommandPalette,
}) => {
  const location = useLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [threadsAccount, setThreadsAccount] = useState<any | null>(null);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    storage.getProfile().then(setProfile);
    storage.getThreadsAccount().then(setThreadsAccount);
  }, [location.pathname]);

  // Close theme menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    if (isThemeMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isThemeMenuOpen]);

  const themeOptions: { mode: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { mode: "system", label: "Ikuti Sistem", icon: Laptop },
    { mode: "light", label: "Mode Terang", icon: Sun },
    { mode: "dark", label: "Mode Gelap", icon: Moon },
  ];

  const CurrentThemeIcon = theme === "system" ? Laptop : theme === "dark" ? Moon : Sun;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-850 select-none transition-colors duration-200">
      <div className="w-full px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Left Side: Sidebar Toggle & Brand */}
        <div className="flex items-center gap-3">
          {/* Desktop Sidebar Toggle Button with Shortcut Hint */}
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer"
            title={isSidebarCollapsed ? "Buka Sidebar (⌘+B)" : "Tutup Sidebar (⌘+B)"}
            aria-label="Toggle Sidebar"
          >
            {isSidebarCollapsed ? (
              <PanelLeft className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center font-bold text-xs tracking-tight transition group-hover:scale-105 shrink-0 shadow-xs">
              @
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
                AutoThreads
              </span>
              {profile?.niche && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                  · {profile.niche}
                </span>
              )}
            </div>
          </Link>
        </div>

        {/* Center: Command Palette Trigger Button (Desktop & Tablet) */}
        {onOpenCommandPalette && (
          <div className="hidden sm:flex items-center flex-1 max-w-xs mx-2">
            <button
              onClick={onOpenCommandPalette}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-100/80 dark:bg-zinc-900/60 hover:bg-zinc-200/70 dark:hover:bg-zinc-850/80 border border-zinc-200/80 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs transition cursor-pointer"
              title="Pencarian Cepat & Perintah (⌘+K)"
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 text-zinc-400" />
                <span className="truncate">Cari perintah / navigasi...</span>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-[10px] font-mono text-zinc-600 dark:text-zinc-300 shadow-2xs">
                  ⌘K
                </kbd>
              </div>
            </button>
          </div>
        )}

        {/* Right Side: Theme Toggle, Panduan, API Lab, & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
          {/* Mobile Quick Command Palette Button */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="sm:hidden p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer"
              title="Command Palette"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Theme Switcher Toggle (Sun / Moon / Laptop) */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => setIsThemeMenuOpen((prev) => !prev)}
              className="p-1.5 sm:px-2 sm:py-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer flex items-center gap-1.5"
              title={`Tema: ${
                theme === "system"
                  ? `Sistem (${resolvedTheme})`
                  : theme === "dark"
                  ? "Gelap"
                  : "Terang"
              } - Klik untuk ubah`}
              aria-label="Pilih Tema"
              aria-haspopup="true"
              aria-expanded={isThemeMenuOpen}
            >
              <CurrentThemeIcon className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
              <span className="hidden xl:inline text-[11px] capitalize font-medium text-zinc-600 dark:text-zinc-300">
                {theme === "system" ? "Sistem" : theme === "dark" ? "Gelap" : "Terang"}
              </span>
            </button>

            {/* Dropdown Menu */}
            {isThemeMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                  Pilihan Tema
                </div>
                {themeOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = theme === opt.mode;
                  return (
                    <button
                      key={opt.mode}
                      onClick={() => {
                        setTheme(opt.mode);
                        setIsThemeMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                        isSelected
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium"
                          : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                        <span>{opt.label}</span>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-indigo-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panduan Button with Shortcut Hint */}
          <button
            onClick={onOpenGuide}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer"
            title="Buku Panduan Algoritma (?)"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Panduan</span>
            <kbd className="hidden md:inline-block px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
              ?
            </kbd>
          </button>

          {/* Account / Onboarding Link */}
          {!threadsAccount ? (
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-850 dark:hover:bg-zinc-800 dark:text-zinc-200 border border-zinc-800 transition font-medium"
              title="Hubungkan Akun Threads"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Login Threads</span>
            </Link>
          ) : (
            <Link
              to="/profil"
              className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900/60 hover:bg-zinc-200 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800/80 transition"
              title={`Akun Threads @${threadsAccount.username}`}
            >
              {threadsAccount.threads_profile_picture_url ? (
                <img
                  src={threadsAccount.threads_profile_picture_url}
                  alt={threadsAccount.username}
                  className="w-4 h-4 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <User className="w-3.5 h-3.5 text-zinc-400" />
              )}
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                @{threadsAccount.username}
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
