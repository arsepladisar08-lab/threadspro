import React, { useState, useEffect } from "react";
import { ShieldCheck, Activity, Terminal, RefreshCw, Key, CheckCircle2, AlertCircle, Link2, Unlink, Send } from "lucide-react";
import { threadsClient, ThreadsAccount, QuotaState, ThreadsPostData } from "../services/threadsClient";

export const ThreadsApiLabPage: React.FC = () => {
  const [account, setAccount] = useState<ThreadsAccount | null>(null);
  const [quota, setQuota] = useState<QuotaState | null>(null);
  const [posts, setPosts] = useState<ThreadsPostData[]>([]);
  const [activeEndpoint, setActiveEndpoint] = useState<string>("user_profile");
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

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

    // Initial mock raw response for lab
    setRawResponse({
      endpoint: "GET /me?fields=id,username,name,threads_profile_picture_url,threads_biography",
      status: 200,
      headers: {
        "x-app-usage": JSON.stringify({ call_count: 14, total_cputime: 8, total_time: 12 }),
        "x-business-use-case-usage": "healthy",
      },
      data: acc,
    });
  };

  const handleTestEndpoint = async (ep: string) => {
    setActiveEndpoint(ep);
    setIsLoading(true);

    setTimeout(() => {
      if (ep === "user_profile") {
        setRawResponse({
          endpoint: "GET /me?fields=id,username,name,threads_profile_picture_url,threads_biography",
          status: 200,
          headers: { "x-app-usage": "1.3%" },
          data: account,
        });
      } else if (ep === "user_threads") {
        setRawResponse({
          endpoint: "GET /me/threads?fields=id,media_product_type,text,timestamp,permalink",
          status: 200,
          headers: { "x-app-usage": "2.1%" },
          data: {
            data: posts.map((p) => ({
              id: p.id,
              text: p.text.slice(0, 80) + "...",
              timestamp: p.timestamp,
              permalink: p.permalink,
            })),
            paging: { cursors: { before: "QVFI...", after: "QVFI..." } },
          },
        });
      } else if (ep === "insights_snapshots") {
        setRawResponse({
          endpoint: "GET /{post_id}/insights?metric=views,likes,replies,reposts,quotes",
          status: 200,
          headers: { "x-app-usage": "3.5%" },
          data: {
            data: [
              { name: "views", values: [{ value: 14200 }] },
              { name: "likes", values: [{ value: 540 }] },
              { name: "replies", values: [{ value: 124 }] },
              { name: "reposts", values: [{ value: 42 }] },
            ],
            snapshot_10m: { views: 420, replies: 12 },
            snapshot_30m: { views: 2400, replies: 48 },
            snapshot_60m: { views: 6800, replies: 86 },
          },
        });
      } else if (ep === "publish_container") {
        setRawResponse({
          endpoint: "POST /me/threads?media_type=TEXT&text=Hello&topic_tag=Keuangan",
          status: 200,
          headers: { "x-app-usage": "5.0%" },
          data: { id: "container_mock_89123891" },
        });
      }
      setIsLoading(false);
    }, 400);
  };

  const handleConnectToggle = async () => {
    if (account) {
      await threadsClient.disconnectAccount();
      setAccount(null);
    } else {
      const acc = await threadsClient.connectAccount();
      setAccount(acc);
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
            Uji interaktif endpoint resmi Meta Threads Graph API, monitor guard kuota, dan status akun pengguna.
          </p>
        </div>

        <button
          onClick={handleConnectToggle}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            account
              ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25"
          }`}
        >
          {account ? (
            <>
              <Unlink className="w-3.5 h-3.5 text-rose-400" />
              <span>Putuskan Akun</span>
            </>
          ) : (
            <>
              <Link2 className="w-3.5 h-3.5" />
              <span>Hubungkan Akun Threads</span>
            </>
          )}
        </button>
      </div>

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
                  {account.status}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">{account.name}</p>
              <span className="text-[11px] text-neutral-500 font-mono">
                {account.followers_count.toLocaleString()} Followers • Token berlaku ~{account.tokenExpiryDays} hari lagi
              </span>
            </div>
          </div>
          <div className="text-right text-[11px] text-neutral-400">
            <div>Scope: threads_basic, threads_manage_insights</div>
            <div className="text-emerald-400 font-semibold mt-0.5">Mock Mode Aktif (Preview AI Studio)</div>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-center text-xs text-neutral-400">
          Akun Threads belum terhubung. Klik "Hubungkan Akun Threads" untuk mendemokan integrasi.
        </div>
      )}

      {/* Quota Guard Dashboard */}
      {quota && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
            Guard Kuota Internal & Meta Limits (Limits.ts):
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-[11px] text-neutral-400">Panggilan Graph API Harian:</span>
              <div className="text-lg font-black text-white">
                {quota.dailyCallsUsed} / {quota.dailyCallsLimit.toLocaleString()}
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full"
                  style={{ width: `${(quota.dailyCallsUsed / quota.dailyCallsLimit) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-500">Anggaran 50% Meta (Aman)</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-[11px] text-neutral-400">Publishing Harian:</span>
              <div className="text-lg font-black text-emerald-400">
                {quota.publishingUsed} / {quota.publishingLimit} post
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${(quota.publishingUsed / quota.publishingLimit) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-500">Batas ketat: maks 25 post/hari</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-[11px] text-neutral-400">Circuit Breaker Status:</span>
              <div className="text-lg font-black text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{quota.circuitBreakerStatus}</span>
              </div>
              <span className="text-[10px] text-neutral-500">Normal (Tidak ada 429/5xx aktif)</span>
            </div>
          </div>
        </div>
      )}

      {/* API Lab Workbench */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">API Lab Endpoint Inspector</h3>
          </div>
          <span className="text-[11px] text-neutral-400">Fase 0 Prototype</span>
        </div>

        {/* Buttons for Endpoints */}
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { id: "user_profile", label: "GET /me (Profile)" },
            { id: "user_threads", label: "GET /me/threads (Posts)" },
            { id: "insights_snapshots", label: "GET /{id}/insights (Snapshots)" },
            { id: "publish_container", label: "POST /me/threads (Container)" },
          ].map((ep) => (
            <button
              key={ep.id}
              onClick={() => handleTestEndpoint(ep.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold border transition ${
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
          <div className="flex items-center justify-between text-[11px] text-neutral-500 pb-2 border-b border-neutral-850">
            <span>Payload Inspector</span>
            {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />}
          </div>
          <pre className="text-neutral-300 leading-relaxed text-[11px]">
            {JSON.stringify(rawResponse, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
