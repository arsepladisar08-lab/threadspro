import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Plus,
  TrendingUp,
  Info,
  Clock,
  MessageSquare,
  Heart,
  Users,
  Eye,
  HelpCircle,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Edit3,
  Trash2,
  X,
  FileText,
} from "lucide-react";
import { storage } from "../lib/storage";
import { MetricEntry, CardUserWeight } from "../types";
import { threadsClient } from "../services/threadsClient";
import {
  calculateReplyToLike,
  calculateEngagementRate,
  calculateVelocity60,
  calculateMedian,
  calculateCardUserWeight,
} from "../lib/metrics";

export const MetricsPage: React.FC = () => {
  const [entries, setEntries] = useState<MetricEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [syncMode, setSyncMode] = useState<"all" | "custom">("all");
  const [customLimit, setCustomLimit] = useState<number>(25);
  const [editingEntry, setEditingEntry] = useState<MetricEntry | null>(null);

  // In-app Confirmation Modal (tidak memakai window.confirm agar tidak diblokir iframe)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => Promise<void> | void;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmLabel: "Konfirmasi",
    onConfirm: () => {},
    isDanger: true,
  });

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [topicTag, setTopicTag] = useState("Keuangan Pribadi");
  const [hookType, setHookType] = useState("hook_angka");
  const [timeWIB, setTimeWIB] = useState("19.30 - 22.30 WIB");
  const [views, setViews] = useState(1200);
  const [likes, setLikes] = useState(85);
  const [replies, setReplies] = useState(24);
  const [replyDepth, setReplyDepth] = useState(14);
  const [profileVisits, setProfileVisits] = useState(38);
  const [follows, setFollows] = useState(9);
  const [first60, setFirst60] = useState(18);
  const [cardId, setCardId] = useState("K01");

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    const list = await storage.getMetrics();
    // Bersihkan data dummy mock seed sebelumnya serta segala data dari 'repost_facade'
    const cleanList = (list || []).filter((item) => {
      if (!item) return false;
      if (item.id === "m1" || item.id === "m2") return false;
      const mType = (item.mediaType || "").toUpperCase();
      const topic = (item.topicTag || "").toUpperCase();
      const notes = (item.notes || "").toUpperCase();
      if (
        mType === "REPOST_FACADE" ||
        mType.includes("REPOST_FACADE") ||
        topic.includes("REPOST_FACADE") ||
        notes.includes("REPOST_FACADE")
      ) {
        return false;
      }
      return true;
    });
    
    // Deduplikasi ketat berdasarkan ID
    const seen = new Set<string>();
    const uniqueList: MetricEntry[] = [];
    for (const item of cleanList) {
      if (item && item.id) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          uniqueList.push(item);
        }
      } else if (item) {
        uniqueList.push(item);
      }
    }

    // Ambil cache postingan asli Threads yang tersimpan untuk memulihkan data yang sempat tersimpan kosong
    const storedThreadsPosts = await storage.getThreadsPosts();
    const threadsPostMap = new Map<string, any>();
    for (const tp of storedThreadsPosts) {
      if (tp && tp.id) {
        const mType = (tp.media_type || tp.mediaType || "").toUpperCase();
        if (mType === "REPOST_FACADE" || mType.includes("REPOST_FACADE")) continue;
        threadsPostMap.set(tp.id, tp);
        threadsPostMap.set(`th_${tp.id}`, tp);
      }
    }

    // Perbaiki data yang sempat tersimpan dengan placeholder "Threads Post" agar menampilkan isi utas asli
    const healedList = uniqueList
      .filter((entry) => {
        const mType = (entry.mediaType || "").toUpperCase();
        const topic = (entry.topicTag || "").toUpperCase();
        return mType !== "REPOST_FACADE" && !mType.includes("REPOST_FACADE") && !topic.includes("REPOST_FACADE");
      })
      .map((entry) => {
        const rawPostId = entry.id.replace(/^th_/, "");
        const matched = threadsPostMap.get(entry.id) || threadsPostMap.get(rawPostId);
        if (matched) {
          const cleanText = (matched.text || entry.postText || entry.notes || "").trim();
          const firstLine = cleanText.split("\n")[0]?.trim();
          const topicTitle = firstLine
            ? (firstLine.length > 55 ? firstLine.slice(0, 52) + "..." : firstLine)
            : (entry.topicTag && entry.topicTag !== "Threads Post" ? entry.topicTag : "Utas Organik Threads");

          let formattedTime = entry.timeWIB;
          if (matched.timestamp && (entry.timeWIB === "Waktu Nyata" || !entry.timeWIB)) {
            try {
              const d = new Date(matched.timestamp);
              if (!isNaN(d.getTime())) {
                formattedTime = `${d.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Jakarta",
                  hour12: false,
                })} WIB`;
              }
            } catch {}
          }

          const resolvedViews = entry.views || matched.insights?.views || 0;
          const resolvedLikes = entry.likes || matched.insights?.likes || 0;
          const resolvedReplies = entry.replies || matched.insights?.replies || 0;
          const resolvedRtl = calculateReplyToLike(resolvedReplies, resolvedLikes);
          const resolvedEng = calculateEngagementRate(resolvedLikes, resolvedReplies, entry.replyDepth || 0, resolvedViews);

          return {
            ...entry,
            topicTag: topicTitle,
            timeWIB: formattedTime,
            postText: cleanText,
            notes: cleanText,
            permalink: matched.permalink || entry.permalink || `https://threads.net/post/${rawPostId}`,
            mediaType: matched.media_type || entry.mediaType || "TEXT_POST",
            views: resolvedViews,
            likes: resolvedLikes,
            replies: resolvedReplies,
            replyToLike: resolvedRtl ? Number(resolvedRtl.toFixed(3)) : null,
            engagementRate: resolvedEng ? Number(resolvedEng.toFixed(3)) : null,
          };
        }
        return entry;
      });

    if (healedList.length !== (list || []).length || healedList.some((e, i) => e.topicTag !== list[i]?.topicTag)) {
      await storage.setMetrics(healedList);
    }

    setEntries(healedList);
  };

  const handleSyncFromThreads = async () => {
    setIsSyncing(true);
    setSyncNotice(null);
    try {
      // Panggil fungsi fetchThreadsOriginal resmi Meta Threads API
      const limitParam = syncMode === "custom" ? customLimit : undefined;
      const posts = await threadsClient.fetchThreadsOriginal({ limitCount: limitParam });

      if (!posts || posts.length === 0) {
        setSyncNotice({
          type: "info",
          text: "API mengembalikan 0 postingan asli. Jika aplikasi Meta Anda masih berstatus 'In Development' (Mode Pengembangan), pastikan akun Threads Anda sudah diundang & menerima undangan sebagai 'Threads Tester' di Meta Developer Console (Dashboard > App Roles > Roles > Threads Testers).",
        });
        return;
      }

      // Pastikan postingan asli tidak duplikat ID dan bukan 'repost_facade'
      const seenPosts = new Set<string>();
      const uniquePosts = posts.filter((p) => {
        if (!p || !p.id || seenPosts.has(p.id)) return false;
        const mType = (p.media_type || "").toUpperCase();
        if (mType === "REPOST_FACADE" || mType.includes("REPOST_FACADE")) return false;
        seenPosts.add(p.id);
        return true;
      });

      const imported: MetricEntry[] = uniquePosts.map((p) => {
        const rtl = calculateReplyToLike(p.insights.replies, p.insights.likes);
        const eng = calculateEngagementRate(p.insights.likes, p.insights.replies, 0, p.insights.views);
        const cleanText = (p.text || "").trim();
        const firstLine = cleanText.split("\n")[0]?.trim();
        const topicTitle = firstLine
          ? (firstLine.length > 55 ? firstLine.slice(0, 52) + "..." : firstLine)
          : "Utas Organik Threads";

        let formattedTime = "19.30 - 22.30 WIB";
        if (p.timestamp) {
          try {
            const d = new Date(p.timestamp);
            if (!isNaN(d.getTime())) {
              formattedTime = `${d.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Jakarta",
                hour12: false,
              })} WIB`;
            }
          } catch {}
        }

        return {
          id: `th_${p.id}`,
          date: p.timestamp ? p.timestamp.split("T")[0] : new Date().toISOString().split("T")[0],
          topicTag: topicTitle,
          hookType: "organik",
          timeWIB: formattedTime,
          views: p.insights.views,
          likes: p.insights.likes,
          replies: p.insights.replies,
          replyDepth: 0,
          profileVisits: 0,
          follows: 0,
          first60MinInteractions: 0,
          replyToLike: rtl ? Number(rtl.toFixed(3)) : null,
          velocity60: 0,
          engagementRate: eng ? Number(eng.toFixed(3)) : null,
          notes: cleanText,
          postText: cleanText,
          permalink: p.permalink || `https://threads.net/post/${p.id}`,
          mediaType: p.media_type || "TEXT_POST",
        };
      });

      // Gabungkan imported dan entries yang sudah ada secara atomik tanpa duplikasi (upsert by ID)
      const entryMap = new Map<string, MetricEntry>();
      for (const item of imported) {
        entryMap.set(item.id, item);
      }
      for (const item of entries) {
        if (!entryMap.has(item.id)) {
          entryMap.set(item.id, item);
        }
      }

      const mergedList = Array.from(entryMap.values());
      await storage.setMetrics(mergedList);
      setEntries(mergedList);

      let successText = `Berhasil menarik ${imported.length} kumpulan utas asli langsung dari akun Threads Anda!`;
      if (threadsClient.lastInsightsWarning) {
        successText += ` ${threadsClient.lastInsightsWarning}`;
      }

      setSyncNotice({
        type: threadsClient.lastInsightsWarning ? "info" : "success",
        text: successText,
      });
    } catch (err: any) {
      setSyncNotice({
        type: "error",
        text: `Gagal menarik data: ${err.message}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const requestDeleteEntry = (item: MetricEntry) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Catatan Utas?",
      description: `Apakah Anda yakin ingin menghapus catatan metrik untuk "${item.topicTag}"? Baris ini akan dihapus permanen dari riwayat tracker.`,
      confirmLabel: "Hapus Baris",
      isDanger: true,
      onConfirm: async () => {
        await storage.deleteMetric(item.id);
        const updated = entries.filter((e) => e.id !== item.id);
        setEntries(updated);
        setSyncNotice({
          type: "info",
          text: `Catatan utas "${item.topicTag}" berhasil dihapus.`,
        });
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const requestClearAll = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Bersihkan Seluruh Riwayat?",
      description:
        "Tindakan ini akan mengosongkan semua riwayat postingan utas dan metrik yang tersimpan di Tracker. Anda tetap bisa menarik ulang data kapan saja via tombol 'Tarik Data Threads'.",
      confirmLabel: "Bersihkan Semua",
      isDanger: true,
      onConfirm: async () => {
        await storage.clearMetrics();
        setEntries([]);
        setSyncNotice({
          type: "info",
          text: "Seluruh riwayat metrik telah dibersihkan. Anda dapat menarik ulang data utas asli menggunakan tombol 'Tarik Data Threads'.",
        });
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    const rtl = calculateReplyToLike(editingEntry.replies, editingEntry.likes);
    const eng = calculateEngagementRate(
      editingEntry.likes,
      editingEntry.replies,
      editingEntry.replyDepth,
      editingEntry.views
    );
    const vel = calculateVelocity60(editingEntry.first60MinInteractions || 0);

    const updatedItem: MetricEntry = {
      ...editingEntry,
      replyToLike: rtl ? Number(rtl.toFixed(3)) : null,
      velocity60: Number(vel.toFixed(2)),
      engagementRate: eng ? Number(eng.toFixed(3)) : null,
    };

    const updatedList = entries.map((item) => (item.id === updatedItem.id ? updatedItem : item));
    await storage.setMetrics(updatedList);
    setEntries(updatedList);
    setEditingEntry(null);
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();

    const rtl = calculateReplyToLike(replies, likes);
    const eng = calculateEngagementRate(likes, replies, replyDepth, views);
    const vel = calculateVelocity60(first60);

    const newEntry: MetricEntry = {
      id: `m_${Date.now()}`,
      date,
      topicTag,
      hookType,
      timeWIB,
      views,
      likes,
      replies,
      replyDepth,
      profileVisits,
      follows,
      first60MinInteractions: first60,
      replyToLike: rtl ? Number(rtl.toFixed(3)) : null,
      velocity60: Number(vel.toFixed(2)),
      engagementRate: eng ? Number(eng.toFixed(3)) : null,
      cardId,
    };

    await storage.saveMetric(newEntry);
    const updated = [newEntry, ...entries];
    setEntries(updated);

    // Hitung bobot E untuk kartu ini jika ada cukup data
    const cardEntries = updated.filter((e) => e.cardId === cardId);
    const weightObj = calculateCardUserWeight(cardEntries, updated);
    await storage.saveCardWeight(weightObj);

    setShowAddForm(false);
  };

  // Kalkulasi Ringkasan
  const allRtls = entries
    .map((e) => e.replyToLike)
    .filter((v): v is number => v !== null && !isNaN(v));
  const medianRtl = calculateMedian(allRtls);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-28 space-y-6">
      {/* Calm Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
            Tracker Metrik & Personalisasi (Label E)
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Pantau rasio Reply-to-Like dan kecepatan interaksi 60 menit pertama untuk melatih bobot AI khusus akun Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Kontrol Pilihan Jumlah Utas */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <span className="text-[11px] text-zinc-500">Ambil:</span>
            <select
              value={syncMode}
              onChange={(e) => setSyncMode(e.target.value as "all" | "custom")}
              disabled={isSyncing}
              className="bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-zinc-200 text-xs focus:outline-hidden cursor-pointer"
            >
              <option value="all">Semua Utas</option>
              <option value="custom">Batasi Jumlah</option>
            </select>

            {syncMode === "custom" && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={customLimit}
                  onChange={(e) => setCustomLimit(Math.max(1, Number(e.target.value) || 1))}
                  disabled={isSyncing}
                  placeholder="25"
                  className="w-14 px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-700 text-zinc-100 text-xs font-mono text-center focus:outline-hidden"
                  title="Ketik jumlah postingan yang ingin diimpor"
                />
                <span className="text-[10px] text-zinc-500">post</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSyncFromThreads}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer disabled:opacity-40"
            title="Impor kumpulan utas asli dari Meta Threads Graph API"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Menarik Data..." : "Tarik Data Threads"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-950 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Catat Metrik</span>
          </button>
        </div>
      </div>

      {syncNotice && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
            syncNotice.type === "success"
              ? "bg-zinc-900 border-emerald-500/30 text-emerald-300"
              : syncNotice.type === "error"
              ? "bg-zinc-900 border-rose-500/30 text-rose-300"
              : "bg-zinc-900 border-zinc-800 text-zinc-300"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {syncNotice.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : syncNotice.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{syncNotice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncNotice(null)}
            className="text-zinc-500 hover:text-white text-xs px-1.5 py-0.5 rounded transition"
          >
            ×
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-zinc-900 bg-zinc-900/20 space-y-1">
          <span className="text-[11px] text-zinc-400">Median Reply-to-Like</span>
          <div className="text-xl font-semibold text-zinc-100 font-mono">
            {medianRtl !== null ? medianRtl.toFixed(3) : "-"}
          </div>
          <span
            className={`text-[10px] block ${
              medianRtl && medianRtl >= 0.15 ? "text-emerald-400 font-medium" : "text-zinc-500"
            }`}
          >
            {medianRtl && medianRtl >= 0.15 ? "✓ Di atas target 0,15" : "Target ideal: > 0,15"}
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-900 bg-zinc-900/20 space-y-1">
          <span className="text-[11px] text-zinc-400">Total Postingan Dicatat</span>
          <div className="text-xl font-semibold text-zinc-100 font-mono">{entries.length} Post</div>
          <span className="text-[10px] text-zinc-500">
            {entries.length >= 5 ? "Cukup untuk bobot E" : "Minimal 5 data"}
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-900 bg-zinc-900/20 space-y-1">
          <span className="text-[11px] text-zinc-400">Jam Prime-Time</span>
          <div className="text-sm font-semibold text-zinc-100 font-mono truncate">19.30 - 22.30 WIB</div>
          <span className="text-[10px] text-zinc-500 block">Siklus prime-time akun</span>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-900 bg-zinc-900/20 space-y-1">
          <span className="text-[11px] text-zinc-400">Pola Hook Terbaik</span>
          <div className="text-sm font-semibold text-zinc-100 truncate">Hook Angka & Realita</div>
          <span className="text-[10px] text-zinc-500 block">Berdasarkan RTL tertinggi</span>
        </div>
      </div>

      {/* Modal / Collapse Input Form */}
      {showAddForm && (
        <form onSubmit={handleAddEntry} className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-700 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Catat Hasil Postingan Threads</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-neutral-300 mb-1">Tanggal Post:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-300 mb-1">Topic Tag:</label>
              <input
                type="text"
                value={topicTag}
                onChange={(e) => setTopicTag(e.target.value)}
                className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-300 mb-1">Jam Posting (WIB):</label>
              <select
                value={timeWIB}
                onChange={(e) => setTimeWIB(e.target.value)}
                className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
              >
                <option value="07.30 - 09.00 WIB">07.30 - 09.00 WIB (Pagi)</option>
                <option value="12.00 - 13.30 WIB">12.00 - 13.30 WIB (Siang)</option>
                <option value="19.30 - 22.30 WIB">19.30 - 22.30 WIB (Malam)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-neutral-300 mb-1">Views:</label>
              <input
                type="number"
                value={views}
                onChange={(e) => setViews(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-300 mb-1">Likes:</label>
              <input
                type="number"
                value={likes}
                onChange={(e) => setLikes(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-300 mb-1">Replies:</label>
              <input
                type="number"
                value={replies}
                onChange={(e) => setReplies(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-300 mb-1">Reply Depth (Cabang):</label>
              <input
                type="number"
                value={replyDepth}
                onChange={(e) => setReplyDepth(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-neutral-300 mb-1">Kunjungan Profil:</label>
              <input
                type="number"
                value={profileVisits}
                onChange={(e) => setProfileVisits(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-300 mb-1">Followers Baru:</label>
              <input
                type="number"
                value={follows}
                onChange={(e) => setFollows(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-300 mb-1">Interaksi 60 Menit Pertama:</label>
              <input
                type="number"
                value={first60}
                onChange={(e) => setFirst60(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25"
            >
              Simpan Data Metrik
            </button>
          </div>
        </form>
      )}

      {/* Table of Entries */}
      <div className="rounded-2xl border border-zinc-900 bg-zinc-950 overflow-hidden">
        <div className="p-4 border-b border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-zinc-100 uppercase tracking-wider text-[11px]">
                Riwayat Postingan Utas
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-300">
                {entries.length} Utas
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 mt-0.5 block">
              Ditarik dari Meta Threads Graph API · Target rasio RTL: &gt; 0,15
            </span>
          </div>

          {entries.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={requestClearAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition cursor-pointer"
                title="Hapus riwayat metrik yang tersimpan saat ini"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bersihkan Riwayat</span>
              </button>
            </div>
          )}
        </div>

        {/* Petunjuk Membaca Metrik */}
        <div className="px-4 py-2 bg-zinc-900/30 border-b border-zinc-900 text-[11px] text-zinc-400 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span>
              Views, Like, dan Reply ditarik otomatis dari Meta Insights. Velocity 60 dan Reply Depth dapat disesuaikan manual via tombol edit.
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-400 font-medium uppercase text-[10px] border-b border-zinc-900">
              <tr>
                <th className="p-3 min-w-[280px]">Konten Utas &amp; Waktu</th>
                <th className="p-3 text-right">Views</th>
                <th className="p-3 text-right">Like</th>
                <th className="p-3 text-right">Reply</th>
                <th className="p-3 text-right">RTL Ratio</th>
                <th className="p-3 text-right">Velocity 60</th>
                <th className="p-3 text-center min-w-[90px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 font-mono text-xs">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center font-sans text-zinc-400">
                    <p className="text-sm font-semibold text-zinc-200 mb-1">Belum Ada Data Utas</p>
                    <p className="text-xs text-zinc-400 mb-4 max-w-md mx-auto">
                      Tarik kumpulan postingan dari akun Threads Anda atau catat metrik secara manual.
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleSyncFromThreads}
                        disabled={isSyncing}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-950 transition cursor-pointer shadow-xs"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                        <span>Tarik Data Threads</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddForm(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Catat Manual</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                entries.map((item, idx) => {
                  const threadText = item.postText || item.notes || "";
                  return (
                    <tr key={`${item.id}_${idx}`} className="hover:bg-neutral-800/30 transition">
                      <td className="p-3 font-sans">
                        <div className="font-bold text-white text-xs leading-snug">
                          {item.topicTag}
                        </div>

                        {threadText && (
                          <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed max-w-xl font-normal">
                            {threadText}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-neutral-500 font-mono">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-neutral-400" />
                            <span>{item.date} • {item.timeWIB}</span>
                          </span>

                          {item.mediaType && (
                            <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 font-mono text-[9px]">
                              {item.mediaType}
                            </span>
                          )}

                          {item.permalink && (
                            <a
                              href={item.permalink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-sans font-semibold transition"
                              title="Buka postingan asli di threads.net"
                            >
                              <span>Buka di Threads</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-right font-semibold text-neutral-200">
                        {item.views > 0 ? (
                          item.views.toLocaleString()
                        ) : (
                          <span className="text-neutral-500 font-normal" title="0 views atau butuh izin threads_manage_insights">0</span>
                        )}
                      </td>

                      <td className="p-3 text-right text-rose-400 font-semibold">
                        {item.likes > 0 ? (
                          item.likes
                        ) : (
                          <span className="text-neutral-500 font-normal" title="0 likes">0</span>
                        )}
                      </td>

                      <td className="p-3 text-right text-indigo-400 font-bold">
                        {item.replies > 0 ? (
                          item.replies
                        ) : (
                          <span className="text-neutral-500 font-normal" title="0 replies">0</span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        {item.likes > 0 && item.replyToLike !== null ? (
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold ${
                              item.replyToLike >= 0.15
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-neutral-800 text-neutral-400"
                            }`}
                            title={`RTL Ratio: ${item.replies} balasan / ${item.likes} like`}
                          >
                            {item.replyToLike.toFixed(3)}
                          </span>
                        ) : (
                          <span
                            className="px-2 py-0.5 rounded-md text-neutral-500 bg-neutral-800/60 font-mono text-[11px]"
                            title="Butuh minimal 1 like untuk menghitung rasio Reply-to-Like. Klik edit (✏️) untuk mengisi."
                          >
                            -
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right text-neutral-400">
                        {item.velocity60 > 0 ? (
                          <span className="text-neutral-200 font-medium">{item.velocity60.toFixed(2)} /mnt</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingEntry(item)}
                            className="text-[11px] text-neutral-500 hover:text-indigo-400 transition cursor-pointer"
                            title="Meta API tidak mencatat 60 menit awal. Klik untuk isi manual."
                          >
                            0 /mnt <span className="text-[9px] text-indigo-400/80 underline ml-0.5">isi</span>
                          </button>
                        )}
                      </td>

                      <td className="p-3 text-center font-sans">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingEntry(item)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-indigo-300 hover:bg-neutral-800 transition cursor-pointer"
                            title="Edit metrik postingan ini"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDeleteEntry(item)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition cursor-pointer"
                            title="Hapus baris ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Metrik Cepat */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Edit Metrik Postingan Utas</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs space-y-1">
              <div className="font-bold text-white line-clamp-1">{editingEntry.topicTag}</div>
              <p className="text-[11px] text-neutral-400 line-clamp-2">
                {editingEntry.postText || editingEntry.notes || "Tidak ada cuplikan teks"}
              </p>
              <div className="text-[10px] text-neutral-500 font-mono pt-1">
                {editingEntry.date} • {editingEntry.timeWIB}
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              {/* Pratinjau Metrik Otomatis Real-time */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-[11px]">
                <div>
                  <span className="text-[10px] text-neutral-400 block font-sans">Kalkulasi RTL:</span>
                  <span className={`font-mono font-bold ${
                    editingEntry.likes > 0 && (editingEntry.replies / editingEntry.likes) >= 0.15
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }`}>
                    {editingEntry.likes > 0 ? (editingEntry.replies / editingEntry.likes).toFixed(3) : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block font-sans">Velocity 60:</span>
                  <span className="font-mono font-bold text-indigo-300">
                    {((editingEntry.first60MinInteractions || 0) / 60).toFixed(2)} /mnt
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block font-sans">Engagement:</span>
                  <span className="font-mono font-bold text-neutral-200">
                    {editingEntry.views > 0
                      ? (((editingEntry.likes + editingEntry.replies) / editingEntry.views) * 100).toFixed(1) + "%"
                      : "-"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Views:</label>
                  <input
                    type="number"
                    min="0"
                    value={editingEntry.views}
                    onChange={(e) =>
                      setEditingEntry({ ...editingEntry, views: Number(e.target.value) || 0 })
                    }
                    className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Likes:</label>
                  <input
                    type="number"
                    min="0"
                    value={editingEntry.likes}
                    onChange={(e) =>
                      setEditingEntry({ ...editingEntry, likes: Number(e.target.value) || 0 })
                    }
                    className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Replies:</label>
                  <input
                    type="number"
                    min="0"
                    value={editingEntry.replies}
                    onChange={(e) =>
                      setEditingEntry({ ...editingEntry, replies: Number(e.target.value) || 0 })
                    }
                    className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    Interaksi 60 Menit Awal:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingEntry.first60MinInteractions || 0}
                    onChange={(e) => {
                      const count = Number(e.target.value) || 0;
                      setEditingEntry({
                        ...editingEntry,
                        first60MinInteractions: count,
                        velocity60: Number((count / 60).toFixed(2)),
                      });
                    }}
                    placeholder="Contoh: 18"
                    className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white font-mono"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Menghitung Velocity = {((editingEntry.first60MinInteractions || 0) / 60).toFixed(2)}/mnt
                  </span>
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    Reply Depth (Cabang):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingEntry.replyDepth}
                    onChange={(e) =>
                      setEditingEntry({ ...editingEntry, replyDepth: Number(e.target.value) || 0 })
                    }
                    className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white font-mono"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Kedalaman balasan berantai
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-800 text-neutral-300 hover:bg-neutral-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog Konfirmasi Mandiri (Bypass window.confirm agar kompatibel dengan iframe) */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl border shrink-0 ${
                  confirmDialog.isDanger
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                    : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                }`}
              >
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">{confirmDialog.title}</h3>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  {confirmDialog.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  await confirmDialog.onConfirm();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition cursor-pointer ${
                  confirmDialog.isDanger
                    ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
                    : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20"
                }`}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
