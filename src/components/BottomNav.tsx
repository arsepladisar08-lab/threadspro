import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, Calendar, CheckSquare, BarChart3, Database } from "lucide-react";

export const BottomNav: React.FC = () => {
  const location = useLocation();

  const items = [
    { path: "/", label: "Generator", icon: Sparkles },
    { path: "/kalender", label: "Kalender", icon: Calendar },
    { path: "/cek", label: "Cek Utas", icon: CheckSquare },
    { path: "/metrik", label: "Metrik", icon: BarChart3 },
    { path: "/bank", label: "Bank", icon: Database },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-lg border-t border-neutral-800 pb-safe">
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 transition ${
                isActive ? "text-indigo-400 font-semibold" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
