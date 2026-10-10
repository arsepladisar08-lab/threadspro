import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Sparkles,
  Link2,
  Calendar,
  ShieldCheck,
  MessageSquare,
  BarChart3,
  Database,
  User,
  BookOpen,
  PanelLeft,
  Sun,
  Moon,
  Laptop,
  ArrowRight,
  X,
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleSidebar?: () => void;
  onOpenGuide?: () => void;
}

interface CommandItem {
  id: string;
  category: "Navigasi" | "Aksi & Alat";
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onToggleSidebar,
  onOpenGuide,
}) => {
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: CommandItem[] = [
    {
      id: "nav-generator",
      category: "Navigasi",
      title: "Generator Utas & Fusi Ide",
      description: "Buat 3 varian utas Threads otomatis berpola referensi",
      icon: Sparkles,
      shortcut: "Alt + 1",
      action: () => navigate("/"),
    },
    {
      id: "nav-link",
      category: "Navigasi",
      title: "Link Lab (Bedah Video YouTube)",
      description: "Ubah video YouTube jadi 5 angle & 3 varian utas Threads",
      icon: Link2,
      shortcut: "Alt + 6",
      action: () => navigate("/link"),
    },
    {
      id: "nav-kalender",
      category: "Navigasi",
      title: "Kalender Jadwal & Antrean",
      description: "Kelola timeline penerbitan otomatis jam tayang WIB",
      icon: Calendar,
      shortcut: "Alt + 2",
      action: () => navigate("/kalender"),
    },
    {
      id: "nav-cek",
      category: "Navigasi",
      title: "Cek Utas & Anti-Bait",
      description: "Pemeriksaan bobot algoritma & skor bebas bait",
      icon: ShieldCheck,
      shortcut: "Alt + 3",
      action: () => navigate("/cek"),
    },
    {
      id: "nav-balas",
      category: "Navigasi",
      title: "Asisten Balas Komentar",
      description: "Fasilitasi sinyal percakapan bermutu di Reply",
      icon: MessageSquare,
      shortcut: "Alt + 4",
      action: () => navigate("/balas"),
    },
    {
      id: "nav-metrik",
      category: "Navigasi",
      title: "Analisis Metrik Algoritma",
      description: "Evaluasi performa engagement, replies & shares",
      icon: BarChart3,
      shortcut: "Alt + 5",
      action: () => navigate("/metrik"),
    },
    {
      id: "nav-bank",
      category: "Navigasi",
      title: "Bank Referensi Hook & Struktur",
      description: "Katalog pola hook organik Threads teruji",
      icon: Database,
      action: () => navigate("/bank"),
    },
    {
      id: "nav-profil",
      category: "Navigasi",
      title: "Pengaturan Profil & Kredensial",
      description: "Kustomisasi niche, tone gaya bicara, profil & kredensial akun",
      icon: User,
      action: () => navigate("/profil"),
    },
    {
      id: "act-sidebar",
      category: "Aksi & Alat",
      title: "Toggle Buka / Tutup Sidebar",
      description: "Beralih mode tampilan layar kerja penuh",
      icon: PanelLeft,
      shortcut: "⌘ + B",
      action: () => {
        onToggleSidebar?.();
      },
    },
    {
      id: "act-guide",
      category: "Aksi & Alat",
      title: "Buka Panduan & Daftar Shortcut",
      description: "Tips algoritma Threads dan seluruh kombinasi tombol",
      icon: BookOpen,
      shortcut: "?",
      action: () => {
        onOpenGuide?.();
      },
    },
    {
      id: "act-theme-system",
      category: "Aksi & Alat",
      title: "Tema: Ikuti Sistem (Otomatis)",
      description: "Menyesuaikan otomatis dengan mode gelap/terang OS",
      icon: Laptop,
      action: () => setTheme("system"),
    },
    {
      id: "act-theme-light",
      category: "Aksi & Alat",
      title: "Tema: Mode Terang",
      description: "Beralih ke tampilan latar putih terang bersih",
      icon: Sun,
      action: () => setTheme("light"),
    },
    {
      id: "act-theme-dark",
      category: "Aksi & Alat",
      title: "Tema: Mode Gelap",
      description: "Beralih ke tampilan latar gelap kontras tinggi",
      icon: Moon,
      action: () => setTheme("dark"),
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      (cmd.shortcut && cmd.shortcut.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev === 0 ? Math.max(0, filteredCommands.length - 1) : prev - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette Dialog */}
      <div
        className="relative w-full max-w-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 text-zinc-900 dark:text-zinc-100 animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari halaman, alat, atau ketik aksi cepat..."
            className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-400">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-mono text-[10px]">
                ESC
              </kbd>
              <span>untuk batal</span>
            </div>
          )}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-80 overflow-y-auto p-2 space-y-1 divide-y divide-zinc-100 dark:divide-zinc-850"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
              Tidak ada hasil untuk "{query}"
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = selectedIndex === idx;

              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition text-xs select-none ${
                    isSelected
                      ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white"
                      : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
                        isSelected
                          ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                          : "bg-zinc-100 dark:bg-zinc-850 text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate text-zinc-900 dark:text-zinc-100">
                          {cmd.title}
                        </span>
                        {cmd.category === "Aksi & Alat" && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            Aksi
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {cmd.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {cmd.shortcut && (
                      <kbd className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-mono text-[10px]">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    {isSelected && (
                      <ArrowRight className="w-3 h-3 text-indigo-500" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Hint Badges */}
        <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-[10px]">
                ↑↓
              </kbd>
              <span>Navigasi</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-[10px]">
                ↵
              </kbd>
              <span>Pilih</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-400">Tema aktif:</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300 capitalize">
              {theme === "system" ? `Sistem (${resolvedTheme})` : theme}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
