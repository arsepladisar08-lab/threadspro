import React, { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  Sparkles,
  Zap,
  Target,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Clock,
  Tag,
  Share2,
  Key,
  Keyboard,
  Command,
} from "lucide-react";

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction?: (path: string) => void;
  initialTab?: "workflow" | "algorithm" | "features" | "tips" | "shortcuts";
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
  initialTab = "workflow",
}) => {
  const [activeTab, setActiveTab] = useState<
    "workflow" | "algorithm" | "features" | "tips" | "shortcuts"
  >(initialTab);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Tutup dengan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Floating Dialog Container */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] text-zinc-900 dark:text-zinc-100 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                  Panduan & Pintasan Keyboard
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400">
                  v1.2
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Kuasai alur kerja cepat, kaidah algoritma Threads, dan kontrol keyboard
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition cursor-pointer"
            aria-label="Tutup panduan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation & Search */}
        <div className="px-4 pt-3 pb-2 border-b border-zinc-200 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "workflow", label: "Alur Cepat", icon: Sparkles },
              { id: "shortcuts", label: "Pintasan Keyboard", icon: Keyboard },
              { id: "algorithm", label: "Kaidah Algoritma", icon: Zap },
              { id: "features", label: "Fitur Lengkap", icon: Target },
              { id: "tips", label: "Tips Anti-Bait", icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-zinc-900 text-white dark:bg-zinc-800 dark:text-white shadow-xs"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-400" : ""}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[160px] sm:w-48">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kata kunci..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 focus:outline-hidden focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm leading-relaxed">
          {/* TAB: SHORTCUTS (Daftar Pintasan Keyboard) */}
          {activeTab === "shortcuts" && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-300 flex items-center gap-3">
                <Keyboard className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>
                  Gunakan pintasan keyboard berikut untuk bernavigasi dan membuat utas jauh lebih cepat tanpa perlu menyentuh mouse.
                </span>
              </div>

              {/* Kategori 1: Global & Kontrol */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  1. Kontrol Aplikasi Global
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-zinc-900 dark:text-white">
                        Command Palette / Cari
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Buka pencarian cepat menu & aksi
                      </div>
                    </div>
                    <kbd className="px-2 py-1 rounded-md bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono text-xs font-semibold shadow-2xs">
                      ⌘ + K / Ctrl + K
                    </kbd>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-zinc-900 dark:text-white">
                        Buka / Tutup Sidebar
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Toggle bilah sisi desktop
                      </div>
                    </div>
                    <kbd className="px-2 py-1 rounded-md bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono text-xs font-semibold shadow-2xs">
                      ⌘ + B / Ctrl + B
                    </kbd>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-zinc-900 dark:text-white">
                        Buka Panduan & Shortcut
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Tampilkan dialog modal bantuan ini
                      </div>
                    </div>
                    <kbd className="px-2 py-1 rounded-md bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono text-xs font-semibold shadow-2xs">
                      ? atau Shift + /
                    </kbd>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-zinc-900 dark:text-white">
                        Tutup Modal / Popup
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Batalkan dialog atau drawer aktif
                      </div>
                    </div>
                    <kbd className="px-2 py-1 rounded-md bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono text-xs font-semibold shadow-2xs">
                      Esc
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Kategori 2: Navigasi Halaman Cepat */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  2. Navigasi Cepat Antar Halaman
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      1. Generator Utas
                    </span>
                    <kbd className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-xs font-semibold shadow-2xs">
                      Alt + 1
                    </kbd>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      2. Kalender Jadwal
                    </span>
                    <kbd className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-xs font-semibold shadow-2xs">
                      Alt + 2
                    </kbd>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      3. Cek Utas & Anti-Bait
                    </span>
                    <kbd className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-xs font-semibold shadow-2xs">
                      Alt + 3
                    </kbd>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      4. Balas Komentar
                    </span>
                    <kbd className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-xs font-semibold shadow-2xs">
                      Alt + 4
                    </kbd>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      5. Metrik Algoritma
                    </span>
                    <kbd className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-xs font-semibold shadow-2xs">
                      Alt + 5
                    </kbd>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      6. Link Lab (YouTube)
                    </span>
                    <kbd className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-xs font-semibold shadow-2xs">
                      Alt + 6
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Kategori 3: Editor Generator Utas */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  3. Editor Generator Utas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-zinc-900 dark:text-white">
                        Fusi Ide & Rilis 3 Varian
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Trigger pembuatan dari kolom teks ide
                      </div>
                    </div>
                    <kbd className="px-2 py-1 rounded-md bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono text-xs font-semibold shadow-2xs">
                      ⌘ + Enter / Ctrl + Enter
                    </kbd>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-zinc-900 dark:text-white">
                        Salin Semua Post Varian
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Salin seluruh konten varian yang aktif
                      </div>
                    </div>
                    <kbd className="px-2 py-1 rounded-md bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono text-xs font-semibold shadow-2xs">
                      ⌘ + Shift + C
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: ALUR CEPAT */}
          {activeTab === "workflow" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 space-y-3">
                <h3 className="font-bold text-zinc-900 dark:text-white text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-black">
                    1
                  </span>
                  <span>Input Ide Kasar & Fakta Otentik</span>
                </h3>
                <p className="text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed pl-7">
                  Masukkan keresahan, cerita observasi, atau uneg-uneg harian Anda di menu <strong>Generator</strong>. 
                  Jika memiliki angka riil (seperti nominal omzet, pengeluaran kopi, waktu belajar), isi di kolom fakta asli. 
                  Jika belum ada angka, AI otomatis menyematkan placeholder aman <code className="text-indigo-600 dark:text-indigo-300 px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800">[ISI: ...]</code> agar terbebas dari mengarang data.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 space-y-3">
                <h3 className="font-bold text-zinc-900 dark:text-white text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-black">
                    2
                  </span>
                  <span>Fusi Pola Teruji dari Bank Referensi</span>
                </h3>
                <p className="text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed pl-7">
                  Sistem mengekstrak Idea DNA Anda dan memadukannya dengan 3 pola teratas dari <strong>Bank Referensi Threads</strong> (2 relevan niche, 1 cross-niche untuk variasi perspektif). 
                  Hasilnya: 3 varian utas siap pakai dengan sudut pandang unik tanpa menyalin teks asli orang lain.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 space-y-3">
                <h3 className="font-bold text-zinc-900 dark:text-white text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-black">
                    3
                  </span>
                  <span>Jadwalkan atau Publikasikan Otomatis</span>
                </h3>
                <p className="text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed pl-7">
                  Pilih varian terbaik, sesuaikan teks jika diperlukan, lalu klik <strong>Terbitkan Sekarang</strong> atau jadwalkan di <strong>Kalender</strong> sesuai jam rekomendasi WIB algoritma.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: KAIDAH ALGORITMA */}
          {activeTab === "algorithm" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Disukai Algoritma Threads</span>
                  </div>
                  <ul className="text-xs text-zinc-600 dark:text-zinc-300 space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li>Diskusi dua arah di kolom komentar (sinyal reply berantai).</li>
                    <li>Konten yang disimpan (Save) dan dibagikan (Repost/Share).</li>
                    <li>Penggunaan satu Topik Tag (#) yang relevan & presisi.</li>
                    <li>Post bersambung (utas 3-5 post) dengan struktur logis.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-300 text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>Dihukum / Ditekan Jangkauannya</span>
                  </div>
                  <ul className="text-xs text-zinc-600 dark:text-zinc-300 space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li>Engagement-bait (misal: "Ketik 'MAU' di komen ya").</li>
                    <li>Menaruh tautan eksternal di post pembuka (Post #1).</li>
                    <li>Spam tagar (menumpuk lebih dari 1 tagar topik).</li>
                    <li>Postingan agresif beruntun dalam jeda &lt;30 menit.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FITUR LENGKAP */}
          {activeTab === "features" && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 space-y-1">
                <div className="font-bold text-xs text-zinc-900 dark:text-white">Generator Utas Multi-Varian</div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Menghasilkan 3 varian utas lengkap dengan Hook, Body, CTA percakapan, Reply #2 (link eksternal), dan tagar topik resmi.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 space-y-1">
                <div className="font-bold text-xs text-zinc-900 dark:text-white">Cek Utas & Anti-Bait Validator</div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Audit keamanan naskah utas sebelum tayang: deteksi engagement-bait, tautan luar di post #1, serta scoring ramah algoritma.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 space-y-1">
                <div className="font-bold text-xs text-zinc-900 dark:text-white">Kalender & Autopilot Scheduler</div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Penyusunan jadwal otomatis pada jam tayang prima Indonesia (Pagi 07:00, Siang 12:00, Sore 17:00, Malam 20:00 WIB).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 space-y-1">
                <div className="font-bold text-xs text-zinc-900 dark:text-white">Integrasi Threads & Quota Monitor</div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Pantau batas 25 post/24 jam Meta Threads dan kelola kredensial akun langsung di Pengaturan Profil.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: TIPS ANTI-BAIT */}
          {activeTab === "tips" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-300 text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>DILARANG: Memancing Komentar Paksa (Engagement-Bait)</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Hindari kalimat seperti <em>"Ketik 'MAU' nanti dikirimin PDF via DM"</em> atau <em>"Like dan repost jika setuju"</em>. Algoritma Meta secara agresif mendeteksi frasa pancingan ini dan menurunkan visibilitas akun Anda secara permanen.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>DIANJURKAN: Pertanyaan Bermakna di Akhir Post</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Gunakan pertanyaan pemantik yang mengajak berbagi pengalaman nyata: <em>"Lo sendiri lebih milih cara A atau B pas ngalamin situasi ini?"</em> atau <em>"Kalo lo di posisi gue, apa hal pertama yang bakal lo evaluasi?"</em>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-500/20 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-indigo-800 dark:text-indigo-300 text-xs">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Tips Mengisi Placeholder [ISI: ...]</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Jika hasil AI memunculkan teks seperti <code className="text-indigo-600 dark:text-indigo-300 font-mono">[ISI: nominal pengeluaran]</code>, gantilah dengan angka nyata Anda sebelum memposting. Jangan biarkan placeholder mentah terunggah ke publik.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                <span>Punya API Key Gemini pribadi? Pasang untuk kecepatan tak terbatas.</span>
                <button
                  onClick={() => {
                    onClose();
                    if (onSelectAction) onSelectAction("/profil?tab=api");
                  }}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                >
                  Buka Pengaturan API →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/30 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span className="hidden sm:inline">
            Tips: Tekan <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-mono">Esc</kbd> untuk menutup kapan saja.
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 font-semibold transition cursor-pointer"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
