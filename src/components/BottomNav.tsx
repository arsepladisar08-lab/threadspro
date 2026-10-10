import React from "react";
import { Link, useLocation } from "react-router-dom";
import { BOTTOM_NAV, isPathActive } from "../lib/navigation";

export const BottomNav: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-850 pb-safe transition-colors duration-200"
      aria-label="Navigasi Bawah Mobile"
    >
      <div
        className={`grid h-14 max-w-lg mx-auto items-center px-1 ${
          BOTTOM_NAV.length === 6 ? "grid-cols-6" : "grid-cols-5"
        }`}
      >
        {BOTTOM_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = isPathActive(pathname, item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center h-full gap-0.5 transition-colors ${
                isActive
                  ? "text-zinc-900 dark:text-zinc-100 font-semibold"
                  : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-normal"
              }`}
            >
              {isActive && (
                <span
                  className="absolute top-0 h-0.5 w-8 rounded-full bg-indigo-500"
                  aria-hidden="true"
                />
              )}
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-[11px] tracking-tight">
                {item.shortLabel ?? item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
