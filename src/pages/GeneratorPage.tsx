import React, { useState, useEffect } from "react";
import { UserProfile, GoalType, GenerationOutput, VariantOutput } from "../types";
import { storage } from "../lib/storage";
import { retrieveTopPatterns } from "../lib/retrieval";
import { auditVariant, autoFixVariant } from "../lib/guard";
import { generateJSON } from "../services/ai";
import { ProvenanceBadge } from "../components/ProvenanceBadge";
import { PublishModal } from "../components/PublishModal";
import {
  Sparkles,
  Target,
  FileText,
  Copy,
  Check,
  Send,
  Wand2,
  AlertTriangle,
  Clock,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Tag,
  Lightbulb,
} from "lucide-react";

export const GeneratorPage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rawIdea, setRawIdea] = useState("");
  const [goal, setGoal] = useState<GoalType>("Jangkauan");
  const [realFacts, setRealFacts] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationOutput | null>(null);
  const [activeVariantIdx, setActiveVariantIdx] = useState(0);
  const [copiedPostIdx, setCopiedPostIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [postedSuccess, setPostedSuccess] = useState(false);
  const [publishModalVariant, setPublishModalVariant] = useState<VariantOutput | null>(null);
  const [showTrace, setShowTrace] = useState(true);

  useEffect(() => {
    storage.getProfile().then((p) => {
      if (p) {
        setProfile(p);
      } else {
        // Profil default jika user belum isi onboarding
        const defaultProf: UserProfile = {
          id: "default",
          niche: "Keuangan",
          targetAudience: "Warga Threads usia 20-35 yang ingin mengelola keuangan & bisnis",
          tone: "santai",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setProfile(defaultProf);
      }
    });

    // Muat riwayat generasi terakhir jika ada
    storage.getGenerations().then((gens) => {
      if (gens && gens.length > 0) {
        setResult(gens[0]);
      }
    });
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawIdea.trim()) return;

    setIsGenerating(true);
    setCurrentStep("1/4: Mengekstrak Idea DNA & Fakta Asli...");

    try {
      const userNiche = profile?.niche || "Keuangan";

      // Langkah 1: Ekstraksi Idea DNA
      const ideaDna = await generateJSON("ideaDna", {
        rawIdea,
        realFacts: realFacts || "Belum ada fakta angka spesifik, buat placeholder [ISI: ...]",
        userProfile: profile,
        targetGoal: goal,
      });

      // Langkah 2: Retrieval Top-8 & Pemilihan 3 Pola Beragam
      setCurrentStep("2/4: Mengambil Pola Teruji dari Bank Referensi...");
      const topPatterns = await retrieveTopPatterns(
        `${ideaDna.topik_inti} ${ideaDna.sudut} ${rawIdea}`,
        userNiche,
        goal
      );

      // Langkah 3: Fuser + Writer (Menulis 3 Varian)
      setCurrentStep("3/4: Memfusi Pola & Menulis 3 Varian Utas...");
      const writerInput = {
        ideaDna,
        topPatterns: topPatterns.map((p) => ({
          card_id: p.card.id,
          hook_id: p.hook.id,
          niche: p.card.niche,
          format: p.card.format,
          struktur: p.card.struktur,
          emosi: p.card.emosi,
          sinyal: p.card.sinyal_algoritma,
          pola_slot: p.hook.pola_slot,
          provenance: p.hook.provenance,
          isCrossNiche: p.isCrossNiche,
        })),
        userProfile: profile,
        requestedGoal: goal,
      };

      const writerOutput = await generateJSON<GenerationOutput>("writer", writerInput);

      // Langkah 4: Guard & Checker (Validasi Kode Murni)
      setCurrentStep("4/4: Menjalankan Quality Guard & Audit Algoritma...");
      const auditedVariants = writerOutput.variants.map((variant) => {
        // Hitung ulang karakter post murni di kode
        const fixedPosts = variant.posts.map((post) => ({
          ...post,
          char_count: post.text.length,
        }));

        let audited = { ...variant, posts: fixedPosts };

        // Jalankan audit guard
        let auditRes = auditVariant(audited, rawIdea);

        // Jika skor < 70, perbaiki otomatis 1x
        if (!auditRes.passed) {
          audited = autoFixVariant(audited);
          auditRes = auditVariant(audited, rawIdea);
        }

        return audited;
      });

      const finalOutput: GenerationOutput = {
        ...writerOutput,
        idea_dna: ideaDna,
        variants: auditedVariants,
        timestamp: Date.now(),
      };

      setResult(finalOutput);
      await storage.saveGeneration(finalOutput);
      setActiveVariantIdx(finalOutput.recommended_variant ? finalOutput.recommended_variant - 1 : 0);
    } catch (err: any) {
      console.error("Gagal generate:", err);
      alert(`Terjadi kendala saat menghasilkan utas: ${err.message}`);
    } finally {
      setIsGenerating(false);
      setCurrentStep(null);
    }
  };

  const handleCopyPost = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedPostIdx(idx);
    setTimeout(() => setCopiedPostIdx(null), 2000);
  };

  const handleCopyAll = (variant: VariantOutput) => {
    const fullText = variant.posts
      .map((p) => `[Post ${p.order}]\n${p.text}`)
      .join("\n\n---\n\n");
    const withReply2 = variant.reply_2?.text
      ? `${fullText}\n\n[Reply ke-2]\n${variant.reply_2.text}`
      : fullText;

    navigator.clipboard.writeText(withReply2);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleMarkAsPosted = async (variant: VariantOutput) => {
    // Simpan ke metrik tracker dummy awal agar langsung bisa ditrack
    await storage.saveMetric({
      id: `post_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      topicTag: variant.topic_tag,
      hookType: variant.template,
      timeWIB: variant.best_time_wib,
      views: 0,
      likes: 0,
      replies: 0,
      replyDepth: 0,
      profileVisits: 0,
      follows: 0,
      first60MinInteractions: 0,
      replyToLike: null,
      velocity60: 0,
      engagementRate: null,
      cardId: variant.fusion_trace.card_id,
      notes: "Diposting dari AutoThreads Generator",
    });
    setPostedSuccess(true);
    setTimeout(() => setPostedSuccess(false), 3000);
  };

  const currentVariant = result?.variants?.[activeVariantIdx];
  const auditCurrent = currentVariant ? auditVariant(currentVariant, rawIdea) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>Generator Utas (Idea Fusion)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              3 Varian Siap Post
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Ubah ide kasar menjadi 3 varian utas beralgoritma tinggi dalam &lt; 60 detik.
          </p>
        </div>

        {/* Niche Badge */}
        {profile && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-400">Niche Aktif:</span>
            <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-indigo-300 font-semibold">
              {profile.niche} ({profile.tone})
            </span>
          </div>
        )}
      </div>

      {/* Main Grid: Form Input (Left) & Variants Output (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4 shadow-sm">
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Ide Kasar */}
              <div>
                <label className="block text-xs font-bold text-neutral-200 mb-1.5 flex items-center justify-between">
                  <span>1. Ide Kasar / Keresahan Warga</span>
                  <span className="text-[10px] text-neutral-400 font-normal">Minimal 1 kalimat</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={rawIdea}
                  onChange={(e) => setRawIdea(e.target.value)}
                  placeholder="Contoh: Akhir bulan gaji selalu abis padahal gak ngerasa belanja aneh-aneh. Pas dicek ternyata boncos di jajan kopi sama promo ojol..."
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* Goal / Tujuan */}
              <div>
                <label className="block text-xs font-bold text-neutral-200 mb-1.5 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-400" />
                  <span>2. Target Utama Konten</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["Jangkauan", "Kedekatan", "Konversi"] as GoalType[]).map((g) => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => setGoal(g)}
                      className={`p-2 rounded-xl text-xs font-semibold border transition ${
                        goal === g
                          ? "bg-indigo-600/20 border-indigo-500 text-white shadow-xs"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-neutral-400 mt-1">
                  {goal === "Jangkauan" && "⚡ Fokus reply cepat & velocity tinggi di 60 menit pertama"}
                  {goal === "Kedekatan" && "💬 Fokus reply depth, curhat mendalam, & quote repost"}
                  {goal === "Konversi" && "🎯 Fokus simpan (save), profil visit, & CTA lembut di reply 2"}
                </div>
              </div>

              {/* Fakta Asli / Angka */}
              <div>
                <label className="block text-xs font-bold text-neutral-200 mb-1 flex items-center justify-between">
                  <span>3. Fakta / Angka / Cerita ASLI (Opsional)</span>
                  <span className="text-[10px] text-emerald-400 font-medium">Anti Karang</span>
                </label>
                <p className="text-[11px] text-neutral-400 mb-1.5 leading-snug">
                  Jika dikosongkan, AI akan menyematkan placeholder aman seperti <code className="text-indigo-300">[ISI: nominal]</code> agar Anda tidak mengarang angka.
                </p>
                <textarea
                  rows={2}
                  value={realFacts}
                  onChange={(e) => setRealFacts(e.target.value)}
                  placeholder="Contoh: Pengeluaran kopi 1,7jt sebulan, gaji 8jt, cicilan 2,5jt..."
                  className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-600 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isGenerating || !rawIdea.trim()}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{currentStep || "Memproses..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Fusi Ide & Rilis 3 Varian Utas</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Tips Algoritma Singkat */}
          <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-neutral-300 font-semibold">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Pedoman Algoritma Threads ID:</span>
            </div>
            <ul className="text-[11px] text-neutral-400 space-y-1 list-disc list-inside">
              <li>1 Topic tag spesifik tanpa tanda pagar (#).</li>
              <li>Jangan taruh link di post 1 (pindahkan ke reply ke-2).</li>
              <li>Reply di 30 menit pertama sama berharganya dengan post baru.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Output Varian */}
        <div className="lg:col-span-7 space-y-4">
          {result && result.variants && result.variants.length > 0 ? (
            <div className="space-y-4">
              {/* Tab Selector Varian */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-neutral-900 border border-neutral-800 overflow-x-auto">
                {result.variants.map((v, idx) => {
                  const isRecommended = result.recommended_variant === idx + 1;
                  const isActive = activeVariantIdx === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveVariantIdx(idx)}
                      className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-between gap-1.5 ${
                        isActive
                          ? "bg-neutral-800 text-white shadow-sm ring-1 ring-neutral-700"
                          : "text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <span className="truncate">Varian {idx + 1}: {v.template.replace(/_/g, " ")}</span>
                      {isRecommended && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Rekomendasi Utama" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Variant Card */}
              {currentVariant && (
                <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-5">
                  {/* Top Bar: Template, Provenance, & Quality Score */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">
                        {currentVariant.template.replace(/_/g, " ")}
                      </span>
                      <span className="text-neutral-600">•</span>
                      <ProvenanceBadge
                        provenance={(currentVariant.fusion_trace?.card_id ? "B" : "C") as any}
                      />
                    </div>

                    {auditCurrent && (
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                            auditCurrent.score >= 80
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : auditCurrent.score >= 70
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}
                        >
                          Skor Algoritma: {auditCurrent.score}/100
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Fusion Trace Accordion */}
                  <div className="rounded-xl bg-neutral-950/80 border border-neutral-800/80 p-3 text-xs space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setShowTrace(!showTrace)}
                      className="w-full flex items-center justify-between font-semibold text-neutral-300"
                    >
                      <div className="flex items-center gap-1.5">
                        <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Jejak Fusi (Transparansi Pola)</span>
                      </div>
                      {showTrace ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {showTrace && (
                      <div className="pt-2 text-[11px] text-neutral-400 space-y-1">
                        <p>
                          <strong className="text-neutral-300">Pola Dipinjam:</strong>{" "}
                          {currentVariant.fusion_trace.pola_dipinjam}
                        </p>
                        <p>
                          <strong className="text-neutral-300">Transformasi Ide:</strong>{" "}
                          {currentVariant.fusion_trace.perubahan_dari_ide_kasar}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Posts List */}
                  <div className="space-y-3">
                    {currentVariant.posts.map((post, pIdx) => {
                      const charCount = post.text.length;
                      const isOverLimit = charCount > 500;
                      return (
                        <div
                          key={pIdx}
                          className="relative p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 transition space-y-2"
                        >
                          <div className="flex items-center justify-between text-[11px] text-neutral-400">
                            <span className="font-bold text-neutral-300">Post #{post.order}</span>
                            <div className="flex items-center gap-3">
                              <span className={isOverLimit ? "text-rose-400 font-bold" : "text-neutral-400"}>
                                {charCount}/500 karakter
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyPost(post.text, pIdx)}
                                className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                                title="Salin post ini"
                              >
                                {copiedPostIdx === pIdx ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-neutral-100 whitespace-pre-wrap leading-relaxed font-normal">
                            {post.text}
                          </p>

                          {post.media_suggestion && (
                            <div className="pt-1 text-[10px] text-neutral-400 flex items-center gap-1">
                              <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                                Rekomendasi Visual: {post.media_suggestion}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Reply ke-2 (Safe Link & CTA) */}
                  {currentVariant.reply_2?.text && (
                    <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-indigo-300">Reply ke-2 (Untuk Link / Tambahan)</span>
                        <span className="text-[10px] text-indigo-400">Menjaga post #1 bebas downrank</span>
                      </div>
                      <p className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">
                        {currentVariant.reply_2.text}
                      </p>
                    </div>
                  )}

                  {/* Topic Tag & Waktu Rekomendasi */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-neutral-400 block">Topic Tag Resmi:</span>
                        <span className="font-semibold text-white">
                          {currentVariant.topic_tag.replace(/#/g, "")}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-neutral-400 block">Waktu Posting Terbaik:</span>
                        <span className="font-semibold text-white">{currentVariant.best_time_wib}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rencana 30 Menit Pertama */}
                  {currentVariant.first_30_min_plan && currentVariant.first_30_min_plan.length > 0 && (
                    <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-1">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                        Rencana Aksi 30 Menit Pertama (Velocity):
                      </span>
                      <ul className="text-[11px] text-neutral-300 list-disc list-inside space-y-0.5">
                        {currentVariant.first_30_min_plan.map((act, aIdx) => (
                          <li key={aIdx}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyAll(currentVariant)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white transition active:scale-95"
                      >
                        {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedAll ? "Tersalin!" : "Salin Semua Post"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMarkAsPosted(currentVariant)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 transition"
                      >
                        <Check className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{postedSuccess ? "Ditandai!" : "Tandai Diposting"}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPublishModalVariant(currentVariant)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition active:scale-95 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Posting ke Threads</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[360px] rounded-2xl border-2 border-dashed border-neutral-800/80 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
                <Sparkles className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="max-w-xs space-y-1">
                <h3 className="text-sm font-bold text-white">Belum Ada Utas yang Digenerate</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Ketikkan ide kasar lo di kolom sebelah kiri, lalu klik "Fusi Ide & Rilis 3 Varian Utas".
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Publish Modal */}
      {publishModalVariant && (
        <PublishModal
          variant={publishModalVariant}
          isOpen={!!publishModalVariant}
          onClose={() => setPublishModalVariant(null)}
          onSuccess={(permalink) => {
            handleMarkAsPosted(publishModalVariant);
          }}
        />
      )}
    </div>
  );
};
