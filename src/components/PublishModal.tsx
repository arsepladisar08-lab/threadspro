import React, { useState, useEffect } from "react";
import { VariantOutput } from "../types";
import { threadsClient, ThreadsAccount } from "../services/threadsClient";
import { ThreadsConnectModal } from "./ThreadsConnectModal";
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
  const [result, setResult] = useState<{ permalink: string } | null>(null);
  const [account, setAccount] = useState<ThreadsAccount | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

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

  const handlePublish = async () => {
    if (!account) {
      setError("Silakan hubungkan akun Threads Anda terlebih dahulu menggunakan Token Akses.");
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      let finalImageUrls: string[] | undefined = undefined;

      // Jika menyertakan visual slides, unggah terlebih dahulu ke server publik
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
        <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-5 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col">
          {/* Close Button */}
          <button
            onClick={onClose}
            disabled={publishing}
            className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2.5 mb-4 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-600/20">
              @
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Posting ke Akun Threads Asli</span>
                {includeVisuals && visualSlides.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {visualSlides.length > 1 ? "Carousel Album" : "Single Image"}
                  </span>
                )}
              </h3>
              <p className="text-xs text-neutral-400">Konfirmasi akhir dan penerbitan ke Meta Threads Graph API</p>
            </div>
          </div>

          {result ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Berhasil Diposting!</h4>
                <p className="text-xs text-neutral-400 mt-1">
                  Utas {includeVisuals && visualSlides.length > 0 ? "beserta media visual" : ""} telah berhasil dipublikasikan di akun Threads Anda.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <a
                  href={result.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/25"
                >
                  <span>Lihat di Threads</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Account State Banner */}
              {account ? (
                <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={account.threads_profile_picture_url}
                      alt={account.username}
                      className="w-8 h-8 rounded-full border border-neutral-700 object-cover"
                    />
                    <div>
                      <span className="text-neutral-400">Memposting sebagai: </span>
                      <span className="font-bold text-white">@{account.username}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Akun Resmi
                  </span>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-amber-200">Akun Threads Belum Terhubung</div>
                    <div className="text-[11px] text-amber-300/80 mt-0.5">
                      Mode mock dinonaktifkan. Anda perlu memasukkan Token Akses untuk memposting.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsConnectModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-amber-500 text-neutral-950 hover:bg-amber-400 text-xs shrink-0 transition cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Hubungkan Akun</span>
                  </button>
                </div>
              )}

              {/* Format Postingan: Switch Teks vs Visual Carousel */}
              <div className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Format Postingan Threads:</span>
                  </span>

                  {onRequestOpenVisualGenerator && (
                    <button
                      type="button"
                      onClick={onRequestOpenVisualGenerator}
                      className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Palette className="w-3 h-3" />
                      <span>{hasVisualSlides ? "Sesuaikan Desain Slide" : "+ Buat Slide Visual"}</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIncludeVisuals(false)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer text-left ${
                      !includeVisuals
                        ? "bg-neutral-800 border-neutral-600 text-white"
                        : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <div>Hanya Teks</div>
                    <div className="text-[10px] font-normal text-neutral-400">Postingan standar teks Meta Threads</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!hasVisualSlides && onRequestOpenVisualGenerator) {
                        onRequestOpenVisualGenerator();
                      } else {
                        setIncludeVisuals(true);
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer text-left ${
                      includeVisuals && hasVisualSlides
                        ? "bg-indigo-950/40 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/30"
                        : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Teks + Visual Carousel</span>
                      {hasVisualSlides && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300">
                          {visualSlides.length} Slide
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-normal text-neutral-400">
                      {hasVisualSlides
                        ? "Diterbitkan sebagai CAROUSEL_ALBUM resmi"
                        : "Klik untuk membuat slide visual dahulu"}
                    </div>
                  </button>
                </div>
              </div>

              {/* Visual Carousel Preview (Jika Aktif) */}
              {includeVisuals && visualSlides.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="font-bold text-neutral-300 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Pratinjau Slide Visual:</span>
                    </span>
                    <span>
                      Slide {previewSlideIdx + 1} dari {visualSlides.length}
                    </span>
                  </div>

                  <div className="relative rounded-xl overflow-hidden bg-black border border-neutral-800 flex items-center justify-center max-h-56">
                    <img
                      src={visualSlides[previewSlideIdx]}
                      alt={`Slide ${previewSlideIdx + 1}`}
                      className="max-h-56 object-contain"
                    />

                    {visualSlides.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setPreviewSlideIdx((p) => Math.max(0, p - 1))}
                          disabled={previewSlideIdx === 0}
                          className="absolute left-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-30 transition cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewSlideIdx((p) => Math.min(visualSlides.length - 1, p + 1))}
                          disabled={previewSlideIdx === visualSlides.length - 1}
                          className="absolute right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-30 transition cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Dots */}
                  {visualSlides.length > 1 && (
                    <div className="flex items-center justify-center gap-1.5 pt-1">
                      {visualSlides.map((_, dotIdx) => (
                        <button
                          key={dotIdx}
                          type="button"
                          onClick={() => setPreviewSlideIdx(dotIdx)}
                          className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                            dotIdx === previewSlideIdx
                              ? "w-5 bg-indigo-500"
                              : "bg-neutral-700 hover:bg-neutral-500"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Post 1 Caption Preview */}
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="font-semibold text-neutral-300">Teks Postingan Utama (#1)</span>
                  <span>{mainPostText.length}/500 karakter</span>
                </div>
                <p className="text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                  {mainPostText}
                </p>
              </div>

              {/* Topic Tag */}
              <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <span className="text-xs text-neutral-400">Topic Tag (1 tag):</span>
                <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
                  {topicTag || "Umum"}
                </span>
              </div>

              {/* Reply 2 Preview */}
              {reply2Text && (
                <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="font-semibold text-neutral-300">Reply ke-2 (Otomatis)</span>
                    <span className="text-emerald-400 text-[10px]">Aman Algoritma</span>
                  </div>
                  <p className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed max-h-20 overflow-y-auto">
                    {reply2Text}
                  </p>
                </div>
              )}

              {/* Status Step-by-Step saat Publishing */}
              {publishing && (
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2.5">
                  <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{progressStatus}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 animate-pulse w-3/4 rounded-full" />
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    Meta Threads memverifikasi kesiapan container gambar sebelum dipublikasikan. Mohon tunggu beberapa detik...
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={publishing}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing || !account}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 cursor-pointer"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sedang Menerbitkan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {includeVisuals && visualSlides.length > 0
                          ? `Terbitkan Utas + ${visualSlides.length} Slide`
                          : "Setujui & Terbitkan Sekarang"}
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
