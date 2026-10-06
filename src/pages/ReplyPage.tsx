import React, { useState } from "react";
import { MessageSquareText, Sparkles, Copy, Check, RefreshCw, Lightbulb, UserCheck, MessageCircle } from "lucide-react";
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
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <MessageSquareText className="w-5 h-5" />
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white">Asisten Balas Komentar (Reply Depth)</h1>
        </div>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1">
          Ubah komentar audiens menjadi percakapan mendalam. Jangan biarkan obrolan mati dengan sekadar "makasih kak".
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-between gap-3 text-xs text-rose-300">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-1 text-rose-400 hover:text-white transition cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleGenerateReplies} className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-200 mb-1.5">
                1. Tempel Komentar Audiens:
              </label>
              <textarea
                rows={3}
                required
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Contoh: 'Tapi kak kalau gaji di bawah UMR cicilan motor aja udah engap, gimana mau nabung?'"
                className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-indigo-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-200 mb-1.5">
                2. Konteks Postingan Lo (Opsional):
              </label>
              <input
                type="text"
                value={postContext}
                onChange={(e) => setPostContext(e.target.value)}
                placeholder="Contoh: Utas tentang kesalahan budgeting gaji pertama"
                className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-600 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating || !commentText.trim()}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Meracik 3 Strategi Balasan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Buat 3 Balasan Pemantik Obrolan</span>
                </>
              )}
            </button>
          </form>

          {/* Tips Box */}
          <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-neutral-300 font-semibold">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Kenapa Reply Depth Sangat Krusial?</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Algoritma Threads memberi bobot tinggi pada thread yang menghasilkan balasan di dalam balasan (percakapan bercabang). Balasan yang mengundang opini balik meningkatkan dwell time dan persepsi komunitas aktif.
            </p>
          </div>
        </div>

        {/* Output Column */}
        <div className="lg:col-span-7 space-y-4">
          {replies.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                3 Pilihan Balasan Berbeda Strategi:
              </h3>

              {replies.map((rep, idx) => (
                <div
                  key={rep.id || idx}
                  className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                      {rep.strategy}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(rep.replyText, idx)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition active:scale-95"
                    >
                      {copiedIdx === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-neutral-100 whitespace-pre-wrap leading-relaxed">
                    {rep.replyText}
                  </p>

                  <div className="pt-2 border-t border-neutral-800/80 flex items-center gap-1.5 text-[11px] text-neutral-400">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Tujuan Depth:</strong> {rep.replyDepthGoal}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full min-h-[280px] rounded-2xl border-2 border-dashed border-neutral-800 flex flex-col items-center justify-center p-6 text-center text-neutral-400 space-y-2">
              <MessageSquareText className="w-8 h-8 text-neutral-600" />
              <p className="text-xs max-w-xs">
                Tempel komentar yang lo terima di sebelah kiri untuk melihat 3 opsi balasan cerdas pemancing obrolan.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
