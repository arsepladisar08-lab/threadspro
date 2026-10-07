import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { UserProfile, NicheType, ToneType } from "../types";
import { storage } from "../lib/storage";
import { User, Save, CheckCircle2, Download, Upload, AlertCircle, Sparkles, Key, Link2, Unlink, ArrowRight } from "lucide-react";
import { threadsClient, ThreadsAccount } from "../services/threadsClient";
import { ThreadsConnectModal } from "../components/ThreadsConnectModal";

const NICHES: { label: NicheType; desc: string; mode: "umum" | "hub" }[] = [
  { label: "Keuangan", desc: "Tips anti-teori, kesalahan finansial, budgeting, investasi real", mode: "umum" },
  { label: "Self-Improvement", desc: "Daftar brutal jujur, rutinitas realistis, self-callout", mode: "umum" },
  { label: "Humor/Relatable", desc: "Observasi IG vs Threads, meme teks, absurditas warga", mode: "umum" },
  { label: "Curhat/Storytelling", desc: "Utas kronologis, drama kantor, rumah tangga, twist nyata", mode: "umum" },
  { label: "Bisnis & UMKM", desc: "Behind the scenes omzet, kesalahan pemula, tips jualan organik", mode: "umum" },
  { label: "Teknologi", desc: "Hot take AI, perbandingan tools gratis vs berbayar", mode: "umum" },
  { label: "Kesehatan Mental", desc: "Validasi emosi, pencegah burnout, ruang aman tanpa diagnosa", mode: "umum" },
  { label: "Parenting", desc: "Dinamika anak & pasangan, chat polos, realita rumah tangga", mode: "umum" },
  { label: "Hub: Ilmu Praktis", desc: "Micro-learning 5 menit, 1 rumus + contoh langsung praktek", mode: "hub" },
  { label: "Hub: Peluang", desc: "Side hustle, loker remote jujur, kolaborasi freelance", mode: "hub" },
  { label: "Hub: Panggung Warga", desc: "Lapak mingguan UMKM, spotlight warga, review jasa", mode: "hub" },
  { label: "Hub: Soft-selling Produk Digital", desc: "Cerita solusi masalah pribadi berujung template / e-book", mode: "hub" },
];

const TONES: { label: ToneType; name: string; example: string }[] = [
  { label: "santai", name: "Santai (Gue-Lo / Aku-Kamu)", example: "Gue baru sadar hal sepele ini..." },
  { label: "jujur", name: "Brutal Jujur / Reflektif", example: "Jujur, kesalahan terbesar gue adalah..." },
  { label: "lucu", name: "Humoris & Relatable", example: "Buka dompet isinya cuma doa restu..." },
  { label: "edukatif", name: "Edukatif Terstruktur", example: "Rumus 3 langkah praktis yang bisa dicoba hari ini:" },
];

export const ProfilePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isOnboardingMode = searchParams.get("onboarding") === "true";

  const [profile, setProfile] = useState<UserProfile>({
    id: "user_default",
    niche: "Keuangan",
    targetAudience: "Fresh graduate & karyawan muda usia 21-30 yang kesulitan menabung",
    tone: "santai",
    productsServices: "",
    pastPostSamples: ["", "", ""],
    forbiddenTopics: ["politik praktis", "gosip artis", "pinjol ilegal"],
    modePreference: "umum",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [threadsAccount, setThreadsAccount] = useState<ThreadsAccount | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    storage.getProfile().then((data) => {
      if (data) setProfile(data);
    });
    threadsClient.getAccount().then(setThreadsAccount);
  }, []);

  const handleDisconnectThreads = async () => {
    await threadsClient.disconnectAccount();
    setThreadsAccount(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { ...profile, updatedAt: Date.now() };
    await storage.saveProfile(updated);
    await storage.setOnboardingCompleted(true);
    setProfile(updated);
    setSavedSuccess(true);
    if (isOnboardingMode) {
      setTimeout(() => {
        navigate("/?welcome=true");
      }, 1200);
    } else {
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleExport = async () => {
    const jsonStr = await storage.exportAllData();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `autothreads-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const success = await storage.importAllData(content);
      if (success) {
        setImportStatus("Data berhasil dipulihkan!");
        const fresh = await storage.getProfile();
        if (fresh) setProfile(fresh);
      } else {
        setImportStatus("Gagal membaca file JSON backup.");
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-5 md:px-6 py-6 sm:py-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <User className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">Profil & Niche Akun</h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Konfigurasi niche, target audiens, dan gaya bahasa ini menjadi pedoman utama AI dalam meracik utas.
          </p>
        </div>

        {/* Backup Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition"
            title="Download cadangan JSON semua riwayat & data"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ekspor JSON</span>
          </button>

          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Impor JSON</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {importStatus && (
        <div className="mb-6 p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-indigo-400" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Onboarding Mode Step 2 Banner */}
      {isOnboardingMode && (
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-zinc-900 border border-indigo-500/40 text-white space-y-3 shadow-lg shadow-indigo-950/30">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Langkah 2 dari 2: Personalisasi Karakter & Niche AI
            </span>
            <span className="text-xs text-emerald-400 font-mono font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Akun Threads Terhubung
            </span>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Lengkapi Niche & Persona Akun Anda
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mt-1">
              AutoThreads membutuhkan informasi niche dan gaya bahasa ini agar AI dapat menyusun draf utas yang autentik dan bernada alami bagi audiens Anda. Klik tombol <strong>Simpan & Buka Akses Semua Tools</strong> di bawah setelah selesai.
            </p>
          </div>
        </div>
      )}

      {savedSuccess && (
        <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Profil berhasil disimpan ke penyimpanan lokal perangkat Anda.</span>
        </div>
      )}

      {/* Threads Official Account Connection Card */}
      <div className="mb-8 p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {threadsAccount ? (
              <img
                src={threadsAccount.threads_profile_picture_url}
                alt={threadsAccount.username}
                className="w-12 h-12 rounded-full border border-neutral-700 object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg">
                @
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {threadsAccount ? `@${threadsAccount.username}` : "Koneksi Akun Threads Asli"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    threadsAccount
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {threadsAccount ? "Terhubung (Resmi)" : "Belum Terhubung"}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {threadsAccount
                  ? `${threadsAccount.name} • Token aktif untuk publikasi dan metrik`
                  : "Gunakan Token Akses Meta atau Login OAuth untuk memposting utas langsung ke Threads."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {threadsAccount ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
                >
                  Ganti Token
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectThreads}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 transition"
                >
                  Putuskan
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Hubungkan Akun Threads</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Pilih Niche Utama */}
        <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">1. Pilih Niche Konten Anda</h3>
            <span className="text-[11px] text-neutral-400">12 Pilar Pola Tersedia</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {NICHES.map((item) => {
              const isSelected = profile.niche === item.label;
              return (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => setProfile({ ...profile, niche: item.label, modePreference: item.mode })}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-indigo-600/15 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/30"
                      : "bg-neutral-950/60 border-neutral-800/80 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{item.label}</span>
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                        item.mode === "hub"
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          : "bg-neutral-800 text-neutral-400"
                      }`}
                    >
                      {item.mode === "hub" ? "Hub Kreator" : "Umum"}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug line-clamp-2">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Audiens & Tone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Target Audiens */}
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">2. Siapa Target Audiensmu?</h3>
            <p className="text-xs text-neutral-400">
              Jelaskan rentang usia, profesi, atau keresahan utama pembaca yang ingin lo rangkul.
            </p>
            <textarea
              rows={3}
              value={profile.targetAudience}
              onChange={(e) => setProfile({ ...profile, targetAudience: e.target.value })}
              className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-indigo-500 transition"
              placeholder="Contoh: Karyawan 20-an tahun yang pengen punya side-income tanpa modal besar..."
            />
          </div>

          {/* Tone Suara */}
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">3. Tone & Gaya Bicara</h3>
            <p className="text-xs text-neutral-400">Pilih karakter tulisan yang paling pas dengan citra akun lo.</p>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map((t) => {
                const isSelected = profile.tone === t.label;
                return (
                  <button
                    type="button"
                    key={t.label}
                    onClick={() => setProfile({ ...profile, tone: t.label })}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      isSelected
                        ? "bg-indigo-600/15 border-indigo-500 text-white"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{t.name}</div>
                    <div className="text-[10px] text-neutral-400 italic mt-0.5 truncate">"{t.example}"</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Produk / Jasa & Larangan Topik */}
        <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">4. Penawaran & Batasan Konten</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Produk / Jasa yang Lo Punya (Opsional):
              </label>
              <input
                type="text"
                value={profile.productsServices || ""}
                onChange={(e) => setProfile({ ...profile, productsServices: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-600 focus:outline-hidden focus:border-indigo-500"
                placeholder="Contoh: Template Notion Finansial Rp49rb, Jasa Web Design"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">
                Digunakan AI saat meracik konten berlabel Konversi atau Soft-selling di reply ke-2.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Topik yang Pantang / Dilarang Disebut:
              </label>
              <input
                type="text"
                value={(profile.forbiddenTopics || []).join(", ")}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    forbiddenTopics: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-600 focus:outline-hidden focus:border-indigo-500"
                placeholder="Pisahkan dengan koma: politik, drama seleb, pinjol"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">
                AI akan secara ketat memblokir topik-topik sensitif ini.
              </span>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {isOnboardingMode ? (
            <p className="text-xs text-zinc-400">
              Setelah menyimpan profil, seluruh fitur dan tools AutoThreads akan langsung terbuka.
            </p>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {savedSuccess && isOnboardingMode && (
              <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Membuka akses tools...
              </span>
            )}
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>
                {isOnboardingMode
                  ? "Simpan & Buka Akses Semua Tools →"
                  : "Simpan Pengaturan Profil"}
              </span>
            </button>
          </div>
        </div>
      </form>

      {/* Threads Connect Modal */}
      <ThreadsConnectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnected={(acc) => {
          setThreadsAccount(acc);
        }}
      />
    </div>
  );
};
