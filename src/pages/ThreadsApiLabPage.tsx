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
  Layers,
  Database,
  Send,
} from "lucide-react";
import {
  threadsClient,
  ThreadsAccount,
  QuotaState,
  ThreadsPostData,
} from "../services/threadsClient";
import { ThreadsConnectModal } from "../components/ThreadsConnectModal";

export const ThreadsApiLabPage: React.FC = () => {
  const [account, setAccount] = useState<ThreadsAccount | null>(null);
  const [quota, setQuota] = useState<QuotaState | null>(null);
  const [posts, setPosts] = useState<ThreadsPostData[]>([]);
  const [activeEndpoint, setActiveEndpoint] = useState<string>("user_profile");
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

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
        hint: "Silakan klik 'Hubungkan Akun Threads' atau masukkan Token Akses terlebih dahulu.",
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

  const handleDisconnect = async () => {
    if (confirm("Apakah Anda yakin ingin memutuskan akun Threads ini dan menghapus token yang tersimpan?")) {
      await threadsClient.disconnectAccount();
      setAccount(null);
      setPosts([]);
      setRawResponse({
        status: "disconnected",
        message: "Akun Threads telah diputuskan dari aplikasi.",
      });
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
            <h1 className="text-xl sm:text-2xl font-black text-white">Threads API Lab & Manajemen Kuota</h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Integrasi langsung Meta Threads Graph API dengan Token Akses & OAuth 2.0. Mock mode dinonaktifkan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {account ? (
            <>
              <button
                type="button"
                onClick={handleSyncPosts}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition"
                title="Tarik postingan terbaru dari Threads"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "Menyinkronkan..." : "Sinkronkan Data"}</span>
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>Putuskan Akun</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Hubungkan Akun Threads</span>
            </button>
          )}
        </div>
      </div>

      {syncStatus && (
        <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Account Info Card */}
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
              {account.threads_biography && (
                <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1 italic">
                  "{account.threads_biography}"
                </p>
              )}
            </div>
          </div>
          <div className="text-right text-[11px] text-neutral-400 space-y-1">
            <div className="text-emerald-400 font-semibold flex items-center justify-end gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Meta Graph API Terhubung</span>
            </div>
            <div>Postingan tersimpan: <span className="text-white font-bold">{posts.length} post</span></div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-indigo-400 hover:text-indigo-300 underline text-[11px]"
            >
              Ganti / Perbarui Token
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-neutral-900/60 border border-dashed border-neutral-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
            <Link2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Akun Threads Belum Terhubung</h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1">
              Dummy data dan mode mock telah dinonaktifkan. Masukkan Token Akses Pengguna Threads Anda atau login via OAuth untuk mengaktifkan sinkronisasi profil, pelacakan metrik, dan publikasi otomatis.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Masukkan Token Akses Threads</span>
          </button>
        </div>
      )}

      {/* Quota Guard Dashboard */}
      {quota && (
        <div className="space-y-3">
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

      {/* API Lab Workbench */}
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

      {/* Threads Connect Modal */}
      <ThreadsConnectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnected={(acc) => {
          setAccount(acc);
          loadData();
        }}
      />
    </div>
  );
};
