import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Terminal,
  RefreshCw,
  Key,
  CheckCircle2,
  AlertCircle,
  Link2,
  Unlink,
  ExternalLink,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Sliders,
  Sparkles,
} from "lucide-react";
import {
  threadsClient,
  ThreadsAccount,
  QuotaState,
  ThreadsPostData,
} from "../services/threadsClient";
import { testGeminiApiKey } from "../services/ai";
import { storage } from "../lib/storage";
import { ThreadsConnectModal } from "../components/ThreadsConnectModal";

export const ThreadsApiLabPage: React.FC = () => {
  const [account, setAccount] = useState<ThreadsAccount | null>(null);
  const [quota, setQuota] = useState<QuotaState | null>(null);
  const [posts, setPosts] = useState<ThreadsPostData[]>([]);
  const [activeTab, setActiveTab] = useState<"settings" | "inspector" | "quota">("settings");
  const [activeEndpoint, setActiveEndpoint] = useState<string>("user_profile");
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Gemini API Key State
  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [hasCustomGeminiKey, setHasCustomGeminiKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [geminiTestStatus, setGeminiTestStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });
  const [isTestingGemini, setIsTestingGemini] = useState(false);

  // Threads Credentials State
  const [threadsTokenInput, setThreadsTokenInput] = useState("");
  const [showThreadsToken, setShowThreadsToken] = useState(false);
  const [threadsAppIdInput, setThreadsAppIdInput] = useState("");
  const [threadsAppSecretInput, setThreadsAppSecretInput] = useState("");
  const [threadsSaveNotice, setThreadsSaveNotice] = useState<string | null>(null);
  const [isTestingThreads, setIsTestingThreads] = useState(false);

  useEffect(() => {
    loadData();
    loadKeys();
  }, []);

  const loadKeys = async () => {
    const customGemini = await storage.getCustomApiKey();
    if (customGemini) {
      setGeminiKeyInput(customGemini);
      setHasCustomGeminiKey(true);
    }
    const token = await storage.getThreadsToken();
    if (token) {
      setThreadsTokenInput(token);
    }
    const creds = await storage.getThreadsAppCreds();
    if (creds) {
      if (creds.appId) setThreadsAppIdInput(creds.appId);
      if (creds.appSecret) setThreadsAppSecretInput(creds.appSecret);
    }
  };

  const loadData = async () => {
    const acc = await threadsClient.getAccount();
    const q = await threadsClient.getQuotaState();
    const p = await threadsClient.getOwnPosts();
    setAccount(acc);
    setQuota(q);
    setPosts(p);

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
        message: "Akun Threads belum terhubung. Mode mock dinonaktifkan. Hubungkan akun Anda untuk melihat respons API nyata.",
      });
    }
  };

  // --- Gemini API Key Actions ---
  const handleSaveGeminiKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!geminiKeyInput.trim()) {
      setGeminiTestStatus({ type: "error", message: "API Key Gemini tidak boleh kosong." });
      return;
    }
    setIsTestingGemini(true);
    setGeminiTestStatus({ type: "info", message: "Menguji validitas API Key ke Google Gemini..." });
    const res = await testGeminiApiKey(geminiKeyInput.trim());
    setIsTestingGemini(false);

    if (res.success) {
      await storage.saveCustomApiKey(geminiKeyInput.trim());
      setHasCustomGeminiKey(true);
      setGeminiTestStatus({
        type: "success",
        message: "API Key Google Gemini berhasil diverifikasi dan disimpan secara lokal!",
      });
    } else {
      setGeminiTestStatus({
        type: "error",
        message: `Verifikasi gagal: ${res.message}`,
      });
    }
  };

  const handleClearGeminiKey = async () => {
    await storage.clearCustomApiKey();
    setGeminiKeyInput("");
    setHasCustomGeminiKey(false);
    setGeminiTestStatus({
      type: "info",
      message: "Kunci mandiri dihapus. Aplikasi sekarang menggunakan kunci API default dari environment.",
    });
    setTimeout(() => setGeminiTestStatus({ type: null, message: "" }), 3500);
  };

  // --- Threads Token Actions ---
  const handleSaveThreadsToken = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!threadsTokenInput.trim()) {
      setThreadsSaveNotice("Token akses Threads tidak boleh kosong.");
      return;
    }
    setIsTestingThreads(true);
    setThreadsSaveNotice("Menghubungkan token ke Meta Threads Graph API...");

    try {
      const acc = await threadsClient.connectWithToken(threadsTokenInput.trim());
      setAccount(acc);
      // Simpan juga App ID & Secret jika ada
      await storage.saveThreadsAppCreds({
        appId: threadsAppIdInput.trim() || undefined,
        appSecret: threadsAppSecretInput.trim() || undefined,
      });
      setThreadsSaveNotice(`Berhasil terhubung ke akun Threads @${acc.username}!`);
      loadData();
    } catch (err: any) {
      setThreadsSaveNotice(`Gagal: ${err.message}`);
    } finally {
      setIsTestingThreads(false);
      setTimeout(() => setThreadsSaveNotice(null), 5000);
    }
  };

  const handleDisconnectThreads = async () => {
    if (confirm("Apakah Anda yakin ingin memutuskan akun Threads ini dan menghapus token yang tersimpan?")) {
      await threadsClient.disconnectAccount();
      setAccount(null);
      setPosts([]);
      setThreadsTokenInput("");
      setRawResponse({
        status: "disconnected",
        message: "Akun Threads telah diputuskan dari aplikasi.",
      });
    }
  };

  const handleSyncPosts = async () => {
    if (!account) return;
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const refreshed = await threadsClient.syncRealPosts();
      setPosts(refreshed);
      setSyncStatus(`Berhasil menyinkronkan ${refreshed.length} postingan dari akun Threads.`);
    } catch (err: any) {
      setSyncStatus(`Gagal sinkronisasi: ${err.message}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  const handleTestEndpoint = async (ep: string) => {
    setActiveEndpoint(ep);
    setIsLoading(true);

    if (!account || !account.token) {
      setIsLoading(false);
      setRawResponse({
        endpoint: ep,
        error: "Akun Threads belum terhubung.",
        hint: "Silakan masukkan Token Akses pada tab 'Pengaturan API' terlebih dahulu.",
      });
      return;
    }

    try {
      const token = account.token;
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
        const res = await fetch(
          `${baseUrl}/me/threads?fields=id,media_product_type,text,timestamp,permalink,media_type&limit=10&access_token=${encodeURIComponent(token)}`
        );
        const data = await res.json();
        setRawResponse({
          endpoint: "GET /me/threads?fields=id,media_product_type,text,timestamp,permalink,media_type&limit=10",
          status: res.status,
          headers: {
            "x-app-usage": res.headers.get("x-app-usage") || "active",
          },
          data,
        });
      } else if (ep === "insights_snapshots") {
        if (posts.length > 0) {
          const targetPostId = posts[0].id;
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
            endpoint: "GET /{post_id}/insights",
            status: "notice",
            message: "Belum ada postingan terdeteksi di akun ini untuk membaca metrik.",
          });
        }
      } else if (ep === "publish_container") {
        setRawResponse({
          endpoint: "POST /me/threads (Simulation Check)",
          status: 200,
          info: "Endpoint publikasi siap digunakan. Untuk menerbitkan utas nyata, gunakan tombol 'Posting ke Akun Threads' di halaman Generator atau Pratinjau Varian.",
          account: `@${account.username}`,
        });
      }
    } catch (err: any) {
      setRawResponse({
        endpoint: ep,
        error: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">API Lab & Pengaturan Kunci</h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Konfigurasi mandiri API Key Google Gemini, kredensial Meta Threads Graph API, dan live inspector.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {account && (
            <button
              type="button"
              onClick={handleSyncPosts}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition"
              title="Tarik postingan terbaru dari Threads"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Menyinkronkan..." : "Sinkronkan Threads"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Wizard Koneksi</span>
          </button>
        </div>
      </div>

      {syncStatus && (
        <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-neutral-800 gap-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === "settings"
              ? "border-indigo-500 text-white"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Pengaturan Kunci API (Manual Input)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("inspector")}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === "inspector"
              ? "border-indigo-500 text-white"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Live Endpoint Inspector</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("quota")}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === "quota"
              ? "border-indigo-500 text-white"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Monitor Kuota Meta</span>
        </button>
      </div>

      {/* TAB 1: PENGATURAN KUNCI API (MANUAL INPUT SECARA MANDIRI) */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          {/* Section 1: Google Gemini API Key */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Google Gemini API Key (Input Mandiri)
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Kunci API yang digunakan untuk menghasilkan utas, hook DNA, pengecekan kurasi, dan balasan.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    hasCustomGeminiKey
                      ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                      : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                  }`}
                >
                  {hasCustomGeminiKey ? "Kunci Mandiri Aktif" : "Kunci Default Sistem"}
                </span>
              </div>
            </div>

            {/* Test Status Alert */}
            {geminiTestStatus.type && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  geminiTestStatus.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : geminiTestStatus.type === "error"
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                    : "bg-indigo-500/10 border-indigo-500/20 text-indigo-300"
                }`}
              >
                {geminiTestStatus.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{geminiTestStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveGeminiKey} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Masukkan Gemini API Key Anda:
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showGeminiKey ? "text" : "password"}
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full p-3 pr-20 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-3 p-1 text-neutral-400 hover:text-white rounded-md transition"
                    title={showGeminiKey ? "Sembunyikan" : "Tampilkan"}
                  >
                    {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-500 mt-1.5">
                  <span>Dapatkan API Key gratis di Google AI Studio (aistudio.google.com).</span>
                  <span>Tersimpan privat di IndexedDB browser Anda</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {hasCustomGeminiKey && (
                  <button
                    type="button"
                    onClick={handleClearGeminiKey}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Hapus Kunci Mandiri</span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isTestingGemini}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {isTestingGemini ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menguji & Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Uji & Simpan Gemini API Key</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Meta Threads API Token & Credentials */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Key className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Meta Threads API Credentials (Input Mandiri)
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Token Akses dan Kredensial App resmi untuk sinkronisasi profil, metrik, dan penerbitan postingan.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    account
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                  }`}
                >
                  {account ? `Terhubung: @${account.username}` : "Belum Terhubung"}
                </span>
              </div>
            </div>

            {threadsSaveNotice && (
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{threadsSaveNotice}</span>
              </div>
            )}

            <form onSubmit={handleSaveThreadsToken} className="space-y-4">
              {/* User Access Token */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Threads User Access Token (Wajib):
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showThreadsToken ? "text" : "password"}
                    value={threadsTokenInput}
                    onChange={(e) => setThreadsTokenInput(e.target.value)}
                    placeholder="THQ... atau token dari Graph API Explorer"
                    className="w-full p-3 pr-20 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowThreadsToken(!showThreadsToken)}
                    className="absolute right-3 p-1 text-neutral-400 hover:text-white rounded-md transition"
                  >
                    {showThreadsToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[11px] text-neutral-500 mt-1 block">
                  Izin yang dibutuhkan: threads_basic, threads_content_publish, threads_manage_insights, threads_manage_replies.
                </span>
              </div>

              {/* Optional App ID & Secret */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Threads App ID (Opsional OAuth):
                  </label>
                  <input
                    type="text"
                    value={threadsAppIdInput}
                    onChange={(e) => setThreadsAppIdInput(e.target.value)}
                    placeholder="Contoh: 184920491823"
                    className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-600 focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Threads App Secret (Opsional):
                  </label>
                  <input
                    type="password"
                    value={threadsAppSecretInput}
                    onChange={(e) => setThreadsAppSecretInput(e.target.value)}
                    placeholder="App Secret dari Meta Developer Console"
                    className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-600 focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                {account && (
                  <button
                    type="button"
                    onClick={handleDisconnectThreads}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Putuskan Akun</span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isTestingThreads}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {isTestingThreads ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan & Menghubungkan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Verifikasi & Simpan Kredensial Threads</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE ENDPOINT INSPECTOR */}
      {activeTab === "inspector" && (
        <div className="space-y-4">
          {/* Account Card */}
          {account ? (
            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={account.threads_profile_picture_url}
                  alt={account.username}
                  className="w-12 h-12 rounded-full border border-neutral-700 object-cover"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">@{account.username}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Akun Asli Aktif
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">{account.name}</p>
                </div>
              </div>
              <div className="text-right text-[11px] text-neutral-400 space-y-1">
                <div className="text-emerald-400 font-semibold flex items-center justify-end gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Meta Graph API Terhubung</span>
                </div>
                <div>Postingan tersimpan: <span className="text-white font-bold">{posts.length} post</span></div>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-neutral-900/60 border border-dashed border-neutral-800 text-center text-xs text-neutral-400">
              Akun Threads belum terhubung. Buka tab <b className="text-white">Pengaturan Kunci API</b> untuk memasukkan Token Akses secara mandiri.
            </div>
          )}

          {/* Workbench */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live API Endpoint Inspector</h3>
              </div>
              <span className="text-[11px] text-neutral-400">Meta Graph API v1.0</span>
            </div>

            {/* Buttons for Endpoints */}
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { id: "user_profile", label: "GET /me (Profil Akun)" },
                { id: "user_threads", label: "GET /me/threads (Daftar Post)" },
                { id: "insights_snapshots", label: "GET /{id}/insights (Metrik Nyata)" },
                { id: "publish_container", label: "POST /me/threads (Info Container)" },
              ].map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => handleTestEndpoint(ep.id)}
                  className={`px-3 py-1.5 rounded-xl font-semibold border transition cursor-pointer ${
                    activeEndpoint === ep.id
                      ? "bg-indigo-600/20 border-indigo-500 text-white"
                      : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                  }`}
                >
                  {ep.label}
                </button>
              ))}
            </div>

            {/* Response JSON Inspector */}
            <div className="rounded-xl bg-neutral-950 p-4 font-mono text-xs border border-neutral-800 space-y-2 overflow-x-auto max-h-[380px]">
              <div className="flex items-center justify-between text-[11px] text-neutral-500 pb-2 border-b border-neutral-800">
                <span>Payload Inspector (Live API Data)</span>
                {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />}
              </div>
              <pre className="text-neutral-300 leading-relaxed text-[11px]">
                {JSON.stringify(rawResponse, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MONITOR KUOTA */}
      {activeTab === "quota" && quota && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
            Guard Kuota Meta Graph API & Batas Harian:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-[11px] text-neutral-400">Panggilan Graph API:</span>
              <div className="text-lg font-black text-white">
                {quota.dailyCallsUsed} / {quota.dailyCallsLimit.toLocaleString()}
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, (quota.dailyCallsUsed / quota.dailyCallsLimit) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-500">Batas ketat Meta (Aman)</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-[11px] text-neutral-400">Publishing Harian:</span>
              <div className="text-lg font-black text-emerald-400">
                {quota.publishingUsed} / {quota.publishingLimit} post
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, (quota.publishingUsed / quota.publishingLimit) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-500">Maksimum 25 post/hari dari Meta</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-[11px] text-neutral-400">Circuit Breaker Status:</span>
              <div className="text-lg font-black text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{quota.circuitBreakerStatus}</span>
              </div>
              <span className="text-[10px] text-neutral-500">Koneksi normal tanpa pembatasan</span>
            </div>
          </div>
        </div>
      )}

      {/* Threads Connect Modal */}
      <ThreadsConnectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnected={(acc) => {
          setAccount(acc);
          loadData();
          loadKeys();
        }}
      />
    </div>
  );
};
