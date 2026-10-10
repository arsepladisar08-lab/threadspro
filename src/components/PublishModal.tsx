import React, { useState, useEffect, useMemo } from "react";
import { VariantOutput, ScheduledThreadItem, TimeSlotType } from "../types";
import { threadsClient, ThreadsAccount } from "../services/threadsClient";
import { storage } from "../lib/storage";
import { ThreadsConnectModal } from "./ThreadsConnectModal";
import { AttachedMedia, uploadAttachments } from "../services/mediaUpload";
import { calculateNextPrimeTime, formatWibDateTime } from "../lib/wibHelper";
import {
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Key,
  Layers,
  Clock,
  ListChecks,
  Check,
  Film,
  Image as ImageIcon,
  CheckSquare,
  Square,
} from "lucide-react";

interface Props {
  variant: VariantOutput;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (permalink: string) => void;
  /** Lampiran media global opsional (untuk kompatibilitas) */
  attachments?: AttachedMedia[];
}

export interface PostChoiceItem {
  id: string;
  order: number;
  label: string;
  text: string;
  attachments: AttachedMedia[];
  isRoot: boolean;
}

const NO_ATTACHMENTS: AttachedMedia[] = [];

export const PublishModal: React.FC<Props> = ({
  variant,
  isOpen,
  onClose,
  onSuccess,
  attachments = NO_ATTACHMENTS,
}) => {
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    permalink: string;
    isScheduled?: boolean;
    scheduledTime?: string;
    publishedCount?: number;
  } | null>(null);
  const [account, setAccount] = useState<ThreadsAccount | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // Publish Mode: "now" | "schedule"
  const [publishMode, setPublishMode] = useState<"now" | "schedule">("now");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotType>("malam");
  const [daysOffset, setDaysOffset] = useState<number>(0);

  // Opsi Posting: "all" (Posting Semua) | "custom" (Pilih Beberapa)
  const [postingScope, setPostingScope] = useState<"all" | "custom">("all");
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);

  // Struktur balasan: "root" = Post #2 dst. membalas langsung Post #1; "chain" = berantai
  const [replyMode, setReplyMode] = useState<"root" | "chain">("root");

  const [progressStatus, setProgressStatus] = useState<string>("Mempersiapkan penerbitan...");

  // Susun daftar semua postingan yang ada dalam varian ini
  const postChoiceItems: PostChoiceItem[] = useMemo(() => {
    const items: PostChoiceItem[] = [];

    (variant.posts || []).forEach((p, idx) => {
      // Prioritaskan lampiran media dari post itu sendiri, atau fallback ke attachments global untuk Post #1
      const postAttachments =
        p.mediaAttachments && p.mediaAttachments.length > 0
          ? p.mediaAttachments
          : idx === 0 && attachments && attachments.length > 0
          ? attachments
          : [];

      items.push({
        id: `post_${idx}`,
        order: idx + 1,
        label: idx === 0 ? "Post Utama (#1)" : `Reply ke-${idx + 1}`,
        text: p.text || "",
        attachments: postAttachments,
        isRoot: idx === 0,
      });
    });

    if (variant.reply_2 && variant.reply_2.text) {
      const replyNum = (variant.posts?.length || 0) + 1;
      const currentVarGoal = (variant.goal || "").toLowerCase();
      const subLabel =
        currentVarGoal === "konversi"
          ? "CTA Konversi"
          : currentVarGoal === "kedekatan"
          ? "Refleksi Komunitas"
          : "Pemantik Diskusi";

      items.push({
        id: "reply_2",
        order: replyNum,
        label: `Reply ke-${replyNum} (${subLabel})`,
        text: variant.reply_2.text,
        attachments: variant.reply_2.mediaAttachments || [],
        isRoot: false,
      });
    }

    return items;
  }, [variant, attachments]);

  useEffect(() => {
    if (isOpen) {
      threadsClient.getAccount().then(setAccount);
      setError(null);
      setResult(null);
      setPublishMode("now");
      setPostingScope("all");
      setSelectedPostIds(postChoiceItems.map((p) => p.id));
      setProgressStatus("Mempersiapkan penerbitan...");
    }
  }, [isOpen, variant, postChoiceItems]);

  if (!isOpen) return null;

  const topicTag = variant.topic_tag.replace(/#/g, "").trim();

  // Postingan yang aktif berdasarkan opsi "all" atau "custom"
  const activeSelectedPosts: PostChoiceItem[] =
    postingScope === "all"
      ? postChoiceItems
      : postChoiceItems.filter((p) => selectedPostIds.includes(p.id));

  const totalSelectedMediaCount = activeSelectedPosts.reduce(
    (sum, p) => sum + (p.attachments?.length || 0),
    0
  );

  const togglePostSelection = (id: string) => {
    if (selectedPostIds.includes(id)) {
      setSelectedPostIds(selectedPostIds.filter((pId) => pId !== id));
    } else {
      setSelectedPostIds([...selectedPostIds, id]);
    }
  };

  const selectAllPosts = () => {
    setSelectedPostIds(postChoiceItems.map((p) => p.id));
  };

  const selectOnlyMainPost = () => {
    const main = postChoiceItems.find((p) => p.isRoot);
    if (main) {
      setSelectedPostIds([main.id]);
    }
  };

  const handleAction = async () => {
    if (activeSelectedPosts.length === 0) {
      setError("Pilih minimal 1 postingan untuk dipublikasikan.");
      return;
    }

    if (publishMode === "schedule") {
      if (totalSelectedMediaCount > 0) {
        setError(
          'Lampiran media belum didukung untuk jadwal otomatis. Pilih "Posting Sekarang" atau hapus lampiran dari postingan.'
        );
        return;
      }

      // Jadwalkan ke Antrean
      try {
        const targetIso = calculateNextPrimeTime(selectedSlot, daysOffset);

        // Jika user memilih sebagian post, buat draf varian yang disesuaikan
        const filteredPosts = activeSelectedPosts.filter((p) => p.id !== "reply_2").map((p, idx) => ({
          order: idx + 1,
          text: p.text,
          char_count: p.text.length,
        }));

        const isReply2Selected = activeSelectedPosts.some((p) => p.id === "reply_2");
        const reply2Item = isReply2Selected ? activeSelectedPosts.find((p) => p.id === "reply_2") : undefined;

        const scheduledVariant: VariantOutput = {
          ...variant,
          posts: filteredPosts.length > 0 ? filteredPosts : [
            {
              order: 1,
              text: activeSelectedPosts[0].text,
              char_count: activeSelectedPosts[0].text.length,
            }
          ],
          reply_2: reply2Item
            ? {
                text: reply2Item.text,
                contains_link: variant.reply_2?.contains_link || false,
              }
            : {
                text: "",
                contains_link: false,
              },
        };

        const item: ScheduledThreadItem = {
          id: `sched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          variant: scheduledVariant,
          scheduledTimeISO: targetIso,
          timeSlot: selectedSlot,
          status: "queued",
          retryCount: 0,
          createdAt: Date.now(),
          replyMode,
        };

        await storage.saveScheduledThread(item);
        setResult({
          permalink: "",
          isScheduled: true,
          scheduledTime: formatWibDateTime(targetIso),
          publishedCount: activeSelectedPosts.length,
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
      // 1. Unggah media untuk tiap postingan terpilih yang memiliki lampiran
      const preparedPosts: Array<{
        order: number;
        text: string;
        media?: Array<{ url: string; type: "IMAGE" | "VIDEO" }>;
      }> = [];

      for (let i = 0; i < activeSelectedPosts.length; i++) {
        const item = activeSelectedPosts[i];
        let uploadedMedia: Array<{ url: string; type: "IMAGE" | "VIDEO" }> = [];

        if (item.attachments && item.attachments.length > 0) {
          setProgressStatus(`Mengunggah lampiran untuk ${item.label}...`);
          uploadedMedia = await uploadAttachments(item.attachments, (step) => {
            setProgressStatus(`[${item.label}] ${step}`);
          });
        }

        preparedPosts.push({
          order: i + 1,
          text: item.text,
          media: uploadedMedia.length > 0 ? uploadedMedia : undefined,
        });
      }

      // 2. Terbitkan ke Meta Threads
      const res = await threadsClient.publishThread({
        posts: preparedPosts,
        topicTag,
        replyMode,
        onProgress: (stepMsg) => {
          setProgressStatus(stepMsg);
        },
      });

      setResult({
        permalink: res.permalink,
        publishedCount: res.publishedCount,
      });

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
        <div className="relative w-full max-w-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-2xl p-5 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col text-left">
          {/* Close Button */}
          <button
            onClick={onClose}
            disabled={publishing}
            className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg transition cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2.5 mb-4 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center font-bold text-sm">
              @
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Publikasikan ke Threads</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Pilih posting seluruh utas atau sebagian, langsung atau jadwalkan otomatis
              </p>
            </div>
          </div>

          {result ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {result.isScheduled
                    ? "Berhasil Dijadwalkan ke Antrean!"
                    : "Berhasil Diposting ke Threads!"}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
                  {result.isScheduled
                    ? `Draf (${result.publishedCount || activeSelectedPosts.length} post) akan dipublikasikan secara otomatis pada ${result.scheduledTime}.`
                    : `Sebanyak ${result.publishedCount || activeSelectedPosts.length} postingan telah sukses dipublikasikan di akun Threads Anda.`}
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                {result.permalink ? (
                  <a
                    href={result.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-white transition"
                  >
                    <span>Buka di Threads</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : null}
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              {/* Account State Banner */}
              {account ? (
                <div className="p-3 rounded-xl bg-zinc-100/60 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-850 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    {account.threads_profile_picture_url ? (
                      <img
                        src={account.threads_profile_picture_url}
                        alt={account.username}
                        className="w-7 h-7 rounded-full border border-zinc-300 dark:border-zinc-800 object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-xs font-bold">
                        @
                      </div>
                    )}
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Akun tujuan: </span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        @{account.username}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                    Terhubung
                  </span>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-amber-800 dark:text-amber-200">
                      Akun Threads Belum Terhubung
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Hubungkan akun Anda untuk memposting secara langsung.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsConnectModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-white text-xs shrink-0 transition cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Hubungkan Akun</span>
                  </button>
                </div>
              )}

              {/* OPSI POSTING: Posting Semua vs Pilih Beberapa */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-700 dark:text-zinc-300 font-medium">
                    Opsi Posting:
                  </label>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                    {activeSelectedPosts.length} dari {postChoiceItems.length} post dipilih
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPostingScope("all");
                      setSelectedPostIds(postChoiceItems.map((p) => p.id));
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      postingScope === "all"
                        ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-400 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100"
                        : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Posting Semua</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {postChoiceItems.length} Post
                      </span>
                    </div>
                    <div className="text-[11px] mt-1 opacity-80 leading-relaxed">
                      Publikasikan seluruh utas lengkap secara berurutan.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPostingScope("custom");
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      postingScope === "custom"
                        ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-400 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100"
                        : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs">
                        <ListChecks className="w-3.5 h-3.5" />
                        <span>Pilih Beberapa</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        Pilihan
                      </span>
                    </div>
                    <div className="text-[11px] mt-1 opacity-80 leading-relaxed">
                      Centang postingan tertentu yang ingin dipublikasikan.
                    </div>
                  </button>
                </div>
              </div>

              {/* Detail Checklist jika Pilih Beberapa */}
              {postingScope === "custom" && (
                <div className="p-3 rounded-xl bg-zinc-100/40 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-850 space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-200/80 dark:border-zinc-800/80">
                    <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                      Pilih postingan yang akan diterbitkan:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={selectAllPosts}
                        className="text-[10px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 underline cursor-pointer"
                      >
                        Semua
                      </button>
                      <span className="text-zinc-400">·</span>
                      <button
                        type="button"
                        onClick={selectOnlyMainPost}
                        className="text-[10px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 underline cursor-pointer"
                      >
                        Hanya Post Utama
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {postChoiceItems.map((item) => {
                      const isChecked = selectedPostIds.includes(item.id);
                      const hasAttachments = item.attachments && item.attachments.length > 0;
                      const imgCount = item.attachments?.filter((a) => a.kind === "image").length || 0;
                      const vidCount = item.attachments?.filter((a) => a.kind === "video").length || 0;

                      return (
                        <div
                          key={item.id}
                          onClick={() => togglePostSelection(item.id)}
                          className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex items-start gap-2.5 ${
                            isChecked
                              ? "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 shadow-2xs"
                              : "bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-850 opacity-60 hover:opacity-90"
                          }`}
                        >
                          <div className="pt-0.5 shrink-0">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                            ) : (
                              <Square className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`font-semibold text-xs ${
                                  isChecked
                                    ? "text-zinc-900 dark:text-zinc-100"
                                    : "text-zinc-500 dark:text-zinc-400"
                                }`}
                              >
                                {item.label}
                              </span>

                              <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-zinc-500 dark:text-zinc-400">
                                <span>{item.text.length} char</span>
                                {hasAttachments && (
                                  <span className="px-1.5 py-0.2 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium flex items-center gap-1">
                                    {vidCount > 0 ? (
                                      <Film className="w-2.5 h-2.5" />
                                    ) : (
                                      <ImageIcon className="w-2.5 h-2.5" />
                                    )}
                                    <span>
                                      {item.attachments.length} media
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>

                            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-1 leading-snug">
                              {item.text}
                            </p>

                            {/* Mini Thumbnail Strip if has attachments */}
                            {hasAttachments && (
                              <div className="flex items-center gap-1 mt-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-850">
                                {item.attachments.map((att) => (
                                  <div
                                    key={att.id}
                                    className="w-6 h-6 rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0 border border-zinc-300 dark:border-zinc-700"
                                  >
                                    {att.kind === "video" ? (
                                      <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-white text-[8px]">
                                        <Film className="w-3 h-3" />
                                      </div>
                                    ) : (
                                      <img
                                        src={att.previewUrl}
                                        alt={att.file.name}
                                        className="w-full h-full object-cover"
                                      />
                                    )}
                                  </div>
                                ))}
                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 ml-1">
                                  {imgCount > 0 && `${imgCount} foto`}
                                  {imgCount > 0 && vidCount > 0 && ", "}
                                  {vidCount > 0 && `${vidCount} video`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {activeSelectedPosts.length === 0 && (
                    <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Harap centang minimal 1 postingan untuk diterbitkan.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Ringkasan Media yang Disertakan */}
              {totalSelectedMediaCount > 0 && (
                <div className="p-3 rounded-xl bg-zinc-100/60 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-850 text-zinc-700 dark:text-zinc-300 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Lampiran Media ({totalSelectedMediaCount})</span>
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {activeSelectedPosts.filter((p) => p.attachments?.length > 0).length} post memiliki media
                    </span>
                  </div>
                  <ul className="text-[11px] text-zinc-500 dark:text-zinc-400 space-y-0.5 pt-0.5">
                    {activeSelectedPosts
                      .filter((p) => p.attachments?.length > 0)
                      .map((p) => (
                        <li key={p.id} className="flex items-center justify-between">
                          <span>{p.label}:</span>
                          <span className="font-mono text-zinc-700 dark:text-zinc-300">
                            {p.attachments.length} media
                            {p.attachments.length > 1 ? " (carousel)" : ""}
                          </span>
                        </li>
                      ))}
                  </ul>
                  {publishMode === "schedule" && (
                    <div className="mt-1 text-[11px] text-amber-700 dark:text-amber-300 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                      Lampiran belum bisa dijadwalkan otomatis. Pilih &ldquo;Posting Sekarang&rdquo;.
                    </div>
                  )}
                </div>
              )}

              {/* Struktur Balasan (jika lebih dari 1 post dipilih) */}
              {activeSelectedPosts.length > 1 && (
                <div className="space-y-1.5">
                  <label className="block text-zinc-700 dark:text-zinc-300 font-medium">
                    Struktur Balasan:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        [
                          "root",
                          "Balasan ke Post Pertama",
                          "Semua balasan menempel langsung ke postingan pertama terpilih",
                        ],
                        ["chain", "Berantai", "Tiap post membalas post sebelumnya secara berurutan"],
                      ] as const
                    ).map(([mode, title, desc]) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setReplyMode(mode)}
                        aria-pressed={replyMode === mode}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          replyMode === mode
                            ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-400 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100"
                            : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                        }`}
                      >
                        <div className="font-semibold">{title}</div>
                        <div className="text-[11px] mt-0.5 opacity-80">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Publish Mode Selector (Now vs Queue) */}
              <div className="space-y-1.5">
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium">
                  Metode Publikasi:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPublishMode("now")}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      publishMode === "now"
                        ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-400 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100"
                        : "bg-zinc-100/30 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-900 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-800"
                    }`}
                  >
                    <div className="font-semibold flex items-center gap-1.5 text-xs">
                      <Send className="w-3.5 h-3.5" />
                      <span>Posting Sekarang</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                      Kirim langsung ke feed Threads Anda saat ini juga.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPublishMode("schedule")}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      publishMode === "schedule"
                        ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-400 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100"
                        : "bg-zinc-100/30 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-900 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-800"
                    }`}
                  >
                    <div className="font-semibold flex items-center gap-1.5 text-xs">
                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Jadwalkan Prime-Time</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                      Antrekan ke jam prime-time WIB (08.00 / 12.30 / 20.00 WIB).
                    </p>
                  </button>
                </div>
              </div>

              {/* Schedule slot options if in schedule mode */}
              {publishMode === "schedule" && (
                <div className="p-3.5 rounded-xl bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-850 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                      Slot Waktu Prime-Time WIB:
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setDaysOffset(0)}
                        className={`px-2 py-0.5 rounded text-[11px] ${
                          daysOffset === 0
                            ? "bg-zinc-200 dark:bg-zinc-800 text-white font-medium"
                            : "text-zinc-500 dark:text-zinc-400"
                        }`}
                      >
                        Hari Ini
                      </button>
                      <button
                        type="button"
                        onClick={() => setDaysOffset(1)}
                        className={`px-2 py-0.5 rounded text-[11px] ${
                          daysOffset === 1
                            ? "bg-zinc-200 dark:bg-zinc-800 text-white font-medium"
                            : "text-zinc-500 dark:text-zinc-400"
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
                              ? "bg-zinc-200 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-600 text-zinc-900 dark:text-white font-semibold"
                              : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-750"
                          }`}
                        >
                          <div className="capitalize">{slot}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            {times[slot as "pagi" | "siang" | "malam"]}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-200 dark:border-zinc-900">
                    <span>Estimasi Tayang:</span>
                    <span className="font-mono text-zinc-800 dark:text-zinc-200">
                      {formatWibDateTime(calculateNextPrimeTime(selectedSlot, daysOffset))}
                    </span>
                  </div>
                </div>
              )}

              {/* Topic Tag */}
              <div className="p-2.5 rounded-xl bg-zinc-100/30 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-850 flex items-center justify-between">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Topic Tag:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200 text-xs">
                  #{topicTag || "Umum"}
                </span>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Status Step-by-Step saat Publishing */}
              {publishing && (
                <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 space-y-2">
                  <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 text-xs font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500 dark:text-zinc-400" />
                    <span>{progressStatus}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Meta Threads sedang memproses pembuatan kontainer dan publikasi postingan...
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={publishing}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-850 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAction}
                  disabled={
                    publishing ||
                    (publishMode === "now" && !account) ||
                    activeSelectedPosts.length === 0
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 transition disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sedang Menerbitkan...</span>
                    </>
                  ) : publishMode === "schedule" ? (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Jadwalkan ({activeSelectedPosts.length} Post)
                      </span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        Posting Sekarang ({activeSelectedPosts.length} Post)
                      </span>
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
