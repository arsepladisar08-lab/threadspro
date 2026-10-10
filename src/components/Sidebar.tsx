import React from "react";
import { Link, useLocation } from "react-router-dom";
import { MAIN_NAV, SECONDARY_NAV, isPathActive } from "../lib/navigation";
import { UserProfile } from "../types";

interface SidebarProps {
  isCollapsed: boolean;
  profile: UserProfile | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  profile,
}) => {
  const location = useLocation();

  return (
    <aside
      className={`hidden lg:flex flex-col shrink-0 border-r border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 transition-all duration-200 ease-in-out select-none relative z-30 ${
        isCollapsed ? "w-14" : "w-60"
      }`}
      aria-label="Sidebar Navigasi"
    >
      {/* Main Navigation Items */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 scrollbar-none">
        {MAIN_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = isPathActive(location.pathname, item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition group relative ${
                isActive
                  ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
              } ${isCollapsed ? "justify-center px-0" : "justify-between"}`}
              title={isCollapsed ? (item.shortcut ? `${item.label} (${item.shortcut})` : item.label) : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition ${
                    isActive
                      ? "text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200"
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!isCollapsed && item.shortcut && (
                <kbd className="hidden xl:inline-block px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-750 text-[9px] font-mono text-zinc-400 dark:text-zinc-500">
                  {item.shortcut}
                </kbd>
              )}

              {/* Floating Tooltip in Collapsed Mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-white font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap z-50 shadow-md flex items-center gap-2">
                  <span>{item.label}</span>
                  {item.shortcut && (
                    <kbd className="px-1 py-0.2 rounded bg-zinc-800 text-[10px] text-zinc-400 font-mono">
                      {item.shortcut}
                    </kbd>
                  )}
                </div>
              )}
            </Link>
          );
        })}

        {/* Subtle Divider */}
        <div className="my-2 border-t border-zinc-200 dark:border-zinc-850" />

        {/* Secondary Nav */}
        {SECONDARY_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = isPathActive(location.pathname, item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition group relative ${
                isActive
                  ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
              } ${isCollapsed ? "justify-center px-0" : ""}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition ${
                  isActive
                    ? "text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200"
                }`}
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}

              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-white font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap z-50 shadow-md">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Sidebar Footer & Niche status */}
      {profile?.niche && (
        <div className="p-2 border-t border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950">
          {!isCollapsed ? (
            <Link
              to="/profil"
              className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900/60 transition text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              title="Pengaturan Niche & Karakter Akun"
            >
              <div className="min-w-0 pr-2">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Niche:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-300 truncate block">
                  {profile.niche}
                </span>
              </div>
              <span className="text-[11px] text-zinc-400">Atur →</span>
            </Link>
          ) : (
            <Link
              to="/profil"
              className="w-full flex justify-center py-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
              title={`Niche: ${profile.niche}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            </Link>
          )}
        </div>
      )}
    </aside>
  );
};
