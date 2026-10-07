import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  User,
  ShieldCheck,
  BookOpen,
  PanelLeft,
  PanelLeftClose,
  Menu,
  Sparkles,
  Key,
} from "lucide-react";
import { storage } from "../lib/storage";
import { UserProfile } from "../types";
import { GeminiApiKeyModal } from "./GeminiApiKeyModal";

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
  const [threadsAccount, setThreadsAccount] = useState<any | null>(null);
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);

  useEffect(() => {
    storage.getProfile().then(setProfile);
    storage.getThreadsAccount().then(setThreadsAccount);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 w-full bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 select-none">
      <div className="w-full px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left Side: Sidebar Toggle & Brand */}
        <div className="flex items-center gap-3">
          {/* Desktop Sidebar Toggle Button */}
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition cursor-pointer"
            title={isSidebarCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
            aria-label="Toggle Sidebar"
          >
            {isSidebarCollapsed ? (
              <PanelLeft className="w-4 h-4 text-zinc-400" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-zinc-400" />
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition cursor-pointer"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold text-xs tracking-tight transition group-hover:bg-white shrink-0">
              @
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-sm tracking-tight text-zinc-100">
                AutoThreads
              </span>
              {profile?.niche && (
                <span className="text-xs text-zinc-400 hidden sm:inline">
                  · {profile.niche}
                </span>
              )}
            </div>
          </Link>
        </div>

        {/* Right Side: Panduan, Kunci API, API Lab, & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
          {/* Panduan Button */}
          <button
            onClick={onOpenGuide}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition cursor-pointer"
            title="Buku Panduan Algoritma"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Panduan</span>
          </button>

          {/* Kunci API Gemini Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsGeminiModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition cursor-pointer"
            title="Input Kunci API Google Gemini Mandiri"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span>Kunci API</span>
          </button>

          {/* API Lab Link */}
          <Link
            to="/admin/api-lab"
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition"
            title="Kelola Token Akun Threads & Kunci Gemini"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>API Lab</span>
          </Link>

          {/* Account / Onboarding Link */}
          {!threadsAccount ? (
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 transition font-medium"
              title="Hubungkan Akun Threads"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Login Threads</span>
            </Link>
          ) : (
            <Link
              to="/profil"
              className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 text-zinc-200 border border-zinc-800/80 transition"
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
              <span className="font-medium text-zinc-200">@{threadsAccount.username}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Modal Input Kunci API Gemini Mandiri */}
      <GeminiApiKeyModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
      />
    </header>
  );
};
