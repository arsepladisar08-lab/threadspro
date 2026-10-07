import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, Calendar, CheckSquare, MessageSquareText, BarChart3 } from "lucide-react";

export const BottomNav: React.FC = () => {
  const location = useLocation();

  const primaryItems = [
    { path: "/", label: "Generator", icon: Sparkles },
    { path: "/kalender", label: "Kalender", icon: Calendar },
    { path: "/cek", label: "Cek Utas", icon: CheckSquare },
    { path: "/balas", label: "Balas", icon: MessageSquareText },
    { path: "/metrik", label: "Metrik", icon: BarChart3 },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-850 pb-safe transition-colors duration-200"
      aria-label="Navigasi Bawah Mobile"
    >
      <div className="grid grid-cols-5 h-14 max-w-md mx-auto items-center px-1">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center h-full gap-0.5 transition-colors ${
                isActive
                  ? "text-zinc-900 dark:text-zinc-100 font-semibold"
                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-normal"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
