import React, { useState } from "react";
import { Search, Sparkles, RefreshCw, PlusCircle, CheckCircle2, BookmarkPlus, ArrowRight, Lightbulb } from "lucide-react";
import { generateJSON } from "../services/ai";
import { ViralThreadReview, ReferenceCard } from "../types";
import { storage } from "../lib/storage";

export const ReviewPage: React.FC = () => {
  const [threadText, setThreadText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reviewResult, setReviewResult] = useState<ViralThreadReview | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadText.trim()) return;

    setIsAnalyzing(true);
    setDraftSaved(false);
    setErrorMessage(null);
    try {
      const output = await generateJSON<ViralThreadReview>("review", {
        threadText,
      });

      if (output) {
        setReviewResult(output);
      }
    } catch (e: any) {
      console.error("Gagal menganalisis utas:", e);
      setErrorMessage(e.message || "Gagal menganalisis utas. Silakan coba lagi.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToBank = async () => {
    if (!reviewResult || !reviewResult.draftCard) return;

    const draft = reviewResult.draftCard;
    const newCard: ReferenceCard = {
      id: `K_CUSTOM_${Date.now()}`,
      niche: draft.niche as any,
      mode: draft.mode || "umum",
      format: draft.format,
      struktur: draft.struktur,
      emosi: draft.emosi,
      sinyal_algoritma: draft.sinyal_algoritma,
      pola_komentar: draft.pola_komentar,
      pelajaran: draft.pelajaran,
      guardrail: draft.guardrail,
      provenance: draft.provenance || "B",
      hooks: [
        {
          id: `H_CUSTOM_${Date.now()}`,
          card_id: `K_CUSTOM_${Date.now()}`,
          pola_slot: draft.pola_hook,
          contoh_asli: draft.contoh_hook,
          provenance: draft.provenance || "B",
          slot_list: [],
        },
      ],
      status: "pending", // Masuk antrean pending persetujuan di Bank Referensi
    };

    await storage.saveCustomCard(newCard);
    setDraftSaved(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-5 md:px-6 py-6 sm:py-8 pb-24 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Search className="w-5 h-5" />
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white">Ulas Utas Viral (Reverse Engineer)</h1>
        </div>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1">
          Bedah kerangka pola dan psikologi di balik utas orang lain yang ramai, tanpa menyalin satu kalimat pun.
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
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleAnalyze} className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-200 mb-1.5">
                Tempel Teks Utas Viral:
              </label>
              <textarea
                rows={6}
                required
                value={threadText}
                onChange={(e) => setThreadText(e.target.value)}
                placeholder="Tempel keseluruhan post dari utas yang ramai di Threads... (minimal 1 post pembuka)"
                className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-indigo-500 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isAnalyzing || !threadText.trim()}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menganalisis Psikologi & Algoritma...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Bedah Pola & Buat Draf Kartu</span>
                </>
              )}
            </button>
          </form>

          {/* Pedoman Etika */}
          <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-neutral-300 font-semibold">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Etika Reverse-Engineering:</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Tujuan fitur ini adalah meminjam <em>rumus abstrak</em> (struktur argumen, pemicu emosi), bukan mencuri ide atau kalimat. Kartu yang tersimpan akan masuk antrean review untuk divalidasi kebersihannya.
            </p>
          </div>
        </div>

        {/* Output Breakdown Column */}
        <div className="lg:col-span-7 space-y-4">
          {reviewResult ? (
            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Niche: {reviewResult.niche}
                </span>
                <span className="text-xs text-neutral-400">
                  {reviewResult.structure.postCount} Post {reviewResult.structure.visualUsed ? "• Ada Visual" : ""}
                </span>
              </div>

              {/* Hook Analysis */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5 text-xs">
                <span className="font-bold text-white block">Analisis Hook Pembuka:</span>
                <p className="italic text-neutral-300">"{reviewResult.hookAnalysis.hookText}"</p>
                <p className="text-neutral-400 text-[11px] pt-1">
                  <strong>Kenapa Efektif:</strong> {reviewResult.hookAnalysis.whyEffective}
                </p>
              </div>

              {/* Grid 2 Kolom: Emosi & Sinyal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                  <span className="font-bold text-neutral-300 block">Pemicu Emosi Utama:</span>
                  <p className="text-[11px] text-neutral-400">{reviewResult.emotionalTrigger}</p>
                </div>
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                  <span className="font-bold text-neutral-300 block">Sinyal Algoritma:</span>
                  <p className="text-[11px] text-neutral-400">{reviewResult.algorithmSignal}</p>
                </div>
              </div>

              {/* Pola Komentar Warga */}
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-1">
                <span className="font-bold text-neutral-300 block">Pola Komentar Warga:</span>
                <p className="text-[11px] text-neutral-400">{reviewResult.commentPattern}</p>
              </div>

              {/* Framework Lesson */}
              <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs space-y-1.5">
                <span className="font-bold text-indigo-300 block">Pelajaran Kerangka yang Bisa Ditiru:</span>
                <p className="text-[11px] text-neutral-200 leading-relaxed">{reviewResult.frameworkLesson}</p>
              </div>

              {/* Save to Bank Draft */}
              <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-[11px] text-neutral-400">
                  {draftSaved ? "Tersimpan di antrean persetujuan Bank." : "Ingin menyimpan pola ini ke Bank?"}
                </span>

                <button
                  type="button"
                  onClick={handleSaveToBank}
                  disabled={draftSaved}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                    draftSaved
                      ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 cursor-default"
                      : "bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer active:scale-95"
                  }`}
                >
                  {draftSaved ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Masuk Antrean Pending</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Simpan Draf ke Bank</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] rounded-2xl border-2 border-dashed border-neutral-800 flex flex-col items-center justify-center p-6 text-center text-neutral-400 space-y-2">
              <Search className="w-8 h-8 text-neutral-600" />
              <p className="text-xs max-w-xs">
                Tempel teks utas di sebelah kiri untuk melihat anatomi psikologi dan membongkar rumus viralitasnya.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
