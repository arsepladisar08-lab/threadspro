import React, { useState, useEffect, useRef } from "react";
import { UserProfile, GoalType, GenerationOutput, VariantOutput } from "../types";
import { storage } from "../lib/storage";
import { retrieveTopPatterns } from "../lib/retrieval";
import { auditVariant, autoFixVariant } from "../lib/guard";
import { generateJSON, generateFactsAssistance } from "../services/ai";
import { PublishModal } from "../components/PublishModal";
import { VisualCardGenerator, VisualTheme, AspectRatio } from "../components/VisualCardGenerator";
import {
  Sparkles,
  Copy,
  Check,
  Send,
  Wand2,
  AlertCircle,
  Clock,
  RefreshCw,
  Tag,
  Upload,
  Paperclip,
  X,
  Save,
  Palette,
  Edit3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface UploadedDocFile {
  name: string;
  size: string;
  content: string;
  type: "text" | "image";
  previewUrl?: string;
}

export const GeneratorPage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rawIdea, setRawIdea] = useState("");
  const [goal, setGoal] = useState<GoalType>("Jangkauan");
  const [realFacts, setRealFacts] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAssistingFacts, setIsAssistingFacts] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationOutput | null>(null);
  const [activeVariantIdx, setActiveVariantIdx] = useState(0);
  const [copiedPostIdx, setCopiedPostIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [publishModalVariant, setPublishModalVariant] = useState<VariantOutput | null>(null);
  const [visualGeneratorVariant, setVisualGeneratorVariant] = useState<VariantOutput | null>(null);
  const [showTrace, setShowTrace] = useState(false);

  // File Upload State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedDocFile[]>([]);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Variant Editing State
  const [editingPostIdx, setEditingPostIdx] = useState<number | null>(null);
  const [editingPostText, setEditingPostText] = useState("");
  const [isEditingReply2, setIsEditingReply2] = useState(false);
  const [editingReply2Text, setEditingReply2Text] = useState("");
  const [isEditingTopicTag, setIsEditingTopicTag] = useState(false);
  const [editingTopicTagText, setEditingTopicTagText] = useState("");
  const [editNoticeToast, setEditNoticeToast] = useState<string | null>(null);

  useEffect(() => {
    storage.getProfile().then((p) => {
      if (p) {
        setProfile(p);
      } else {
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

    storage.getGenerations().then((gens) => {
      if (gens && gens.length > 0) {
        setResult(gens[0]);
      }
    });
  }, []);

  const handleAiAssistFacts = async () => {
    if (!rawIdea.trim() && uploadedFiles.length === 0) {
      setErrorMessage("Tulis ide kasar atau lampirkan file terlebih dahulu.");
      return;
    }
    setIsAssistingFacts(true);
    setErrorMessage(null);
    try {
      const sourceIdea = rawIdea.trim() || uploadedFiles.map((f) => f.content).join("\n");
      const aiFacts = await generateFactsAssistance({
        rawIdea: sourceIdea,
        niche: profile?.niche || "Keuangan",
        goal,
        profile,
      });
      setRealFacts(aiFacts);
      setGenerationNotice("Fakta dan angka realistis berhasil diracik oleh AI.");
      setTimeout(() => setGenerationNotice(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal meracik fakta.");
    } finally {
      setIsAssistingFacts(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsReadingFile(true);

    const formatBytes = (bytes: number) => {
      if (bytes < 1024) return bytes + " B";
      else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
      else return (bytes / 1048576).toFixed(1) + " MB";
    };

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const newFileInfo: UploadedDocFile = {
          name: file.name,
          size: formatBytes(file.size),
          content: `[Catatan visual: ${file.name}]`,
          previewUrl: dataUrl,
          type: "image",
        };
        setUploadedFiles((prev) => [newFileInfo, ...prev]);
        setIsReadingFile(false);
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const textContent = (reader.result as string) || "";
        const newFileInfo: UploadedDocFile = {
          name: file.name,
          size: formatBytes(file.size),
          content: textContent,
          type: "text",
        };
        setUploadedFiles((prev) => [newFileInfo, ...prev]);
        setIsReadingFile(false);
      };
      reader.onerror = () => {
        setIsReadingFile(false);
        setErrorMessage("Gagal membaca file.");
      };
      reader.readAsText(file);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSavePostEdit = async (pIdx: number) => {
    if (!result || !result.variants || !result.variants[activeVariantIdx]) return;
    const updatedVariants = [...result.variants];
    const current = { ...updatedVariants[activeVariantIdx] };
    const updatedPosts = [...current.posts];

    updatedPosts[pIdx] = {
      ...updatedPosts[pIdx],
      text: editingPostText,
      char_count: editingPostText.length,
    };
    current.posts = updatedPosts;

    updatedVariants[activeVariantIdx] = current;
    const updatedResult: GenerationOutput = {
      ...result,
      variants: updatedVariants,
    };

    setResult(updatedResult);
    await storage.saveGeneration(updatedResult);
    setEditingPostIdx(null);
    setEditNoticeToast(`Post #${pIdx + 1} disimpan`);
    setTimeout(() => setEditNoticeToast(null), 2000);
  };

  const handleSaveReply2Edit = async () => {
    if (!result || !result.variants || !result.variants[activeVariantIdx]) return;
    const updatedVariants = [...result.variants];
    const current = { ...updatedVariants[activeVariantIdx] };
    current.reply_2 = {
      ...current.reply_2,
      text: editingReply2Text,
      contains_link: /(https?:\/\/[^\s]+|www\.[^\s]+)/i.test(editingReply2Text),
    };
    updatedVariants[activeVariantIdx] = current;
    const updatedResult: GenerationOutput = {
      ...result,
      variants: updatedVariants,
    };

    setResult(updatedResult);
    await storage.saveGeneration(updatedResult);
    setIsEditingReply2(false);
    setEditNoticeToast("Reply ke-2 disimpan");
    setTimeout(() => setEditNoticeToast(null), 2000);
  };

  const handleSaveTopicTagEdit = async () => {
    if (!result || !result.variants || !result.variants[activeVariantIdx]) return;
    const cleanTag = editingTopicTagText.replace(/#/g, "").trim();
    if (!cleanTag) return;
    const updatedVariants = [...result.variants];
    const current = { ...updatedVariants[activeVariantIdx] };
    current.topic_tag = cleanTag;
    updatedVariants[activeVariantIdx] = current;
    const updatedResult: GenerationOutput = {
      ...result,
      variants: updatedVariants,
    };

    setResult(updatedResult);
    await storage.saveGeneration(updatedResult);
    setIsEditingTopicTag(false);
    setEditNoticeToast("Topic tag disimpan");
    setTimeout(() => setEditNoticeToast(null), 2000);
  };

  const handleApplyVisualSlides = async (
    slidesBase64: string[],
    meta: { theme: VisualTheme; aspectRatio: AspectRatio }
  ) => {
    if (!result || !result.variants || !result.variants[activeVariantIdx]) return;
    const updatedVariants = [...result.variants];
    const current = { ...updatedVariants[activeVariantIdx] };
    current.visual_slides = slidesBase64;
    current.visual_theme = meta.theme;
    current.visual_aspect_ratio = meta.aspectRatio;
    updatedVariants[activeVariantIdx] = current;
    const updatedResult: GenerationOutput = {
      ...result,
      variants: updatedVariants,
    };
    setResult(updatedResult);
    await storage.saveGeneration(updatedResult);
    setEditNoticeToast(`${slidesBase64.length} slide visual diterapkan`);
    setTimeout(() => setEditNoticeToast(null), 2500);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawIdea.trim()) return;

    setIsGenerating(true);
    setErrorMessage(null);
    setGenerationNotice(null);
    setCurrentStep("Mengekstrak DNA ide & fakta...");

    try {
      const userNiche = profile?.niche || "Keuangan";

      let fileContext = "";
      if (uploadedFiles.length > 0) {
        fileContext = uploadedFiles
          .map((f) => `[Lampiran File ${f.name}]:\n${f.content.slice(0, 1500)}`)
          .join("\n\n");
      }

      const effectiveIdea = fileContext ? `${rawIdea}\n\n${fileContext}` : rawIdea;
      const effectiveFacts = realFacts
        ? realFacts
        : "AI menyusun ulasan fakta terbaik berupa estimasi angka kredibel dan cerita riil yang relevan tanpa placeholder kosong.";

      let ideaDna: any;
      try {
        ideaDna = await generateJSON("ideaDna", {
          rawIdea: effectiveIdea,
          realFacts: effectiveFacts,
          userProfile: profile,
          targetGoal: goal,
        });
      } catch (e: any) {
        ideaDna = {
          topik_inti: rawIdea.slice(0, 50),
          sudut: "Refleksi jujur & pengalaman nyata",
          fakta_asli: realFacts ? [realFacts] : ["Evaluasi 30 hari: kebocoran pengeluaran halus bisa ditekan 40% dengan sistem amplop."],
          emosi_target: "Relatable",
          tujuan: goal,
          placeholder_dibutuhkan: [],
        };
      }

      setCurrentStep("Mengambil pola teruji...");
      const topPatterns = await retrieveTopPatterns(
        `${ideaDna.topik_inti} ${ideaDna.sudut} ${rawIdea}`,
        userNiche,
        goal
      );

      setCurrentStep("Menulis 3 variasi utas...");
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

      setCurrentStep("Memvalidasi kepatuhan...");
      const auditedVariants = (writerOutput?.variants || []).map((variant) => {
        const fixedPosts = (variant.posts || []).map((post) => ({
          ...post,
          char_count: (post.text || "").length,
        }));

        let audited = { ...variant, posts: fixedPosts };
        let auditRes = auditVariant(audited, rawIdea);

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
      setErrorMessage(err.message || "Terjadi kendala saat memproses permintaan AI.");
    } finally {
      setIsGenerating(false);
      setCurrentStep(null);
    }
  };

  const handleCopyPost = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedPostIdx(idx);
    setTimeout(() => setCopiedPostIdx(null), 1500);
  };

  const handleCopyAll = (variant: VariantOutput) => {
    const fullText = variant.posts
      .map((p) => p.text)
      .join("\n\n---\n\n");
    const withReply2 = variant.reply_2?.text
      ? `${fullText}\n\n[Reply]\n${variant.reply_2.text}`
      : fullText;

    navigator.clipboard.writeText(withReply2);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  const currentVariant = result?.variants?.[activeVariantIdx];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-28">
      {/* Calm Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
            Generator Utas
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Fusi ide kasar menjadi draf utas berdaya jangkau tinggi tanpa sensasionalisme.
          </p>
        </div>

        {profile?.niche && (
          <div className="text-xs text-zinc-400 font-mono">
            Niche: <span className="text-zinc-300 font-medium">{profile.niche}</span>
          </div>
        )}
      </div>

      {/* Error & Info Alerts */}
      {errorMessage && (
        <div className="mb-6 p-3.5 rounded-xl bg-zinc-900 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {generationNotice && (
        <div className="mb-6 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex items-center justify-between">
          <span>{generationNotice}</span>
          <button
            type="button"
            onClick={() => setGenerationNotice(null)}
            className="text-zinc-500 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Form (Left 5 cols) & Output (Right 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Quiet Writing Form */}
        <div className="lg:col-span-5 space-y-5">
          <form onSubmit={handleGenerate} className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-5 space-y-5">
            {/* Field 1: Ide Kasar */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Ide atau Keresahan
              </label>
              <textarea
                rows={4}
                required
                value={rawIdea}
                onChange={(e) => setRawIdea(e.target.value)}
                placeholder="Contoh: Akhir bulan gaji selalu habis bukan karena belanja besar, tapi bocor halus di kopi dan promo pesan antar..."
                className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-zinc-600 leading-relaxed transition"
              />
            </div>

            {/* Field 2: Target Konten (Segmented Pill) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Fokus Sasaran
              </label>
              <div className="grid grid-cols-3 p-1 rounded-xl bg-zinc-950 border border-zinc-850 text-xs">
                {(["Jangkauan", "Kedekatan", "Konversi"] as GoalType[]).map((g) => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => setGoal(g)}
                    className={`py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      goal === g
                        ? "bg-zinc-800 text-zinc-100 font-semibold shadow-xs"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Field 3: Fakta & Konteks (Opsional) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-zinc-300">
                  Fakta / Angka (Opsional)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleAiAssistFacts}
                    disabled={isAssistingFacts}
                    className="text-zinc-400 hover:text-zinc-200 transition text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-zinc-400" />
                    <span>{isAssistingFacts ? "Meracik..." : "Bantu AI"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isReadingFile}
                    className="text-zinc-400 hover:text-zinc-200 transition text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Lampirkan</span>
                  </button>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,.md,.json,.csv,text/plain,image/*"
                className="hidden"
              />

              {/* Uploaded File Chips */}
              {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300"
                    >
                      <Paperclip className="w-2.5 h-2.5 text-zinc-500" />
                      <span className="truncate max-w-[120px]">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="text-zinc-500 hover:text-zinc-300 p-0.5"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                rows={2}
                value={realFacts}
                onChange={(e) => setRealFacts(e.target.value)}
                placeholder="Angka riil, pengalaman pribadi, atau klik 'Bantu AI' untuk estimasi realistis..."
                className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-zinc-600 leading-relaxed transition"
              />
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isGenerating || !rawIdea.trim()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-950 transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-700" />
                  <span>{currentStep || "Memproses..."}</span>
                </>
              ) : (
                <span>Fusi Ide & Rilis 3 Varian Utas</span>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Clean Thread Studio Preview */}
        <div className="lg:col-span-7 space-y-4">
          {result && result.variants && result.variants.length > 0 ? (
            <div className="space-y-4">
              {/* Calm Horizontal Variant Switcher */}
              <div className="flex items-center gap-1 border-b border-zinc-900 pb-2">
                {result.variants.map((v, idx) => {
                  const isActive = activeVariantIdx === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveVariantIdx(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                        isActive
                          ? "bg-zinc-900 text-zinc-100 font-medium"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <span>Varian {idx + 1}</span>
                      <span className="text-zinc-400 ml-1.5 font-normal">
                        ({v.template.replace(/_/g, " ")})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Variant Thread View */}
              {currentVariant && (
                <div className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-5 space-y-5">
                  {/* Subtle Jejak Fusi Link */}
                  <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-900/80 pb-3">
                    <button
                      type="button"
                      onClick={() => setShowTrace(!showTrace)}
                      className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-300 transition cursor-pointer"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>{showTrace ? "Sembunyikan jejak fusi" : "Lihat jejak fusi pola"}</span>
                      {showTrace ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                      <span>{currentVariant.topic_tag.replace(/#/g, "")}</span>
                      <span>·</span>
                      <span>{currentVariant.best_time_wib}</span>
                    </div>
                  </div>

                  {showTrace && currentVariant.fusion_trace && (
                    <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-850 text-xs text-zinc-400 space-y-1">
                      <p>
                        <strong className="text-zinc-300">Pola:</strong> {currentVariant.fusion_trace.pola_dipinjam}
                      </p>
                      <p>
                        <strong className="text-zinc-300">Transformasi:</strong> {currentVariant.fusion_trace.perubahan_dari_ide_kasar}
                      </p>
                    </div>
                  )}

                  {/* Connected Thread Posts Stream */}
                  <div className="space-y-4 relative">
                    {/* Connecting line */}
                    {currentVariant.posts.length > 1 && (
                      <div className="absolute left-3.5 top-6 bottom-4 w-px bg-zinc-800 -z-0" />
                    )}

                    {currentVariant.posts.map((post, pIdx) => {
                      const isEditing = editingPostIdx === pIdx;
                      const charCount = isEditing ? editingPostText.length : post.text.length;

                      return (
                        <div key={pIdx} className="relative flex gap-3 text-xs z-10">
                          {/* Thread Node / Avatar */}
                          <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-[10px] text-zinc-300 shrink-0">
                            {pIdx === 0 ? "@" : pIdx + 1}
                          </div>

                          {/* Post Content Box */}
                          <div className="flex-1 min-w-0 p-3.5 rounded-xl bg-zinc-900/30 border border-zinc-850/80 space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-zinc-400">
                              <span className="font-medium text-zinc-300">
                                {pIdx === 0 ? "Post Utama (#1)" : `Post #${post.order}`}
                              </span>

                              <div className="flex items-center gap-2">
                                <span className={charCount > 500 ? "text-rose-400" : "text-zinc-400 font-mono"}>
                                  {charCount}/500
                                </span>
                                {!isEditing ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingPostIdx(pIdx);
                                        setEditingPostText(post.text);
                                      }}
                                      className="p-1 text-zinc-400 hover:text-zinc-200 transition"
                                      title="Edit post"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyPost(post.text, pIdx)}
                                      className="p-1 text-zinc-400 hover:text-zinc-200 transition"
                                      title="Salin post ini"
                                    >
                                      {copiedPostIdx === pIdx ? (
                                        <Check className="w-3 h-3 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setEditingPostIdx(null)}
                                      className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 hover:text-white"
                                    >
                                      Batal
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSavePostEdit(pIdx)}
                                      className="px-2 py-0.5 rounded text-[10px] bg-zinc-100 text-zinc-950 font-semibold hover:bg-white"
                                    >
                                      Simpan
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {isEditing ? (
                              <textarea
                                rows={4}
                                value={editingPostText}
                                onChange={(e) => setEditingPostText(e.target.value)}
                                className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 focus:outline-hidden leading-relaxed"
                                autoFocus
                              />
                            ) : (
                              <p className="text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed">
                                {post.text}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Connected Reply #2 */}
                    {currentVariant.reply_2 && (
                      <div className="relative flex gap-3 text-xs z-10 pt-1">
                        <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-[10px] text-zinc-400 shrink-0">
                          R2
                        </div>

                        <div className="flex-1 min-w-0 p-3.5 rounded-xl bg-zinc-900/20 border border-zinc-850/60 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-zinc-400">
                            <span className="font-medium text-zinc-400">
                              Reply ke-2 (Tautan / CTA)
                            </span>
                            {!isEditingReply2 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditingReply2(true);
                                  setEditingReply2Text(currentVariant.reply_2?.text || "");
                                }}
                                className="p-1 text-zinc-400 hover:text-zinc-200"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setIsEditingReply2(false)}
                                  className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300"
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSaveReply2Edit}
                                  className="px-2 py-0.5 rounded text-[10px] bg-zinc-100 text-zinc-950 font-semibold"
                                >
                                  Simpan
                                </button>
                              </div>
                            )}
                          </div>

                          {isEditingReply2 ? (
                            <textarea
                              rows={2}
                              value={editingReply2Text}
                              onChange={(e) => setEditingReply2Text(e.target.value)}
                              className="w-full p-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 focus:outline-hidden"
                              autoFocus
                            />
                          ) : (
                            <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                              {currentVariant.reply_2.text}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Visual Slides Preview Strip (if any) */}
                  {currentVariant.visual_slides && currentVariant.visual_slides.length > 0 && (
                    <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400">
                          {currentVariant.visual_slides.length} Slide Carousel
                        </span>
                        <div className="flex items-center gap-1">
                          {currentVariant.visual_slides.slice(0, 4).map((s, idx) => (
                            <img
                              key={idx}
                              src={s}
                              alt="Slide"
                              className="w-7 h-7 rounded border border-zinc-800 object-cover"
                            />
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVisualGeneratorVariant(currentVariant)}
                        className="text-zinc-400 hover:text-zinc-200 underline text-[11px]"
                      >
                        Ubah Slide
                      </button>
                    </div>
                  )}

                  {/* Bottom Action Bar */}
                  <div className="pt-4 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyAll(currentVariant)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                      >
                        {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedAll ? "Tersalin" : "Salin Semua"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVisualGeneratorVariant(currentVariant)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Palette className="w-3.5 h-3.5" />
                        <span>
                          {currentVariant.visual_slides && currentVariant.visual_slides.length > 0
                            ? `Slide (${currentVariant.visual_slides.length})`
                            : "Buat Slide"}
                        </span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPublishModalVariant(currentVariant)}
                      className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Posting ke Threads</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Calm Empty State */
            <div className="rounded-2xl border border-zinc-900 bg-zinc-900/10 min-h-[360px] flex flex-col items-center justify-center p-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 text-zinc-400 flex items-center justify-center font-bold text-sm">
                @
              </div>
              <h3 className="text-sm font-medium text-zinc-300">
                Ruang Draf Kosong
              </h3>
              <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                Tulis ide kasar atau keresahan Anda di formulir sebelah kiri untuk menyusun 3 draf utas siap publikasi.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Toast Notice */}
      {editNoticeToast && (
        <div className="fixed bottom-6 right-6 z-50 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-medium shadow-xl flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{editNoticeToast}</span>
        </div>
      )}

      {/* Visual Generator Modal */}
      {visualGeneratorVariant && (
        <VisualCardGenerator
          variant={visualGeneratorVariant}
          isOpen={!!visualGeneratorVariant}
          onClose={() => setVisualGeneratorVariant(null)}
          onApplyToVariant={handleApplyVisualSlides}
        />
      )}

      {/* Publish Modal */}
      {publishModalVariant && (
        <PublishModal
          variant={publishModalVariant}
          isOpen={!!publishModalVariant}
          onClose={() => setPublishModalVariant(null)}
          onRequestOpenVisualGenerator={() => {
            setPublishModalVariant(null);
            setVisualGeneratorVariant(currentVariant || null);
          }}
        />
      )}
    </div>
  );
};
