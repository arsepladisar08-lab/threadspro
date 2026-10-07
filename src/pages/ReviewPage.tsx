import React, { useState } from "react";
import { Search, Sparkles, RefreshCw, CheckCircle2, BookmarkPlus, Lightbulb } from "lucide-react";
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
      status: "pending",
    };

    await storage.saveCustomCard(newCard);
    setDraftSaved(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-28 space-y-6">
      {/* Calm Header */}
      <div className="border-b border-zinc-900 pb-5">
        <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
          Ulas Utas Viral (Reverse Engineer)
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Bedah kerangka pola dan psikologi di balik utas orang lain yang ramai, tanpa menyalin kalimat aslinya.
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
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-5">
          <form onSubmit={handleAnalyze} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-900/20 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Teks Utas untuk Dibedah:
              </label>
              <textarea
                rows={6}
                required
                value={threadText}
                onChange={(e) => setThreadText(e.target.value)}
                placeholder="Tempel keseluruhan post dari utas orang lain yang ramai di Threads..."
                className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-zinc-600 leading-relaxed transition"
              />
            </div>

            <button
              type="submit"
              disabled={isAnalyzing || !threadText.trim()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-950 transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-700" />
                  <span>Menganalisis Pola & Psikologi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Bedah Kerangka Pola</span>
                </>
              )}
            </button>
          </form>

          {/* Ethics Note */}
          <div className="p-4 rounded-2xl border border-zinc-900 bg-zinc-950/40 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
              <Lightbulb className="w-3.5 h-3.5 text-zinc-400" />
              <span>Etika Pola vs Plagiarisme</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Tujuan fitur ini adalah meminjam <em>rumus abstrak</em> (struktur argumen, pemicu rasa ingin tahu), bukan menyalin teks. Pola yang disimpan akan membantu Anda merangkai konten original dengan suara otentik sendiri.
            </p>
          </div>
        </div>

        {/* Output Column */}
        <div className="lg:col-span-7 space-y-4">
          {reviewResult ? (
            <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/60 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-900 text-xs">
                <span className="font-medium text-zinc-200">
                  Niche: {reviewResult.niche}
                </span>
                <span className="text-zinc-500 font-mono text-[11px]">
                  {reviewResult.structure.postCount} Post {reviewResult.structure.visualUsed ? "· Ada Visual" : ""}
                </span>
              </div>

              {/* Hook Analysis */}
              <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-850 space-y-1.5 text-xs">
                <span className="font-medium text-zinc-300 block text-[11px]">Hook Pembuka:</span>
                <p className="italic text-zinc-200">"{reviewResult.hookAnalysis.hookText}"</p>
                <p className="text-zinc-400 text-[11px] pt-1 leading-relaxed">
                  <strong className="text-zinc-300">Daya Tarik:</strong> {reviewResult.hookAnalysis.whyEffective}
                </p>
              </div>

              {/* Grid 2 Kolom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-850 space-y-1">
                  <span className="font-medium text-zinc-400 text-[11px] block">Pemicu Emosi:</span>
                  <p className="text-zinc-300 text-[11px]">{reviewResult.emotionalTrigger}</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-850 space-y-1">
                  <span className="font-medium text-zinc-400 text-[11px] block">Sinyal Algoritma:</span>
                  <p className="text-zinc-300 text-[11px]">{reviewResult.algorithmSignal}</p>
                </div>
              </div>

              {/* Pola Komentar */}
              <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-850 text-xs space-y-1">
                <span className="font-medium text-zinc-400 text-[11px] block">Reaksi Pembaca:</span>
                <p className="text-zinc-300 text-[11px]">{reviewResult.commentPattern}</p>
              </div>

              {/* Framework Lesson */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs space-y-1">
                <span className="font-medium text-zinc-200 text-[11px] block">Rumus yang Bisa Diterapkan:</span>
                <p className="text-zinc-300 text-[11px] leading-relaxed">{reviewResult.frameworkLesson}</p>
              </div>

              {/* Save to Bank */}
              <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-500">
                  {draftSaved ? "Tersimpan di Bank Referensi." : "Simpan pola abstrak ini ke koleksi?"}
                </span>

                <button
                  type="button"
                  onClick={handleSaveToBank}
                  disabled={draftSaved}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    draftSaved
                      ? "bg-zinc-900 border border-emerald-500/30 text-emerald-400 cursor-default"
                      : "bg-zinc-100 hover:bg-white text-zinc-950 font-semibold"
                  }`}
                >
                  {draftSaved ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Tersimpan</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Simpan ke Bank</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="min-h-[280px] rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col items-center justify-center p-8 text-center text-zinc-500 space-y-2">
              <Search className="w-8 h-8 text-zinc-700" />
              <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                Tempel draf atau postingan di sebelah kiri untuk melihat pembagian struktur, hook, dan emosi audiens.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
