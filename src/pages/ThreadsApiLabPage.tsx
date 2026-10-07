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
  Sliders,
} from "lucide-react";
import {
  threadsClient,
  ThreadsAccount,
  QuotaState,
  ThreadsPostData,
} from "../services/threadsClient";
import { storage } from "../lib/storage";
import { ThreadsConnectModal } from "../components/ThreadsConnectModal";

export const ThreadsApiLabPage: React.FC = () => {
  const [account, setAccount] = useState<ThreadsAccount | null>(null);
  const [quota, setQuota] = useState<QuotaState | null>(null);
  const [posts, setPosts] = useState<ThreadsPostData[]>([]);
  const [activeTab, setActiveTab] = useState<"auth" | "inspector" | "quota">("auth");
  const [activeEndpoint, setActiveEndpoint] = useState<string>("user_profile");
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

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
        message: "Akun Threads belum terhubung. Hubungkan akun Anda untuk melihat respons API nyata.",
      });
    }
  };

  const handleSaveThreadsToken = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!threadsTokenInput.trim()) {
      setThreadsSaveNotice("Token akses Threads tidak boleh kosong.");
      return;
    }
    setIsTestingThreads(true);
    setThreadsSaveNotice("Memverifikasi token ke Meta Threads Graph API...");

    try {
      const acc = await threadsClient.connectWithToken(threadsTokenInput.trim());
      setAccount(acc);
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
      setTimeout(() => setThreadsSaveNotice(null), 4000);
    }
  };

  const handleDisconnectThreads = async () => {
    await threadsClient.disconnectAccount();
    setAccount(null);
    setPosts([]);
    setThreadsTokenInput("");
    setRawResponse({
      status: "disconnected",
      message: "Akun Threads telah diputuskan dari aplikasi.",
    });
  };

  const handleSyncPosts = async () => {
    if (!account) return;
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
    setIsLoading(true);

    if (!account || !account.token) {
      setIsLoading(false);
      setRawResponse({
        endpoint: ep,
        error: "Akun Threads belum terhubung.",
        hint: "Silakan masukkan Token Akses pada tab Koneksi terlebih dahulu.",
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
        const fields = "id,media_product_type,media_type,media_url,permalink,owner,username,text,timestamp,shortcode,thumbnail_url,children,is_quote_post";
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
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-28 space-y-6">
      {/* Calm Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
            API Lab & Diagnostik Meta Threads
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Inspeksi endpoint resmi Graph API, monitor limit kuota harian 25 post, dan verifikasi token.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {account && (
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
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-950 transition cursor-pointer shadow-xs"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Wizard Koneksi</span>
          </button>
        </div>
      </div>

      {syncStatus && (
        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-850 text-xs w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("auth")}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
            activeTab === "auth" ? "bg-zinc-800 text-zinc-100 font-semibold" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Koneksi & Token Threads
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("inspector")}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
            activeTab === "inspector" ? "bg-zinc-800 text-zinc-100 font-semibold" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Live Endpoint Inspector
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("quota")}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
            activeTab === "quota" ? "bg-zinc-800 text-zinc-100 font-semibold" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Monitor Kuota (25/Hari)
        </button>
      </div>

      {/* TAB 1: KONEKSI & TOKEN THREADS */}
      {activeTab === "auth" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-900/20 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">
                  Kredensial Meta Threads Graph API
                </h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Token disimpan secara aman di IndexedDB perangkat Anda tanpa transit ke server pihak ketiga.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${
                    account
                      ? "bg-zinc-800 text-zinc-200 border border-zinc-700"
                      : "bg-zinc-900 text-zinc-500 border border-zinc-850"
                  }`}
                >
                  {account ? `Terhubung: @${account.username}` : "Belum Terhubung"}
                </span>
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
                {account ? (
                  <button
                    type="button"
                    onClick={handleDisconnectThreads}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition cursor-pointer"
                  >
                    Putuskan Akun
                  </button>
                ) : (
                  <span className="text-[11px] text-zinc-500">
                    Belum punya token? Gunakan tombol Wizard Koneksi di kanan atas.
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

      {/* TAB 2: LIVE ENDPOINT INSPECTOR */}
      {activeTab === "inspector" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleTestEndpoint("user_profile")}
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
              className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                activeEndpoint === "insights_snapshots"
                  ? "bg-zinc-850 border-zinc-650 text-zinc-100 font-semibold"
                  : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-750"
              }`}
            >
              GET /{`{id}`}/insights (Metrik Nyata)
            </button>
          </div>

          <div className="p-4 rounded-2xl border border-zinc-900 bg-zinc-950 font-mono text-xs text-zinc-300 space-y-2 overflow-x-auto">
            <div className="flex items-center justify-between text-zinc-500 pb-2 border-b border-zinc-900">
              <span>RESPONS JSON RESMI GRAPH API</span>
              <span>{isLoading ? "Memuat..." : "200 OK"}</span>
            </div>
            <pre className="text-[11px] leading-relaxed text-zinc-300">
              {JSON.stringify(rawResponse, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: MONITOR KUOTA */}
      {activeTab === "quota" && (
        <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-900/20 space-y-4 text-xs">
          <h2 className="text-sm font-semibold text-zinc-100">
            Status Batas Rate Limit & Kuota Meta Threads API
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-1">
              <span className="text-[11px] text-zinc-500 block">Batas Posting Harian:</span>
              <div className="text-lg font-semibold text-zinc-100">
                {quota?.publishingUsed || 0} / {quota?.publishingLimit || 25} Post
              </div>
              <p className="text-[10px] text-zinc-500">Maksimum resmi 25 post per 24 jam</p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-1">
              <span className="text-[11px] text-zinc-500 block">Panggilan API Graph:</span>
              <div className="text-lg font-semibold text-zinc-100">
                {quota?.dailyCallsUsed || 0} / {quota?.dailyCallsLimit || 250} Panggilan
              </div>
              <p className="text-[10px] text-zinc-500">Batas aman konsumsi bandwidth</p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-1">
              <span className="text-[11px] text-zinc-500 block">Status Akun:</span>
              <div className="text-lg font-semibold text-emerald-400">
                {account ? "Aktif" : "Menunggu Login"}
              </div>
              <p className="text-[10px] text-zinc-500">Koneksi Graph API</p>
            </div>
          </div>
        </div>
      )}

      {/* Wizard Modal */}
      <ThreadsConnectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnected={(acc) => {
          setAccount(acc);
          setIsModalOpen(false);
          loadData();
        }}
      />
    </div>
  );
};
