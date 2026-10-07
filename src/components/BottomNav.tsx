import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, Calendar, CheckSquare, MessageSquareText, BarChart3 } from "lucide-react";

interface BottomNavProps {
  onOpenMenu?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = () => {
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
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/80 pb-safe shadow-lg"
      aria-label="Navigasi Bawah Mobile"
    >
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto items-center px-1">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center h-full gap-1 transition-all active:scale-95 ${
                isActive
                  ? "text-indigo-400 font-bold"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <div
                className={`relative flex items-center justify-center p-1 rounded-xl transition ${
                  isActive ? "bg-indigo-500/10" : ""
                }`}
              >
                <Icon className="w-5 h-5" />
                {isActive && (
                  <span className="absolute -top-1 w-1 h-1 rounded-full bg-indigo-400 animate-pulse" />
                )}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
