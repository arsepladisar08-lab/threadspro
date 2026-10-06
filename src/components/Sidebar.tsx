import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
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
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
  ChevronLeft,
  Flame,
} from "lucide-react";
import { UserProfile } from "../types";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenGuide: () => void;
  profile: UserProfile | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  onOpenGuide,
  profile,
}) => {
  const location = useLocation();

  const mainNav = [
    { path: "/", label: "Generator Utas", icon: Sparkles, badge: "AI" },
    { path: "/kalender", label: "Kalender Konten", icon: Calendar },
    { path: "/cek", label: "Cek Utas", icon: CheckSquare },
    { path: "/balas", label: "Balas Komen", icon: MessageSquareText },
    { path: "/ulas", label: "Ulas Utas", icon: Search },
    { path: "/metrik", label: "Metrik Tracker", icon: BarChart3 },
    { path: "/bank", label: "Bank Referensi", icon: Database },
  ];

  const secondaryNav = [
    { path: "/admin/api-lab", label: "API Lab & Kunci", icon: ShieldCheck },
    { path: "/profil", label: "Profil Kreator", icon: User },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 border-r border-zinc-800 bg-zinc-950 transition-all duration-300 ease-in-out select-none relative z-30 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
      aria-label="Sidebar Navigasi"
    >
      {/* Sidebar Header */}
      <div className="h-16 px-3 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/50">
        {!isCollapsed ? (
          <Link to="/" className="flex items-center gap-2.5 px-2 group overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20 group-hover:scale-105 transition shrink-0">
              @
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-sm tracking-tight text-white truncate block">
                AutoThreads
              </span>
              <span className="text-[10px] text-zinc-400 font-medium block truncate">
                Algoritma ID
              </span>
            </div>
          </Link>
        ) : (
          <div className="w-full flex justify-center">
            <Link to="/" className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20 hover:scale-105 transition shrink-0">
              @
            </Link>
          </div>
        )}

        {/* Toggle Collapse Button */}
        {!isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
            title="Sembunyikan Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Navigation Items */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-none">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition group relative ${
                isActive
                  ? "bg-zinc-900 text-white shadow-xs border border-zinc-800"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60"
              } ${isCollapsed ? "justify-center px-0" : ""}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition ${
                  isActive ? "text-indigo-400" : "text-zinc-400 group-hover:text-zinc-200"
                }`}
              />

              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {/* Floating Tooltip in Collapsed Mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap z-50 shadow-lg">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}

        {/* Separator */}
        <div className="my-2 border-t border-zinc-800/80" />

        {/* Panduan Penggunaan Button */}
        <button
          onClick={onOpenGuide}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-indigo-950/30 hover:border-indigo-500/30 border border-transparent transition group cursor-pointer ${
            isCollapsed ? "justify-center px-0" : ""
          }`}
          title={isCollapsed ? "Panduan Penggunaan" : undefined}
        >
          <BookOpen className="w-4 h-4 text-indigo-400 shrink-0 group-hover:scale-110 transition" />
          {!isCollapsed && (
            <div className="flex-1 flex items-center justify-between text-left">
              <span>Buku Panduan</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-medium">
                Bantuan
              </span>
            </div>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap z-50 shadow-lg">
              Buku Panduan
            </div>
          )}
        </button>

        {/* Secondary Nav */}
        {secondaryNav.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition group relative ${
                isActive
                  ? "bg-zinc-900 text-white shadow-xs border border-zinc-800"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60"
              } ${isCollapsed ? "justify-center px-0" : ""}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition ${
                  isActive ? "text-indigo-400" : "text-zinc-400 group-hover:text-zinc-200"
                }`}
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}

              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap z-50 shadow-lg">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Sidebar Footer & Niche status */}
      <div className="p-2 border-t border-zinc-800/80 bg-zinc-950/80">
        {!isCollapsed && profile?.niche ? (
          <Link
            to="/profil"
            className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition"
          >
            <div className="min-w-0 pr-2">
              <span className="text-[10px] text-zinc-400 block font-medium">Niche Terpilih:</span>
              <span className="text-xs font-bold text-white truncate block">
                {profile.niche}
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          </Link>
        ) : isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="w-full flex justify-center py-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition cursor-pointer"
            title="Buka Sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
