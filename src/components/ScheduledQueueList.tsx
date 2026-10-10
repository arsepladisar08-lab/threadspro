import React, { useState, useEffect } from "react";
import { ScheduledThreadItem, ScheduledStatus, TimeSlotType } from "../types";
import { storage } from "../lib/storage";
import { threadsClient } from "../services/threadsClient";
import {
  formatWibDateTime,
  getTimeRemainingWib,
  calculateNextPrimeTime,
  PRIME_TIME_SLOTS,
} from "../lib/wibHelper";
import {
  Clock,
  Send,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Calendar,
  Sparkles,
  ChevronRight,
  X,
  Edit3,
} from "lucide-react";

interface ScheduledQueueListProps {
  onScheduleNew?: () => void;
  className?: string;
}

export const ScheduledQueueList: React.FC<ScheduledQueueListProps> = ({
  onScheduleNew,
  className = "",
}) => {
  const [queue, setQueue] = useState<ScheduledThreadItem[]>([]);
  const [filter, setFilter] = useState<"all" | "queued" | "published" | "failed">("all");
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ScheduledThreadItem | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotType>("malam");
  const [daysOffset, setDaysOffset] = useState<number>(0);
  const [isTriggeringWorker, setIsTriggeringWorker] = useState(false);

  useEffect(() => {
    loadQueue();

    // Listen to updates from storage
    const handleUpdate = () => loadQueue();
    window.addEventListener("autothreads_queue_updated", handleUpdate);

    // Refresh countdown every 30 seconds
    const interval = setInterval(() => {
      setQueue((prev) => [...prev]);
    }, 30000);

    return () => {
      window.removeEventListener("autothreads_queue_updated", handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const loadQueue = async () => {
    const list = await storage.getScheduledQueue();
    setQueue(list);
  };

  const handlePublishNow = async (item: ScheduledThreadItem) => {
    setPublishingId(item.id);
    setErrorMessage(null);
    try {
      await storage.updateScheduledStatus(item.id, "publishing");
      const variant = item.variant;
      const res = await threadsClient.publishThread({
        text: variant.posts[0]?.text || "",
        posts: variant.posts,
        topicTag: variant.topic_tag,
        reply2Text: variant.reply_2?.text,
        replyMode: item.replyMode ?? "chain",
        imageUrls: variant.visual_slides,
        isCarousel: Boolean(variant.visual_slides && variant.visual_slides.length > 1),
      });

      await storage.updateScheduledStatus(item.id, "published", {
        publishedAt: Date.now(),
        permalink: res.permalink,
      });

      setSuccessNotice("Utas berhasil dipublikasikan sekarang!");
      setTimeout(() => setSuccessNotice(null), 3000);
      await loadQueue();
    } catch (err: any) {
      console.error("Gagal posting sekarang:", err);
      const errMsg = err.message || "Gagal mempublikasikan ke Threads.";
      await storage.updateScheduledStatus(item.id, "failed", {
        errorMessage: errMsg,
        retryCount: (item.retryCount || 0) + 1,
      });
      setErrorMessage(errMsg);
      await loadQueue();
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    await storage.removeScheduledThread(id);
    await loadQueue();
  };

  const handleUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const newTargetIso = calculateNextPrimeTime(selectedSlot, daysOffset);
    await storage.updateScheduledStatus(editingItem.id, "queued", {
      scheduledTimeISO: newTargetIso,
      timeSlot: selectedSlot,
      errorMessage: undefined,
    });

    setEditingItem(null);
    setSuccessNotice("Jadwal tayang berhasil diperbarui!");
    setTimeout(() => setSuccessNotice(null), 3000);
    await loadQueue();
  };

  const handleTriggerWorker = async () => {
    setIsTriggeringWorker(true);
    setErrorMessage(null);
    try {
      const currentQueue = await storage.getScheduledQueue();
      const token = await storage.getThreadsToken();

      const res = await fetch("/api/cron/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          queue: currentQueue,
          accessToken: token,
        }),
      });

      const data = await res.json();
      if (data.results && Array.isArray(data.results)) {
        for (const r of data.results) {
          if (r.status === "published") {
            await storage.updateScheduledStatus(r.id, "published", {
              publishedAt: r.publishedAt || Date.now(),
              permalink: r.permalink,
            });
          } else if (r.status === "failed") {
            await storage.updateScheduledStatus(r.id, "failed", {
              errorMessage: r.errorMessage,
              retryCount: r.retryCount,
            });
          }
        }
      }

      await loadQueue();
      setSuccessNotice(`Pemeriksaan selesai: ${data.message || "Antrean tersinkronisasi."}`);
      setTimeout(() => setSuccessNotice(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menghubungi worker scheduler.");
    } finally {
      setIsTriggeringWorker(false);
    }
  };

  const filteredQueue = queue.filter((item) => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  const queuedCount = queue.filter((i) => i.status === "queued").length;
  const publishedCount = queue.filter((i) => i.status === "published").length;
  const failedCount = queue.filter((i) => i.status === "failed").length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Calm Header & Worker Sync Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-900 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <span>Antrean Jadwal Otomatis (WIB)</span>
          </h2>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            Draf yang dijadwalkan akan dieksekusi pada jam prime-time WIB tanpa perlu membuka web manual.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTriggerWorker}
            disabled={isTriggeringWorker}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-white bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-850 border border-zinc-300 dark:border-zinc-800 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Cek & jalankan item antrean yang sudah jatuh tempo sekarang"
          >
            <RefreshCw className={`w-3 h-3 ${isTriggeringWorker ? "animate-spin" : ""}`} />
            <span>{isTriggeringWorker ? "Memeriksa..." : "Cek Jatuh Tempo"}</span>
          </button>

          {onScheduleNew && (
            <button
              type="button"
              onClick={onScheduleNew}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-white dark:text-zinc-950 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white transition flex items-center gap-1 cursor-pointer"
            >
              <span>+ Jadwal Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Notices */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-zinc-500 dark:text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {successNotice && (
        <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessNotice(null)}
            className="text-zinc-500 dark:text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Calm Status Tabs */}
      <div className="flex items-center gap-1 p-0.5 rounded-xl bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-900 text-xs w-fit">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-lg transition cursor-pointer ${
            filter === "all"
              ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          Semua ({queue.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("queued")}
          className={`px-3 py-1 rounded-lg transition cursor-pointer ${
            filter === "queued"
              ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          Menunggu ({queuedCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("published")}
          className={`px-3 py-1 rounded-lg transition cursor-pointer ${
            filter === "published"
              ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          Terbit ({publishedCount})
        </button>
        {failedCount > 0 && (
          <button
            type="button"
            onClick={() => setFilter("failed")}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              filter === "failed"
                ? "bg-zinc-200 dark:bg-zinc-800 text-rose-700 dark:text-rose-300 font-medium"
                : "text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300"
            }`}
          >
            Gagal ({failedCount})
          </button>
        )}
      </div>

      {/* Queue Items List */}
      {filteredQueue.length === 0 ? (
        <div className="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white/40 dark:bg-zinc-950/40 text-center space-y-2">
          <Clock className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Belum ada antrean jadwal</p>
          <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
            Gunakan tombol "Jadwalkan ke Antrean" di Kalender Konten atau di Generator Utas untuk menjadwalkan draf ke slot prime-time WIB.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQueue.map((item) => {
            const isPublishing = publishingId === item.id;
            const remaining = getTimeRemainingWib(item.scheduledTimeISO);
            const mainText = item.variant?.posts?.[0]?.text || "Konten draf...";
            const topic = item.variant?.topic_tag?.replace(/#/g, "") || "Threads";

            return (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-900 bg-zinc-100/30 dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-800 transition space-y-3"
              >
                {/* Item Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    {item.status === "queued" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-[11px]">
                        <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>Menunggu · {remaining.text}</span>
                      </span>
                    )}

                    {item.status === "publishing" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-medium text-[11px] animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Sedang Memposting...</span>
                      </span>
                    )}

                    {item.status === "published" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium text-[11px]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Terbit</span>
                      </span>
                    )}

                    {item.status === "failed" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium text-[11px]">
                        <AlertCircle className="w-3 h-3" />
                        <span>Gagal ({item.retryCount || 1}x)</span>
                      </span>
                    )}

                    {/* Slot badge */}
                    <span className="text-[11px] text-zinc-500 font-mono">
                      Slot {item.timeSlot}
                    </span>
                  </div>

                  {/* Target WIB Time */}
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                    {formatWibDateTime(item.scheduledTimeISO)}
                  </div>
                </div>

                {/* Content Preview */}
                <div className="p-3 rounded-lg bg-white/60 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-900 text-xs text-zinc-800 dark:text-zinc-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-medium">
                    <span>Topik: {topic}</span>
                    <span>{mainText.length}/500 karakter</span>
                  </div>
                  <p className="line-clamp-2 leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {mainText}
                  </p>
                  {item.variant?.reply_2?.text && (
                    <p className="text-[11px] text-zinc-500 truncate pt-1 border-t border-zinc-200 dark:border-zinc-900">
                      Reply #2: {item.variant.reply_2.text}
                    </p>
                  )}
                </div>

                {/* Error message detail if failed */}
                {item.errorMessage && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 p-2 rounded-lg border border-rose-200 dark:border-rose-900/50">
                    Error: {item.errorMessage}
                  </p>
                )}

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex items-center gap-2">
                    {item.status === "published" && item.permalink ? (
                      <a
                        href={item.permalink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-white transition"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Lihat di Threads</span>
                      </a>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handlePublishNow(item)}
                          disabled={isPublishing}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 font-semibold text-xs transition cursor-pointer disabled:opacity-40"
                        >
                          <Send className="w-3 h-3" />
                          <span>{isPublishing ? "Memposting..." : "Posting Sekarang"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setSelectedSlot(item.timeSlot);
                            setDaysOffset(0);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition text-xs"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Ubah Waktu</span>
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
                    title="Hapus dari antrean"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Schedule Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm p-5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-900">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Ubah Waktu Tayang (WIB)</h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSchedule} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-500 dark:text-zinc-400 mb-1 font-medium">Hari Penayangan:</label>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setDaysOffset(0)}
                    className={`py-1.5 rounded-lg text-xs font-medium transition ${
                      daysOffset === 0
                        ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setDaysOffset(1)}
                    className={`py-1.5 rounded-lg text-xs font-medium transition ${
                      daysOffset === 1
                        ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    Besok
                  </button>
                  <button
                    type="button"
                    onClick={() => setDaysOffset(2)}
                    className={`py-1.5 rounded-lg text-xs font-medium transition ${
                      daysOffset === 2
                        ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    Lusa
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 dark:text-zinc-400 mb-1 font-medium">Slot Prime-Time WIB:</label>
                <div className="space-y-1.5">
                  {(["pagi", "siang", "malam"] as TimeSlotType[]).map((slot) => {
                    const info = PRIME_TIME_SLOTS[slot as keyof typeof PRIME_TIME_SLOTS];
                    const isSelected = selectedSlot === slot;

                    return (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                          isSelected
                            ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                            : "bg-zinc-100/30 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-900 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-800"
                        }`}
                      >
                        <div>
                          <div className="font-medium text-xs capitalize">{info.label}</div>
                          <div className="text-[10px] text-zinc-500">{info.windowDesc}</div>
                        </div>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-semibold hover:bg-zinc-800 dark:hover:bg-white"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
