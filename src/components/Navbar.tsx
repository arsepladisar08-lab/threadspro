import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, Calendar, CheckSquare, MessageSquareText, Search, BarChart3, Database, User, ShieldCheck, ExternalLink, Menu, X } from "lucide-react";
import { storage } from "../lib/storage";
import { UserProfile } from "../types";
import { CONFIG } from "../config";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    storage.getProfile().then(setProfile);
  }, [location.pathname]);

  const navLinks = [
    { path: "/", label: "Generator", icon: Sparkles },
    { path: "/kalender", label: "Kalender", icon: Calendar },
    { path: "/cek", label: "Cek Utas", icon: CheckSquare },
    { path: "/balas", label: "Balas Komen", icon: MessageSquareText },
    { path: "/ulas", label: "Ulas Utas", icon: Search },
    { path: "/metrik", label: "Metrik", icon: BarChart3 },
    { path: "/bank", label: "Bank Pola", icon: Database },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20 group-hover:scale-105 transition">
              @
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">AutoThreads</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">ID</span>
              </div>
              <p className="text-[10px] text-neutral-400 font-medium hidden sm:block">Ramah Algoritma Threads</p>
            </div>
          </Link>

          {profile?.niche && (
            <Link
              to="/profil"
              className="hidden md:inline-flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-neutral-700 transition"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{profile.niche}</span>
            </Link>
          )}
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? "bg-neutral-800 text-white shadow-xs"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-400" : ""}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Threads API Lab & Admin */}
          <Link
            to="/admin/api-lab"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition"
            title="Threads API Lab & Manajemen Kuota"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px]">API Lab</span>
          </Link>

          {/* Profil Button */}
          <Link
            to="/profil"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-600/20 transition"
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Profil Niche</span>
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-4 bg-neutral-950 border-b border-neutral-800 space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  isActive ? "bg-neutral-800 text-white font-semibold" : "text-neutral-400 hover:bg-neutral-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : ""}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-neutral-800 flex justify-between items-center text-xs text-neutral-400 px-3 py-2">
            <span>Mode AI: {CONFIG.defaultAiMode}</span>
            <Link to="/admin/api-lab" onClick={() => setMobileMenuOpen(false)} className="text-indigo-400">
              Threads API Lab →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
