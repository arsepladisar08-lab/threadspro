import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { UserProfile, NicheType, ToneType } from "../types";
import { storage } from "../lib/storage";
import {
  User,
  Save,
  CheckCircle2,
  Download,
  Upload,
  AlertCircle,
  Sparkles,
  Key,
  ShieldCheck,
  Terminal,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sliders,
  ExternalLink,
} from "lucide-react";
import {
  threadsClient,
  ThreadsAccount,
  QuotaState,
  ThreadsPostData,
} from "../services/threadsClient";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isOnboardingMode = searchParams.get("onboarding") === "true";

  // Tab State: persona | api | lab
  const [activeTab, setActiveTab] = useState<"persona" | "api" | "lab">("persona");

  // Profile Form State
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

  // Threads Account & API Lab States
  const [threadsAccount, setThreadsAccount] = useState<ThreadsAccount | null>(null);
  const [quota, setQuota] = useState<QuotaState | null>(null);
  const [posts, setPosts] = useState<ThreadsPostData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Threads Credentials Form State
  const [threadsTokenInput, setThreadsTokenInput] = useState("");
  const [showThreadsToken, setShowThreadsToken] = useState(false);
  const [threadsAppIdInput, setThreadsAppIdInput] = useState("");
  const [threadsAppSecretInput, setThreadsAppSecretInput] = useState("");
  const [threadsSaveNotice, setThreadsSaveNotice] = useState<string | null>(null);
  const [isTestingThreads, setIsTestingThreads] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // API Inspector State
  const [activeEndpoint, setActiveEndpoint] = useState<string>("user_profile");
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [isLoadingEndpoint, setIsLoadingEndpoint] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  // Sync tab with URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "api") {
      setActiveTab("api");
    } else if (tabParam === "lab") {
      setActiveTab("lab");
    } else if (tabParam === "persona") {
      setActiveTab("persona");
    }
  }, [searchParams]);

  const switchTab = (t: "persona" | "api" | "lab") => {
    setActiveTab(t);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (t === "persona") {
          next.delete("tab");
        } else {
          next.set("tab", t);
        }
        return next;
      },
      { replace: true }
    );
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    storage.getProfile().then((data) => {
      if (data) setProfile(data);
    });

    const acc = await threadsClient.getAccount();
    const q = await threadsClient.getQuotaState();
    const p = await threadsClient.getOwnPosts();
    setThreadsAccount(acc);
    setQuota(q);
    setPosts(p);

    const token = await storage.getThreadsToken();
    if (token) setThreadsTokenInput(token);

    const creds = await storage.getThreadsAppCreds();
    if (creds) {
      if (creds.appId) setThreadsAppIdInput(creds.appId);
      if (creds.appSecret) setThreadsAppSecretInput(creds.appSecret);
    }

    if (acc) {
      setRawResponse({
        endpoint: "GET /me?fields=id,username,name,threads_profile_picture_url,threads_biography",
        status: 200,
        source: "Live Meta Threads Graph API",
        data: acc,
      });
    } else {
      setRawResponse({
        status: "idle",
        message: "Akun Threads belum terhubung. Hubungkan akun Anda untuk melihat respons API nyata.",
      });
    }
  };

  // --- Profile Actions ---
  const handleSaveProfile = async (e: React.FormEvent) => {
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

  // --- Threads Token Actions ---
  const handleSaveThreadsToken = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanToken = threadsTokenInput.trim();
    if (!cleanToken) {
      setThreadsSaveNotice("Token akses Threads tidak boleh kosong.");
      return;
    }
    setIsTestingThreads(true);
    setThreadsSaveNotice("Memverifikasi token ke Meta Threads Graph API...");

    try {
      const acc = await threadsClient.connectWithToken(cleanToken);
      setThreadsAccount(acc);
      await storage.saveThreadsAppCreds({
        appId: threadsAppIdInput.trim() || undefined,
        appSecret: threadsAppSecretInput.trim() || undefined,
      });
      setThreadsSaveNotice(`Berhasil terhubung ke akun Threads @${acc.username}!`);
      loadAllData();
    } catch (err: any) {
      setThreadsSaveNotice(`Gagal: ${err.message}`);
    } finally {
      setIsTestingThreads(false);
      setTimeout(() => setThreadsSaveNotice(null), 4000);
    }
  };

  const handleDisconnectThreads = async () => {
    await threadsClient.disconnectAccount();
    setThreadsAccount(null);
    setPosts([]);
    setThreadsTokenInput("");
    setRawResponse({
      status: "disconnected",
      message: "Akun Threads telah diputuskan dari aplikasi.",
    });
  };

  const handleSyncPosts = async () => {
    if (!threadsAccount) return;
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const refreshed = await threadsClient.fetchThreadsOriginal();
      setPosts(refreshed);
      setSyncStatus(`Berhasil menyinkronkan ${refreshed.length} utas asli dari akun Threads.`);
    } catch (err: any) {
      setSyncStatus(`Gagal sinkronisasi: ${err.message}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  const handleTestEndpoint = async (ep: string) => {
    setActiveEndpoint(ep);
    setIsLoadingEndpoint(true);

    if (!threadsAccount || !threadsAccount.token) {
      setIsLoadingEndpoint(false);
      setRawResponse({
        endpoint: ep,
        error: "Akun Threads belum terhubung.",
        hint: "Silakan masukkan Token Akses pada tab Kunci API terlebih dahulu.",
      });
      return;
    }

    try {
      const token = threadsAccount.token;
      const baseUrl = "https://graph.threads.net/v1.0";

      if (ep === "user_profile") {
        const res = await fetch(
          `${baseUrl}/me?fields=id,username,name,threads_profile_picture_url,threads_biography&access_token=${encodeURIComponent(token)}`
        );
        const data = await res.json();
        setRawResponse({
          endpoint: "GET /me?fields=id,username,name,threads_profile_picture_url,threads_biography",
          status: res.status,
          headers: {
            "x-app-usage": res.headers.get("x-app-usage") || "active",
          },
          data,
        });
      } else if (ep === "user_threads") {
        const fields =
          "id,media_product_type,media_type,media_url,permalink,owner,username,text,timestamp,shortcode,thumbnail_url,children,is_quote_post";
        const res = await fetch(
          `${baseUrl}/me/threads?fields=${fields}&limit=10&access_token=${encodeURIComponent(token)}`
        );
        const data = await res.json();
        setRawResponse({
          endpoint: `GET /me/threads?fields=${fields}&limit=10`,
          status: res.status,
          headers: {
            "x-app-usage": res.headers.get("x-app-usage") || "active",
          },
          data,
        });
      } else if (ep === "insights_snapshots") {
        if (posts.length > 0) {
          const targetPostId = posts[0].id.replace(/^th_/, "");
          const res = await fetch(
            `${baseUrl}/${targetPostId}/insights?metric=views,likes,replies,reposts,quotes&access_token=${encodeURIComponent(token)}`
          );
          const data = await res.json();
          setRawResponse({
            endpoint: `GET /${targetPostId}/insights?metric=views,likes,replies,reposts,quotes`,
            status: res.status,
            data,
          });
        } else {
          setRawResponse({
            endpoint: "GET /{threads-media-id}/insights",
            status: 404,
            message: "Belum ada postingan tersinkronisasi untuk diuji metriknya.",
          });
        }
      }
    } catch (err: any) {
      setRawResponse({
        endpoint: ep,
        error: err.message,
      });
    } finally {
      setIsLoadingEndpoint(false);
    }
  };

  const handleCopyResponse = () => {
    if (!rawResponse) return;
    navigator.clipboard.writeText(JSON.stringify(rawResponse, null, 2));
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-28 space-y-6">
      {/* Calm Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Pengaturan Profil & Akun
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Konfigurasi niche, persona AI, akun Meta Threads, dan integrasi API.
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
          <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0" />
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
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Pengaturan profil berhasil disimpan.</span>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-850 text-xs w-fit">
        <button
          type="button"
          onClick={() => switchTab("persona")}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === "persona"
              ? "bg-zinc-800 text-zinc-100 font-semibold"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Persona & Niche</span>
          {profile?.niche && (
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900/80 px-1.5 py-0.2 rounded border border-zinc-800">
              {profile.niche}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => switchTab("api")}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === "api"
              ? "bg-zinc-800 text-zinc-100 font-semibold"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Kunci API & Kredensial</span>
          {threadsAccount && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
        </button>

        <button
          type="button"
          onClick={() => switchTab("lab")}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === "lab"
              ? "bg-zinc-800 text-zinc-100 font-semibold"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>API Lab & Kuota</span>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900/80 px-1.5 py-0.2 rounded border border-zinc-800">
            {quota?.publishingUsed || 0}/{quota?.publishingLimit || 25}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PERSONA & NICHE KONTEN                                            */}
      {/* ========================================================================= */}
      {activeTab === "persona" && (
        <div className="space-y-6">
          {/* Threads Account Connection Preview Card */}
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
                <button
                  type="button"
                  onClick={() => switchTab("api")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 transition cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{threadsAccount ? "Kelola Kunci & Token API" : "Atur Kunci API"}</span>
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KUNCI API & KREDENSIAL                                            */}
      {/* ========================================================================= */}
      {activeTab === "api" && (
        <div className="space-y-6">
          {/* Sub-section 1: Kunci Google Gemini API Mandiri */}
          <GeminiKeySettings />

          {/* Sub-section 2: Kredensial Meta Threads Graph API */}
          <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-900/20 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Kredensial Meta Threads Graph API
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${
                      threadsAccount
                        ? "bg-zinc-800 text-zinc-200 border border-zinc-700"
                        : "bg-zinc-900 text-zinc-500 border border-zinc-850"
                    }`}
                  >
                    {threadsAccount ? `Terhubung: @${threadsAccount.username}` : "Belum Terhubung"}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Token disimpan secara privat di IndexedDB perangkat Anda untuk menerbitkan draf dan memeriksa metrik.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 transition cursor-pointer shadow-xs font-semibold"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Wizard Login Threads</span>
                </button>
              </div>
            </div>

            {threadsSaveNotice && (
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{threadsSaveNotice}</span>
              </div>
            )}

            <form onSubmit={handleSaveThreadsToken} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block font-medium text-zinc-300">
                  Threads User Access Token:
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showThreadsToken ? "text" : "password"}
                    value={threadsTokenInput}
                    onChange={(e) => setThreadsTokenInput(e.target.value)}
                    placeholder="THQ..."
                    className="w-full p-2.5 pr-20 rounded-xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-zinc-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowThreadsToken(!showThreadsToken)}
                    className="absolute right-3 p-1 text-zinc-500 hover:text-white"
                  >
                    {showThreadsToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-zinc-300">
                    Meta App ID (Opsional):
                  </label>
                  <input
                    type="text"
                    value={threadsAppIdInput}
                    onChange={(e) => setThreadsAppIdInput(e.target.value)}
                    placeholder="1234567890..."
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-hidden font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-medium text-zinc-300">
                    App Secret (Opsional):
                  </label>
                  <input
                    type="password"
                    value={threadsAppSecretInput}
                    onChange={(e) => setThreadsAppSecretInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                {threadsAccount ? (
                  <button
                    type="button"
                    onClick={handleDisconnectThreads}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition cursor-pointer"
                  >
                    Putuskan Akun
                  </button>
                ) : (
                  <span className="text-[11px] text-zinc-500">
                    Belum punya token? Gunakan tombol Wizard Login Threads di atas.
                  </span>
                )}

                <button
                  type="submit"
                  disabled={isTestingThreads}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-950 transition cursor-pointer shadow-xs disabled:opacity-40"
                >
                  {isTestingThreads ? "Memverifikasi..." : "Simpan & Verifikasi Token"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: API LAB & MONITOR KUOTA                                           */}
      {/* ========================================================================= */}
      {activeTab === "lab" && (
        <div className="space-y-6">
          {/* Top Status & Sync Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-zinc-900 bg-zinc-900/20">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Monitor Kuota & Live Endpoint Inspector
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Pemeriksaan batas posting 25/hari dan respons resmi Meta Threads Graph API.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {threadsAccount && (
                <button
                  type="button"
                  onClick={handleSyncPosts}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>{isSyncing ? "Menyinkronkan..." : "Sinkronkan Threads"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => switchTab("api")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 transition cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-zinc-400" />
                <span>Ubah Kunci API</span>
              </button>
            </div>
          </div>

          {syncStatus && (
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncStatus}</span>
            </div>
          )}

          {/* Sub-section 1: Kuota Grid */}
          <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-900/20 space-y-4 text-xs">
            <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
              Status Batas Rate Limit & Kuota Meta Threads API
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-1">
                <span className="text-[11px] text-zinc-500 block">Batas Posting Harian:</span>
                <div className="text-lg font-semibold text-zinc-100">
                  {quota?.publishingUsed || 0} / {quota?.publishingLimit || 25} Post
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        ((quota?.publishingUsed || 0) / (quota?.publishingLimit || 25)) * 100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Maksimum resmi 25 post per 24 jam</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-1">
                <span className="text-[11px] text-zinc-500 block">Panggilan API Graph:</span>
                <div className="text-lg font-semibold text-zinc-100">
                  {quota?.dailyCallsUsed || 0} / {quota?.dailyCallsLimit || 250} Panggilan
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-sky-400 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        ((quota?.dailyCallsUsed || 0) / (quota?.dailyCallsLimit || 250)) * 100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Batas aman konsumsi bandwidth</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-1">
                <span className="text-[11px] text-zinc-500 block">Status Akun:</span>
                <div
                  className={`text-lg font-semibold ${
                    threadsAccount ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {threadsAccount ? `@${threadsAccount.username}` : "Belum Terhubung"}
                </div>
                <p className="text-[10px] text-zinc-500 mt-2">
                  {threadsAccount ? "Koneksi Graph API Aktif" : "Menunggu token otentikasi"}
                </p>
              </div>
            </div>
          </div>

          {/* Sub-section 2: Live Graph API Inspector */}
          <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-900/20 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-3">
              <div>
                <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                  Live Endpoint Inspector & Debugger
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Uji langsung panggilan Meta Graph API dan lihat respons JSON mentah.
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyResponse}
                  disabled={!rawResponse}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 transition cursor-pointer text-[11px]"
                >
                  {copiedResponse ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-zinc-400" />
                      <span>Salin JSON</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleTestEndpoint("user_profile")}
                disabled={isLoadingEndpoint}
                className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                  activeEndpoint === "user_profile"
                    ? "bg-zinc-850 border-zinc-650 text-zinc-100 font-semibold"
                    : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-750"
                }`}
              >
                GET /me (Profil Akun)
              </button>
              <button
                type="button"
                onClick={() => handleTestEndpoint("user_threads")}
                disabled={isLoadingEndpoint}
                className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                  activeEndpoint === "user_threads"
                    ? "bg-zinc-850 border-zinc-650 text-zinc-100 font-semibold"
                    : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-750"
                }`}
              >
                GET /me/threads (Utas Asli)
              </button>
              <button
                type="button"
                onClick={() => handleTestEndpoint("insights_snapshots")}
                disabled={isLoadingEndpoint}
                className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                  activeEndpoint === "insights_snapshots"
                    ? "bg-zinc-850 border-zinc-650 text-zinc-100 font-semibold"
                    : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-750"
                }`}
              >
                GET /{`{id}`}/insights (Metrik Nyata)
              </button>
            </div>

            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950 font-mono text-xs text-zinc-300 space-y-2 overflow-x-auto">
              <div className="flex items-center justify-between text-zinc-500 pb-2 border-b border-zinc-900 text-[11px]">
                <span>RESPONS JSON RESMI GRAPH API</span>
                <span>{isLoadingEndpoint ? "Memuat..." : "Status: Siap"}</span>
              </div>
              <pre className="text-[11px] leading-relaxed text-zinc-300 overflow-x-auto max-h-96">
                {JSON.stringify(rawResponse, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Threads Connect Wizard Modal */}
      <ThreadsConnectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnected={(acc) => {
          setThreadsAccount(acc);
          setIsModalOpen(false);
          loadAllData();
        }}
      />
    </div>
  );
};
