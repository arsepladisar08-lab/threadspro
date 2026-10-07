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
} from "lucide-react";

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction?: (path: string) => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const [activeTab, setActiveTab] = useState<"workflow" | "algorithm" | "features" | "tips">("workflow");
  const [searchQuery, setSearchQuery] = useState("");

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
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Floating Dialog Container */}
      <div className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] text-zinc-100 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">Panduan Interaktif AutoThreads</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-400">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Kuasai alur pembuatan konten ramah algoritma Threads Indonesia
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition cursor-pointer"
            aria-label="Tutup panduan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation & Search */}
        <div className="px-4 pt-3 pb-2 border-b border-zinc-800/60 bg-zinc-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "workflow", label: "Alur Cepat", icon: Sparkles },
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
                      ? "bg-zinc-800 text-white shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
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
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kata kunci..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm leading-relaxed">
          {/* TAB 1: ALUR CEPAT */}
          {activeTab === "workflow" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-black">
                    1
                  </span>
                  <span>Input Ide Kasar & Fakta Otentik</span>
                </h3>
                <p className="text-zinc-300 text-xs leading-relaxed pl-7">
                  Masukkan keresahan, cerita observasi, atau uneg-uneg harian Anda di menu <strong>Generator</strong>. 
                  Jika memiliki angka riil (seperti nominal omzet, pengeluaran kopi, waktu belajar), isi di kolom fakta asli. 
                  Jika belum ada angka, AI otomatis menyematkan placeholder aman <code className="text-indigo-300 px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800">[ISI: ...]</code> agar terbebas dari mengarang data.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-black">
                    2
                  </span>
                  <span>Fusi Pola Teruji dari Bank Referensi</span>
                </h3>
                <p className="text-zinc-300 text-xs leading-relaxed pl-7">
                  Sistem mengekstrak Idea DNA Anda dan memadukannya dengan 3 pola teratas dari <strong>Bank Referensi Threads</strong> (2 relevan niche, 1 cross-niche untuk variasi perspektif). 
                  Hasilnya: 3 varian utas siap pakai dengan sudut pandang unik tanpa menyalin teks asli orang lain.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-black">
                    3
                  </span>
                  <span>Posting & Optimalkan 30 Menit Pertama</span>
                </h3>
                <p className="text-zinc-300 text-xs leading-relaxed pl-7">
                  Salin draf bersih atau publish langsung ke akun Threads Anda via Meta Graph API resmi. 
                  Gunakan rekomendasi jam tayang terbaik (WIB) dan ikuti rencana aksi 30 menit awal untuk memicu laju balasan (reply velocity).
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    onClose();
                    if (onSelectAction) onSelectAction("/");
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  <span>Mulai Buat Utas Sekarang</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: KAIDAH ALGORITMA */}
          {activeTab === "algorithm" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                    <Tag className="w-4 h-4 text-indigo-400" />
                    <span>1 Topic Tag Resmi (Tanpa #)</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Di Threads, fitur Tag resmi menggantikan hashtag kuno (#). Gunakan tepat 1 tag relevan seperti <strong className="text-zinc-200">"Keuangan Pribadi"</strong> atau <strong className="text-zinc-200">"Cerita UMKM"</strong>. Memakai tanda pagar (#) justru dinilai spam oleh sistem kurasi.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Tautan di Reply Ke-2</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Algoritma Threads mendowngrade jangkauan postingan pertama yang berisi tautan eksternal. Simpan link jualan, newsletter, atau form di <strong>Reply ke-2</strong> untuk menjaga jangkauan post utama tetap maksimal.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>Velocity 30 Menit Pertama</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Balasan di 30-60 menit awal memiliki bobot setara dengan post baru. Kreator yang aktif membalas balik komentar awal dengan pertanyaan pemantik akan didorong ke feed "For You" warga lainnya.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 text-sky-300 font-bold text-xs">
                    <MessageSquare className="w-4 h-4 text-sky-400" />
                    <span>Reply Depth &gt; Likes</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Komentar yang berbalas (conversation depth &ge; 2 lapis) menandakan konten memicu diskusi nyata. Hindari sekadar balasan "terima kasih" satu arah. Gunakan asisten balas komen untuk memperdalam percakapan.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-xs text-zinc-400 flex items-center justify-between">
                <span>Ingin menguji kepatuhan draf Anda sebelum posting?</span>
                <button
                  onClick={() => {
                    onClose();
                    if (onSelectAction) onSelectAction("/cek");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition text-xs cursor-pointer"
                >
                  Buka Cek Utas →
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: FITUR LENGKAP */}
          {activeTab === "features" && (
            <div className="space-y-3">
              {[
                {
                  title: "Generator Utas (Idea Fusion)",
                  desc: "Ubah ide kasar menjadi 3 varian utas siap posting dengan jejak fusi referensi teruji.",
                  path: "/",
                },
                {
                  title: "Kalender Konten Mingguan",
                  desc: "Rencana posting 7-14 hari terjadwal dengan target reply harian & ekspor langsung ke .ics.",
                  path: "/kalender",
                },
                {
                  title: "Cek Utas & Audit Kepatuhan",
                  desc: "Audit cepat anti-engagement bait, batas karakter 500, posisi link, dan deteksi pelanggaran.",
                  path: "/cek",
                },
                {
                  title: "Asisten Balas Komentar",
                  desc: "Hasilkan 3 opsi balasan cerdas untuk membangun reply depth dan kedekatan emosional warga.",
                  path: "/balas",
                },
                {
                  title: "Ulas Utas Viral (Reverse Engineer)",
                  desc: "Bedah psikologi di balik utas orang lain yang ramai untuk dipelajari polanya secara etis.",
                  path: "/ulas",
                },
                {
                  title: "Bank Pola Referensi",
                  desc: "Katalog pola hook, formula alur emosi, dan arsip referensi dengan tingkatan provenance A-E.",
                  path: "/bank",
                },
                {
                  title: "Pengaturan Kunci API (Gemini & Threads)",
                  desc: "Input Kunci Google Gemini mandiri untuk batas kuota independen, dan hubungkan token resmi Meta Threads.",
                  path: "/admin/api-lab",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">{item.title}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      if (onSelectAction) onSelectAction(item.path);
                    }}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition shrink-0 cursor-pointer"
                    title={`Buka ${item.title}`}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: TIPS ANTI-BAIT */}
          {activeTab === "tips" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-rose-300 text-xs">
                    <X className="w-4 h-4 text-rose-400" />
                    <span>DILARANG: Engagement Bait Murahan</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Hindari kalimat seperti <em>"Ketik 'MAU' nanti dikirimin PDF via DM"</em> atau <em>"Like dan repost jika setuju"</em>. Algoritma Meta secara agresif mendeteksi frasa pancingan ini dan menurunkan visibilitas akun Anda secara permanen.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-emerald-300 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>DIANJURKAN: Pertanyaan Bermakna di Akhir Post</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Gunakan pertanyaan pemantik yang mengajak berbagi pengalaman nyata: <em>"Lo sendiri lebih milih cara A atau B pas ngalamin situasi ini?"</em> atau <em>"Kalo lo di posisi gue, apa hal pertama yang bakal lo evaluasi?"</em>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-indigo-300 text-xs">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Tips Mengisi Placeholder [ISI: ...]</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Jika hasil AI memunculkan teks seperti <code className="text-indigo-300">[ISI: nominal pengeluaran]</code>, gantilah dengan angka nyata Anda sebelum memposting. Jangan biarkan placeholder mentah terunggah ke publik.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
                <span>Punya API Key Gemini pribadi? Pasang untuk kecepatan tak terbatas.</span>
                <button
                  onClick={() => {
                    onClose();
                    if (onSelectAction) onSelectAction("/admin/api-lab");
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold underline cursor-pointer"
                >
                  Buka Pengaturan API →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-zinc-800/80 bg-zinc-900/30 flex items-center justify-between text-xs text-zinc-400">
          <span className="hidden sm:inline">Tips: Tekan <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">Esc</kbd> untuk menutup kapan saja.</span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition cursor-pointer"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
