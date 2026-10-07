import React, { useState, useEffect } from "react";
import { VariantOutput, ScheduledThreadItem, TimeSlotType } from "../types";
import { threadsClient, ThreadsAccount } from "../services/threadsClient";
import { storage } from "../lib/storage";
import { ThreadsConnectModal } from "./ThreadsConnectModal";
import { calculateNextPrimeTime, formatWibDateTime, PRIME_TIME_SLOTS } from "../lib/wibHelper";
import {
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Key,
  Images,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Palette,
  Layers,
  Sparkles,
  Clock,
} from "lucide-react";

interface Props {
  variant: VariantOutput;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (permalink: string) => void;
  onRequestOpenVisualGenerator?: () => void;
}

export const PublishModal: React.FC<Props> = ({
  variant,
  isOpen,
  onClose,
  onSuccess,
  onRequestOpenVisualGenerator,
}) => {
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ permalink: string; isScheduled?: boolean; scheduledTime?: string } | null>(null);
  const [account, setAccount] = useState<ThreadsAccount | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // Publish Mode: "now" | "schedule"
  const [publishMode, setPublishMode] = useState<"now" | "schedule">("now");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotType>("malam");
  const [daysOffset, setDaysOffset] = useState<number>(0);

  // Visual Carousel States
  const hasVisualSlides = Array.isArray(variant.visual_slides) && variant.visual_slides.length > 0;
  const [includeVisuals, setIncludeVisuals] = useState<boolean>(hasVisualSlides);
  const [previewSlideIdx, setPreviewSlideIdx] = useState<number>(0);
  const [progressStatus, setProgressStatus] = useState<string>("Mempersiapkan penerbitan...");

  useEffect(() => {
    if (isOpen) {
      threadsClient.getAccount().then(setAccount);
      setError(null);
      setResult(null);
      setPublishMode("now");
      setIncludeVisuals(Array.isArray(variant.visual_slides) && variant.visual_slides.length > 0);
      setPreviewSlideIdx(0);
      setProgressStatus("Mempersiapkan penerbitan...");
    }
  }, [isOpen, variant]);

  if (!isOpen) return null;

  const mainPostText = variant.posts[0]?.text || "";
  const topicTag = variant.topic_tag.replace(/#/g, "").trim();
  const reply2Text = variant.reply_2?.text || "";
  const visualSlides = variant.visual_slides || [];

  const handleAction = async () => {
    if (publishMode === "schedule") {
      // Jadwalkan ke Antrean
      try {
        const targetIso = calculateNextPrimeTime(selectedSlot, daysOffset);
        const item: ScheduledThreadItem = {
          id: `sched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          variant,
          scheduledTimeISO: targetIso,
          timeSlot: selectedSlot,
          status: "queued",
          retryCount: 0,
          createdAt: Date.now(),
        };

        await storage.saveScheduledThread(item);
        setResult({
          permalink: "",
          isScheduled: true,
          scheduledTime: formatWibDateTime(targetIso),
        });
      } catch (err: any) {
        setError(err.message || "Gagal menjadwalkan ke antrean.");
      }
      return;
    }

    // Publish Langsung
    if (!account) {
      setError("Silakan hubungkan akun Threads Anda terlebih dahulu menggunakan Token Akses.");
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      let finalImageUrls: string[] | undefined = undefined;

      if (includeVisuals && visualSlides.length > 0) {
        setProgressStatus(`Mengunggah ${visualSlides.length} slide visual ke server publik...`);
        const uploadedUrls = await threadsClient.uploadCanvasImages(visualSlides);
        finalImageUrls = uploadedUrls;
      }

      const res = await threadsClient.publishThread({
        text: mainPostText,
        topicTag,
        reply2Text: reply2Text || undefined,
        imageUrls: finalImageUrls,
        isCarousel: finalImageUrls ? finalImageUrls.length > 1 : false,
        onProgress: (stepMsg) => {
          setProgressStatus(stepMsg);
        },
      });

      setResult({ permalink: res.permalink });
      if (onSuccess) onSuccess(res.permalink);
    } catch (e: any) {
      setError(e.message || "Gagal memposting ke Threads.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
        <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-850 rounded-2xl shadow-2xl p-5 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col text-left">
          {/* Close Button */}
          <button
            onClick={onClose}
            disabled={publishing}
            className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2.5 mb-4 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold text-sm">
              @
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <span>Publikasikan Utas ke Threads</span>
                {includeVisuals && visualSlides.length > 0 && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
                    {visualSlides.length > 1 ? "Carousel" : "Single Image"}
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-400">Pilih publikasi langsung atau antrean prime-time WIB otomatis</p>
            </div>
          </div>

          {result ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">
                  {result.isScheduled ? "Berhasil Dijadwalkan ke Antrean!" : "Berhasil Diposting ke Threads!"}
                </h4>
                <p className="text-xs text-zinc-400 mt-1">
                  {result.isScheduled
                    ? `Draf Anda akan dipublikasikan secara otomatis pada ${result.scheduledTime}.`
                    : "Utas telah berhasil dipublikasikan di akun Threads Anda."}
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                {result.permalink ? (
                  <a
                    href={result.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-950 hover:bg-white transition"
                  >
                    <span>Lihat di Threads</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : null}
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-850 text-zinc-300 transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              {/* Account State Banner */}
              {account ? (
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-850 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    {account.threads_profile_picture_url ? (
                      <img
                        src={account.threads_profile_picture_url}
                        alt={account.username}
                        className="w-7 h-7 rounded-full border border-zinc-800 object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-bold">
                        @
                      </div>
                    )}
                    <div>
                      <span className="text-zinc-400">Akun tujuan: </span>
                      <span className="font-semibold text-zinc-200">@{account.username}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                    Terhubung
                  </span>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-amber-200">Akun Threads Belum Terhubung</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Hubungkan akun Anda untuk memposting secara langsung.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsConnectModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium bg-zinc-100 text-zinc-950 hover:bg-white text-xs shrink-0 transition cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Hubungkan Akun</span>
                  </button>
                </div>
              )}

              {/* Publish Mode Selector (Now vs Queue) */}
              <div className="space-y-1.5">
                <label className="block text-zinc-300 font-medium">Metode Publikasi:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPublishMode("now")}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      publishMode === "now"
                        ? "bg-zinc-900 border-zinc-600 text-zinc-100"
                        : "bg-zinc-900/30 border-zinc-900 text-zinc-400 hover:border-zinc-800"
                    }`}
                  >
                    <div className="font-semibold flex items-center gap-1.5 text-xs">
                      <Send className="w-3.5 h-3.5" />
                      <span>Posting Sekarang</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Kirim langsung ke feed Threads Anda saat ini juga.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPublishMode("schedule")}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      publishMode === "schedule"
                        ? "bg-zinc-900 border-zinc-600 text-zinc-100"
                        : "bg-zinc-900/30 border-zinc-900 text-zinc-400 hover:border-zinc-800"
                    }`}
                  >
                    <div className="font-semibold flex items-center gap-1.5 text-xs">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Jadwalkan Prime-Time</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Antrekan ke jam prime-time WIB (08.00 / 12.30 / 20.00 WIB).
                    </p>
                  </button>
                </div>
              </div>

              {/* Schedule slot options if in schedule mode */}
              {publishMode === "schedule" && (
                <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-850 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium">Slot Waktu Prime-Time WIB:</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setDaysOffset(0)}
                        className={`px-2 py-0.5 rounded text-[11px] ${
                          daysOffset === 0 ? "bg-zinc-800 text-white font-medium" : "text-zinc-400"
                        }`}
                      >
                        Hari Ini
                      </button>
                      <button
                        type="button"
                        onClick={() => setDaysOffset(1)}
                        className={`px-2 py-0.5 rounded text-[11px] ${
                          daysOffset === 1 ? "bg-zinc-800 text-white font-medium" : "text-zinc-400"
                        }`}
                      >
                        Besok
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {(["pagi", "siang", "malam"] as TimeSlotType[]).map((slot) => {
                      const isSel = selectedSlot === slot;
                      const times = { pagi: "08.00 WIB", siang: "12.30 WIB", malam: "20.00 WIB" };
                      return (
                        <button
                          type="button"
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                            isSel
                              ? "bg-zinc-800 border-zinc-600 text-white font-semibold"
                              : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-750"
                          }`}
                        >
                          <div className="capitalize">{slot}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{times[slot as "pagi" | "siang" | "malam"]}</div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-900">
                    <span>Estimasi Tayang:</span>
                    <span className="font-mono text-zinc-200">
                      {formatWibDateTime(calculateNextPrimeTime(selectedSlot, daysOffset))}
                    </span>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="p-3 rounded-xl bg-zinc-900 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Post 1 Caption Preview */}
              <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-zinc-850 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="font-medium text-zinc-300">Teks Postingan Utama (#1)</span>
                  <span>{mainPostText.length}/500 karakter</span>
                </div>
                <p className="text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto">
                  {mainPostText}
                </p>
              </div>

              {/* Topic Tag */}
              <div className="p-2.5 rounded-xl bg-zinc-900/30 border border-zinc-850 flex items-center justify-between">
                <span className="text-xs text-zinc-400">Topic Tag:</span>
                <span className="font-medium text-zinc-200 text-xs">
                  {topicTag || "Umum"}
                </span>
              </div>

              {/* Reply 2 Preview */}
              {reply2Text && (
                <div className="p-3 rounded-xl bg-zinc-900/30 border border-zinc-850 space-y-1">
                  <span className="font-medium text-zinc-400 text-[11px]">Reply ke-2 (Otomatis):</span>
                  <p className="text-xs text-zinc-300 leading-relaxed truncate">{reply2Text}</p>
                </div>
              )}

              {/* Status Step-by-Step saat Publishing */}
              {publishing && (
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-700 space-y-2">
                  <div className="flex items-center gap-2 text-zinc-200 text-xs font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                    <span>{progressStatus}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    Meta Threads memproses container media sebelum dipublikasikan. Mohon tunggu beberapa detik...
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={publishing}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-850 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAction}
                  disabled={publishing || (publishMode === "now" && !account)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-950 transition disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sedang Menerbitkan...</span>
                    </>
                  ) : publishMode === "schedule" ? (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>Tambahkan ke Antrean</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Posting Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connect Modal */}
      <ThreadsConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnected={(acc) => {
          setAccount(acc);
          setIsConnectModalOpen(false);
        }}
      />
    </>
  );
};
