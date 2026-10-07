import React, { useState } from "react";
import { MessageSquareText, Sparkles, Copy, Check, RefreshCw, Lightbulb, MessageCircle } from "lucide-react";
import { generateJSON } from "../services/ai";

interface ReplyOption {
  id: string;
  strategy: string;
  replyText: string;
  replyDepthGoal: string;
}

export const ReplyPage: React.FC = () => {
  const [commentText, setCommentText] = useState("");
  const [postContext, setPostContext] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [replies, setReplies] = useState<ReplyOption[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleGenerateReplies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const output = await generateJSON("reply", {
        comment: commentText,
        postContext: postContext || "Diskusi seputar tips praktis dan pengalaman di Threads",
      });

      if (output && output.replies) {
        setReplies(output.replies);
      }
    } catch (e: any) {
      console.error("Gagal generate balasan:", e);
      setErrorMessage(e.message || "Gagal membuat balasan. Silakan coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-28 space-y-6">
      {/* Calm Header */}
      <div className="border-b border-zinc-900 pb-5">
        <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
          Asisten Balas Komentar (Reply Depth)
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Ubah komentar audiens menjadi percakapan mendalam dan bermakna untuk mengoptimalkan sinyal algoritma Threads.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <form onSubmit={handleGenerateReplies} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-900/20 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                1. Komentar Audiens
              </label>
              <textarea
                rows={3}
                required
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Contoh: 'Tapi kalau gaji di bawah UMR cicilan motor aja udah engap, gimana mau nabung?'"
                className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-zinc-600 leading-relaxed transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                2. Konteks Utas Anda (Opsional)
              </label>
              <input
                type="text"
                value={postContext}
                onChange={(e) => setPostContext(e.target.value)}
                placeholder="Contoh: Utas tentang cara menyisihkan dana darurat realistis"
                className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-zinc-600 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating || !commentText.trim()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-950 transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-700" />
                  <span>Meracik 3 Pendekatan Balasan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Susun 3 Strategi Balasan</span>
                </>
              )}
            </button>
          </form>

          {/* Principle Note */}
          <div className="p-4 rounded-2xl border border-zinc-900 bg-zinc-950/40 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-300 font-medium text-xs">
              <Lightbulb className="w-3.5 h-3.5 text-zinc-400" />
              <span>Prinsip Algoritma Reply Depth</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Algoritma Threads memberi bobot tinggi pada utas dengan balasan bertingkat (percakapan bercabang). Balasan yang mengundang opini balik meningkatkan dwell time dan pembacaan organik.
            </p>
          </div>
        </div>

        {/* Output Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {replies.length > 0 ? (
            <div className="space-y-3">
              <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider pb-1">
                Pilihan Balasan Cerdas ({replies.length}):
              </div>

              {replies.map((rep, idx) => (
                <div
                  key={rep.id ? `${rep.id}_${idx}` : `rep_${idx}`}
                  className="p-4 rounded-2xl border border-zinc-900 bg-zinc-950/60 hover:border-zinc-800 transition space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-300 px-2.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800">
                      {rep.strategy}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(rep.replyText, idx)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-850 text-zinc-200 transition cursor-pointer"
                    >
                      {copiedIdx === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-zinc-100 whitespace-pre-wrap leading-relaxed">
                    {rep.replyText}
                  </p>

                  <div className="pt-2 border-t border-zinc-900 flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <MessageCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>
                      <strong className="text-zinc-300">Tujuan Depth:</strong> {rep.replyDepthGoal}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="min-h-[280px] rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col items-center justify-center p-8 text-center text-zinc-500 space-y-2">
              <MessageSquareText className="w-8 h-8 text-zinc-700" />
              <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                Tempel komentar yang Anda terima di formulir sebelah kiri untuk menyusun 3 pilihan balasan pemantik obrolan.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
