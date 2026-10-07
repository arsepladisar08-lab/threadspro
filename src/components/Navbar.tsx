import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sparkles,
  User,
  ShieldCheck,
  BookOpen,
  PanelLeft,
  PanelLeftClose,
  Menu,
} from "lucide-react";
import { storage } from "../lib/storage";
import { UserProfile } from "../types";

interface NavbarProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenGuide: () => void;
  onOpenMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenGuide,
  onOpenMobileMenu,
}) => {
  const location = useLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    storage.getProfile().then(setProfile);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 w-full bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 select-none">
      <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left Side: Sidebar Toggle & Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Desktop Sidebar Toggle Button */}
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition cursor-pointer"
            title={isSidebarCollapsed ? "Buka Sidebar Lengkap" : "Sembunyikan Sidebar"}
            aria-label="Toggle Sidebar"
          >
            {isSidebarCollapsed ? (
              <PanelLeft className="w-5 h-5 text-zinc-300" />
            ) : (
              <PanelLeftClose className="w-5 h-5 text-zinc-300" />
            )}
          </button>

          {/* Mobile & Tablet Menu Button */}
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/20 group-hover:scale-105 transition shrink-0">
              @
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                AutoThreads
              </span>
              <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700/60 hidden sm:inline-block">
                ID
              </span>
            </div>
          </Link>

          {/* Niche Badge */}
          {profile?.niche && (
            <Link
              to="/profil"
              className="hidden lg:inline-flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 transition"
              title="Klik untuk ubah profil niche"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{profile.niche}</span>
            </Link>
          )}
        </div>

        {/* Right Side: Panduan, API Lab, & Profile */}
        <div className="flex items-center gap-2">
          {/* Interactive User Guide Button */}
          <button
            onClick={onOpenGuide}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition active:scale-95 cursor-pointer shadow-xs"
            title="Buka Buku Panduan Algoritma & Tutorial"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Panduan</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-indigo-500/10 text-indigo-300 hidden md:inline">
              ?
            </span>
          </button>

          {/* Threads API Lab & Keys */}
          <Link
            to="/admin/api-lab"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition shadow-xs"
            title="Kelola Token Akun Threads & Kunci Gemini"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] hidden md:inline">API Lab</span>
          </Link>

          {/* Profile Button */}
          <Link
            to="/profil"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-600/20 transition active:scale-95"
            title="Pengaturan Profil Niche & Tone"
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Profil</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
