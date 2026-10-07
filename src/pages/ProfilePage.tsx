import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { UserProfile, NicheType, ToneType } from "../types";
import { storage } from "../lib/storage";
import { User, Save, CheckCircle2, Download, Upload, AlertCircle, Sparkles, Key, Link2, Unlink } from "lucide-react";
import { threadsClient, ThreadsAccount } from "../services/threadsClient";
import { ThreadsConnectModal } from "../components/ThreadsConnectModal";
import { GeminiKeySettings } from "../components/GeminiKeySettings";

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
  { label: "santai", name: "Santai (Gue-Lo / Kasual)", example: "Gue baru sadar hal sepele ini..." },
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
      }, 1000);
    } else {
      setTimeout(() => setSavedSuccess(false), 2500);
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
        setImportStatus("Data profil dan antrean berhasil dipulihkan.");
        const fresh = await storage.getProfile();
        if (fresh) setProfile(fresh);
      } else {
        setImportStatus("Gagal membaca file JSON backup.");
      }
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-28 space-y-6">
      {/* Calm Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
            Profil & Karakter Akun
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Konfigurasi niche, target pembaca, dan gaya bahasa sebagai panduan persona generator AI.
          </p>
        </div>

        {/* Backup Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 transition cursor-pointer"
            title="Download cadangan JSON semua data"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Ekspor JSON</span>
          </button>

          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 transition cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            <span>Impor JSON</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {importStatus && (
        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-zinc-400" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Onboarding Mode Step 2 Banner */}
      {isOnboardingMode && (
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-700 bg-zinc-900/60 text-zinc-100 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zinc-800 text-zinc-200 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Langkah 2: Niche & Karakter Akun
            </span>
            <span className="text-xs text-emerald-400 font-mono font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Akun Threads Terhubung
            </span>
          </div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Tentukan Niche & Persona Konten Anda
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            AutoThreads menyesuaikan perbendaharaan kata dan sudut pandang draf berdasarkan pengaturan ini. Klik tombol <strong>Simpan & Buka Akses Tools</strong> di bawah setelah selesai.
          </p>
        </div>
      )}

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-zinc-900 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Pengaturan profil berhasil disimpan.</span>
        </div>
      )}

      {/* Threads Account Connection Card */}
      <div className="p-4 sm:p-5 rounded-2xl border border-zinc-900 bg-zinc-900/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {threadsAccount ? (
              threadsAccount.threads_profile_picture_url ? (
                <img
                  src={threadsAccount.threads_profile_picture_url}
                  alt={threadsAccount.username}
                  className="w-10 h-10 rounded-full border border-zinc-800 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-200 flex items-center justify-center font-bold text-sm">
                  @
                </div>
              )
            ) : (
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-sm">
                @
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-100">
                  {threadsAccount ? `@${threadsAccount.username}` : "Koneksi Akun Threads"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${
                    threadsAccount
                      ? "bg-zinc-800 text-zinc-200 border border-zinc-700"
                      : "bg-zinc-900 text-zinc-500 border border-zinc-850"
                  }`}
                >
                  {threadsAccount ? "Terhubung" : "Belum Terhubung"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {threadsAccount
                  ? `${threadsAccount.name || threadsAccount.username} · Token aktif untuk publikasi dan sinkronisasi`
                  : "Hubungkan akun Threads Anda untuk mengaktifkan fitur publikasi langsung dan jadwal otomatis."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {threadsAccount ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 transition cursor-pointer"
                >
                  Ganti Token
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectThreads}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition cursor-pointer"
                >
                  Putuskan
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-950 transition cursor-pointer shadow-xs"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Hubungkan Akun</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Kunci Google Gemini API Mandiri Card */}
      <GeminiKeySettings />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Niche Selection */}
        <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-900/20 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <h2 className="font-semibold text-zinc-200 uppercase tracking-wider text-[11px]">
              1. Pilih Niche Utama
            </h2>
            <span className="text-zinc-500 font-mono text-[11px]">12 Pilar Tersedia</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {NICHES.map((item) => {
              const isSelected = profile.niche === item.label;
              return (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => setProfile({ ...profile, niche: item.label, modePreference: item.mode })}
                  className={`text-left p-3 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? "bg-zinc-900 border-zinc-600 text-zinc-100"
                      : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800 hover:text-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-zinc-200">{item.label}</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                        item.mode === "hub"
                          ? "bg-zinc-850 text-zinc-300"
                          : "bg-zinc-900 text-zinc-500"
                      }`}
                    >
                      {item.mode === "hub" ? "Hub" : "Umum"}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-snug line-clamp-2">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Audiens & Tone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Target Audiens */}
          <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-900/20 space-y-2.5">
            <h2 className="font-semibold text-zinc-200 uppercase tracking-wider text-[11px]">
              2. Target Audiens
            </h2>
            <p className="text-[11px] text-zinc-400">
              Rentang usia, latar belakang, atau keresahan utama pembaca yang ingin Anda rangkul.
            </p>
            <textarea
              rows={3}
              value={profile.targetAudience}
              onChange={(e) => setProfile({ ...profile, targetAudience: e.target.value })}
              className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-zinc-600 leading-relaxed transition"
              placeholder="Contoh: Karyawan muda usia 20-30 tahun yang ingin belajar mengelola keuangan tanpa rasa dihakimi..."
            />
          </div>

          {/* Tone Suara */}
          <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-900/20 space-y-2.5">
            <h2 className="font-semibold text-zinc-200 uppercase tracking-wider text-[11px]">
              3. Karakter Suara & Nada Bicara
            </h2>
            <p className="text-[11px] text-zinc-400">Pilih gaya bertutur yang paling sesuai dengan citra akun Anda.</p>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map((t) => {
                const isSelected = profile.tone === t.label;
                return (
                  <button
                    type="button"
                    key={t.label}
                    onClick={() => setProfile({ ...profile, tone: t.label })}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? "bg-zinc-900 border-zinc-600 text-zinc-100"
                        : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800 hover:text-zinc-300"
                    }`}
                  >
                    <div className="text-xs font-semibold text-zinc-200">{t.name}</div>
                    <div className="text-[10px] text-zinc-500 italic mt-0.5 truncate">"{t.example}"</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Produk & Larangan Topik */}
        <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-900/20 space-y-4">
          <h2 className="font-semibold text-zinc-200 uppercase tracking-wider text-[11px]">
            4. Penawaran & Batasan Konten
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-medium text-zinc-300">
                Produk / Jasa yang Anda Miliki (Opsional):
              </label>
              <input
                type="text"
                value={profile.productsServices || ""}
                onChange={(e) => setProfile({ ...profile, productsServices: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-zinc-600"
                placeholder="Contoh: Template Notion Finansial, Jasa Desain Grafis"
              />
              <span className="text-[10px] text-zinc-500 block">
                Disertakan AI saat menyusun CTA di reply #2 pada konten bertipe konversi.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block font-medium text-zinc-300">
                Topik yang Dilarang (Filter AI):
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
                className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-zinc-600"
                placeholder="Pisahkan dengan koma: politik praktis, gosip artis, pinjol ilegal"
              />
              <span className="text-[10px] text-zinc-500 block">
                AI akan secara ketat memblokir topik-topik sensitif ini dari seluruh draf.
              </span>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {isOnboardingMode ? (
            <p className="text-xs text-zinc-400">
              Setelah menyimpan profil, seluruh fitur dan tools AutoThreads akan langsung aktif.
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-950 transition cursor-pointer shadow-xs active:scale-[0.99]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                {isOnboardingMode
                  ? "Simpan & Buka Akses Tools →"
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
