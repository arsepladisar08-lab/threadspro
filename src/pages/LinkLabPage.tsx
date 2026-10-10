import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Link2,
  Youtube,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Calendar,
  CheckSquare,
  RefreshCw,
  Film,
  Layers,
  Clock,
  Send,
  RotateCcw,
  Wand2,
  ShieldAlert,
  Info,
  Tag,
  Plus,
  Trash2,
} from "lucide-react";
import { UserProfile, GoalType, GenerationOutput, VariantOutput, CalendarDayItem, NicheType } from "../types";
import { storage } from "../lib/storage";
import { retrieveTopPatterns } from "../lib/retrieval";
import { auditVariant, autoFixVariant } from "../lib/guard";
import { generateJSON } from "../services/ai";
import { YoutubeAnglesOutput, AffiliateProductOutput } from "../types";

/**
 * Validasi tautan YouTube
 */
export function isValidYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  const ytRegex = /^(https?:\/\/)?((www|m)\.)?(youtube\.com\/(watch\?.*v=|shorts\/|embed\/|v\/|live\/)|youtu\.be\/)[\w\-]+(\S+)?$/i;
  return ytRegex.test(trimmed);
}

/**
 * Validasi tautan Affiliate (Shopee, Shope.ee, TikTok, vt.tiktok.com)
 */
export function isAffiliateUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim().toLowerCase();
  const affiliateRegex = /^(https?:\/\/)?([a-z0-9\-_\.]+\.)?(shopee\.(co\.id|com|sg|my|vn|ph|th)|shope\.ee|s\.shopee\.co\.id|tiktok\.com|vt\.tiktok\.com)(\/.*)?$/i;
  return affiliateRegex.test(trimmed);
}

export function getAffiliatePlatformLabel(url: string): string {
  const lower = (url || "").toLowerCase();
  if (lower.includes("shopee") || lower.includes("shope.ee")) return "Shopee Affiliate";
  if (lower.includes("tiktok") || lower.includes("vt.tiktok.com")) return "TikTok Shop Affiliate";
  return "Affiliate";
}

export const LinkLabPage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Mode Switcher: "youtube" | "affiliate"
  const [activeMode, setActiveMode] = useState<"youtube" | "affiliate">("youtube");

  // ==================== MODE 1: YOUTUBE STATE ====================
  const [youtubeInputUrl, setYoutubeInputUrl] = useState("");
  const [youtubeUrlError, setYoutubeUrlError] = useState<string | null>(null);
  const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);
  const [videoAnalysisError, setVideoAnalysisError] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<YoutubeAnglesOutput | null>(null);
  const [analyzedVideoUrl, setAnalyzedVideoUrl] = useState("");
  const [selectedAngleId, setSelectedAngleId] = useState<number | null>(null);
  const [includeVideoCredit, setIncludeVideoCredit] = useState(true);
  const [customCreator, setCustomCreator] = useState("");
  const [isGeneratingVideoThreads, setIsGeneratingVideoThreads] = useState(false);
  const [videoGenStep, setVideoGenStep] = useState<string | null>(null);
  const [videoGenError, setVideoGenError] = useState<string | null>(null);
  const [videoResult, setVideoResult] = useState<GenerationOutput | null>(null);
  const [activeVideoVariantIdx, setActiveVideoVariantIdx] = useState(0);

  // ==================== MODE 2: AFFILIATE STATE ====================
  const [affiliateInputUrl, setAffiliateInputUrl] = useState("");
  const [affiliateUrlError, setAffiliateUrlError] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productFeatures, setProductFeatures] = useState<string[]>([
    "Desain praktis dan nyaman untuk pemakaian sehari-hari",
    "Material kokoh dan awet dibanding produk sejenis",
    "Hemat waktu serta sebanding dengan harga yang terjangkau",
  ]);
  const [targetAudience, setTargetAudience] = useState("");
  const [isAnalyzingProduct, setIsAnalyzingProduct] = useState(false);
  const [affiliateAnalysisNotice, setAffiliateAnalysisNotice] = useState<string | null>(null);
  const [isGeneratingAffiliateThreads, setIsGeneratingAffiliateThreads] = useState(false);
  const [affiliateGenStep, setAffiliateGenStep] = useState<string | null>(null);
  const [affiliateGenError, setAffiliateGenError] = useState<string | null>(null);
  const [affiliateResult, setAffiliateResult] = useState<GenerationOutput | null>(null);
  const [activeAffiliateVariantIdx, setActiveAffiliateVariantIdx] = useState(0);

  // Feedback State
  const [copiedPostIdx, setCopiedPostIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  useEffect(() => {
    storage.getProfile().then((p) => {
      if (p) {
        setProfile(p);
      } else {
        const defaultProfile: UserProfile = {
          id: "default",
          niche: "Bisnis & UMKM",
          targetAudience: "Warga Threads yang mencari solusi praktis dan efisien",
          tone: "santai",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setProfile(defaultProfile);
      }
    });
  }, []);

  const showToast = (message: string) => {
    setToastNotice(message);
    setTimeout(() => setToastNotice(null), 3000);
  };

  // ==================== HANDLER MODE YOUTUBE ====================

  const handleAnalyzeVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setYoutubeUrlError(null);
    setVideoAnalysisError(null);

    const trimmed = youtubeInputUrl.trim();
    if (!trimmed) {
      setYoutubeUrlError("Silakan tempel URL YouTube terlebih dahulu.");
      return;
    }

    // Jika user menempel link shopee/tiktok di mode YouTube, sarankan beralih ke mode Affiliate
    if (isAffiliateUrl(trimmed)) {
      setAffiliateInputUrl(trimmed);
      setActiveMode("affiliate");
      showToast("Tautan terdeteksi sebagai produk affiliate. Dialihkan ke Mode Produk Affiliate.");
      return;
    }

    if (!isValidYouTubeUrl(trimmed)) {
      setYoutubeUrlError("Jenis link belum didukung");
      return;
    }

    setIsAnalyzingVideo(true);
    try {
      const response = await generateJSON<YoutubeAnglesOutput>("youtubeAngles", {
        youtubeUrl: trimmed,
        userProfile: profile,
      });

      if (!response || !response.angles || response.angles.length === 0) {
        throw new Error("Gemini tidak dapat mengekstrak angle dari video ini. Silakan coba lagi.");
      }

      setVideoData(response);
      setAnalyzedVideoUrl(trimmed);
      setCustomCreator(response.creator_name || "Kreator");
      setSelectedAngleId(response.angles[0].id);
      setVideoResult(null);
      showToast("5 ide angle utas berhasil diracik dari video!");
    } catch (err: any) {
      console.error("Gagal menganalisis video:", err);
      setVideoAnalysisError(
        err.message || "Gagal memahami video. Pastikan video publik dan periksa kuota Gemini API."
      );
    } finally {
      setIsAnalyzingVideo(false);
    }
  };

  const handleGenerateVideoThreads = async () => {
    if (!videoData || selectedAngleId === null) return;
    const chosenAngle = videoData.angles.find((a) => a.id === selectedAngleId);
    if (!chosenAngle) return;

    setIsGeneratingVideoThreads(true);
    setVideoGenError(null);
    setVideoGenStep("Mengekstrak DNA ide dari materi video...");

    try {
      const userNiche = (profile?.niche || "Bisnis & UMKM") as NicheType;
      const targetGoal = (chosenAngle.suggested_goal as GoalType) || "Jangkauan";

      const factsFromVideo = [
        `Materi Video: "${videoData.video_title}" oleh ${customCreator || videoData.creator_name}`,
        `Intisari: ${chosenAngle.summary}`,
        ...(chosenAngle.key_takeaways || []),
      ];

      const rawIdea = `[Angle Video]: ${chosenAngle.angle_title}\n[Hook Awal]: ${chosenAngle.hook_preview}\n[Konteks]: ${chosenAngle.summary}`;
      const realFacts = factsFromVideo.join("\n- ");

      let ideaDna: any;
      try {
        ideaDna = await generateJSON("ideaDna", {
          rawIdea,
          realFacts,
          userProfile: profile,
          targetGoal,
        });
      } catch (dnaErr) {
        console.warn("Fallback ideaDna:", dnaErr);
        ideaDna = {
          topik_inti: chosenAngle.angle_title,
          sudut: chosenAngle.summary,
          fakta_asli: factsFromVideo,
          emosi_target: "Penasaran & Terinspirasi",
          tujuan: targetGoal,
          placeholder_dibutuhkan: [],
        };
      }

      setVideoGenStep("Mengambil pola hook & struktur teruji dari bank...");
      const topPatterns = await retrieveTopPatterns(
        `${ideaDna.topik_inti} ${ideaDna.sudut} ${chosenAngle.hook_preview}`,
        userNiche,
        targetGoal
      );

      setVideoGenStep("Menulis 3 variasi utas Threads...");
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
        requestedGoal: targetGoal,
        goalInstruction:
          targetGoal !== "Konversi"
            ? `MUTLAK: Sasaran konten adalah "${targetGoal}". DILARANG KERAS membuat varian Konversi / Lapak / Jualan. DILARANG membuat reply_2 konversi (dilarang ajak cek bio, dilarang DM, dilarang jualan). reply_2 WAJIB berupa konteks tambahan atau pertanyaan diskusi.`
            : `Sasaran konten adalah "Konversi".`,
      };

      const writerOutput = await generateJSON<GenerationOutput>("writer", writerInput);

      setVideoGenStep("Memvalidasi kepatuhan Code Guard & aturan karakter...");
      const creatorAttribution = includeVideoCredit
        ? `💡 Referensi video: ${customCreator || videoData.creator_name} (${analyzedVideoUrl})`
        : "";

      const CONVERSION_CHECK = [
        /link\s+di\s+(bio|profil)/i,
        /cek\s+(bio|profil)/i,
        /klik\s+link/i,
        /dm\s+(gue|aku|saya|kami|kita|admin|min)/i,
        /kirim\s+dm/i,
        /japri/i,
        /beli\s+(sekarang|di)/i,
        /order\s+(di|sekarang)/i,
        /katalog/i,
        /checkout/i,
        /daftar\s+(webinar|kelas|kursus|workshop)/i,
        /konsultasi\s+(gratis|berbayar|dm)/i,
        /jasa\s+(kami|gue|aku)/i,
        /produk\s+(kami|gue|aku)/i,
        /etalase/i,
        /promo\s+terbatas/i,
      ];

      const auditedVariants = (writerOutput?.variants || []).map((variant) => {
        let fixedPosts = (variant.posts || []).map((post) => ({
          ...post,
          char_count: (post.text || "").length,
        }));

        let audited = { ...variant, posts: fixedPosts };

        // Bersihkan balasan konversi jika sasaran bukan konversi
        if (targetGoal !== "Konversi") {
          audited.goal = targetGoal;
          if (audited.template === "lapak" || audited.template === "softsell_cerita") {
            audited.template = targetGoal === "Kedekatan" ? "validasi" : "kontra_narasi";
          }

          const hasConversion = CONVERSION_CHECK.some((p) => p.test(audited.reply_2?.text || ""));
          if (hasConversion) {
            audited.reply_2.text =
              targetGoal === "Kedekatan"
                ? "Jujur, nulis utas ini bikin banyak refleksi baru. Menurut kalian gimana? Cerita santai di bawah yuk."
                : "Dari intisari video di atas, mana poin yang paling membuka wawasan kalian? Drop tanggapan kalian di bawah buat bahan diskusi.";
            audited.reply_2.contains_link = false;
          }
        }

        if (includeVideoCredit && creatorAttribution) {
          const baseReply = audited.reply_2?.text ? audited.reply_2.text.trim() : "";
          const finalReply = baseReply
            ? `${baseReply}\n\n${creatorAttribution}`
            : creatorAttribution;

          audited.reply_2 = {
            text: finalReply,
            contains_link: true,
          };
        }

        let auditRes = auditVariant(audited, rawIdea);
        if (!auditRes.passed) {
          audited = autoFixVariant(audited);
        }

        return audited;
      });

      const finalOutput: GenerationOutput = {
        ...writerOutput,
        idea_dna: ideaDna,
        variants: auditedVariants,
        timestamp: Date.now(),
      };

      setVideoResult(finalOutput);
      await storage.saveGeneration(finalOutput);
      setActiveVideoVariantIdx(finalOutput.recommended_variant ? finalOutput.recommended_variant - 1 : 0);
      showToast("3 varian utas video berhasil dirakit!");
    } catch (err: any) {
      console.error("Gagal merakit utas video:", err);
      setVideoGenError(err.message || "Gagal membuat varian utas. Silakan coba kembali.");
    } finally {
      setIsGeneratingVideoThreads(false);
      setVideoGenStep(null);
    }
  };

  // ==================== HANDLER MODE AFFILIATE ====================

  // Fitur Analisis Otomatis Form berdasarkan Link yang Diberikan via AI
  const handleAutoAnalyzeAffiliate = async () => {
    setAffiliateUrlError(null);
    setAffiliateAnalysisNotice(null);

    const trimmed = affiliateInputUrl.trim();
    if (!trimmed) {
      setAffiliateUrlError("Silakan masukkan tautan affiliate Shopee atau TikTok terlebih dahulu.");
      return;
    }

    if (!isAffiliateUrl(trimmed)) {
      setAffiliateUrlError("Jenis link belum didukung. Masukkan link Shopee (shopee.co.id, shope.ee) atau TikTok (tiktok.com, vt.tiktok.com).");
      return;
    }

    setIsAnalyzingProduct(true);
    try {
      const analyzed = await generateJSON<AffiliateProductOutput>("affiliateProduct", {
        affiliateUrl: trimmed,
        userProfile: profile,
      });

      if (analyzed) {
        if (analyzed.product_name) setProductName(analyzed.product_name);
        if (analyzed.price) setProductPrice(analyzed.price);
        if (analyzed.features && analyzed.features.length > 0) {
          setProductFeatures(analyzed.features.slice(0, 3));
        }
        if (analyzed.target_audience) setTargetAudience(analyzed.target_audience);

        setAffiliateAnalysisNotice("Form berhasil diisi otomatis oleh AI berdasarkan analisis tautan!");
        setTimeout(() => setAffiliateAnalysisNotice(null), 3500);
      }
    } catch (err: any) {
      console.warn("Analisis otomatis link affiliate gagal, fallback panduan:", err);
      setAffiliateAnalysisNotice("Silakan lengkapi form produk secara manual di bawah.");
      setTimeout(() => setAffiliateAnalysisNotice(null), 3000);
    } finally {
      setIsAnalyzingProduct(false);
    }
  };

  // Eksekusi Pipeline 3 Gaya Utas Afiliasi (Problem-Solution, Cerita Pengalaman, Perbandingan)
  const handleGenerateAffiliateThreads = async (e: React.FormEvent) => {
    e.preventDefault();
    setAffiliateUrlError(null);
    setAffiliateGenError(null);

    const trimmedUrl = affiliateInputUrl.trim();
    if (!trimmedUrl) {
      setAffiliateUrlError("Tautan affiliate wajib diisi.");
      return;
    }

    if (!isAffiliateUrl(trimmedUrl)) {
      setAffiliateUrlError("Jenis link belum didukung. Masukkan link Shopee (shopee.co.id, shope.ee) atau TikTok (tiktok.com, vt.tiktok.com).");
      return;
    }

    if (!productName.trim()) {
      setAffiliateGenError("Nama produk tidak boleh kosong.");
      return;
    }

    setIsGeneratingAffiliateThreads(true);
    setAffiliateGenStep("Menyusun DNA ide produk untuk 3 gaya utas...");

    try {
      const userNiche = (profile?.niche || "Bisnis & UMKM") as NicheType;
      const validFeatures = productFeatures.filter((f) => f.trim().length > 0);

      // Raw Idea & Facts khusus Produk Afiliasi
      const rawIdea = `[Produk Affiliate]: ${productName}\n[Harga]: ${productPrice || "Terjangkau"}\n[Keunggulan]: ${validFeatures.join("; ")}\n[Target Pembeli]: ${targetAudience || "Pengguna yang mencari efisiensi"}\n[Link Toko CTA]: ${trimmedUrl}`;

      const realFacts = [
        `Nama Produk: ${productName}`,
        `Estimasi Harga: ${productPrice || "Sesuai etalase"}`,
        `Fitur & Nilai Guna: ${validFeatures.join(", ")}`,
        `Target Audiens: ${targetAudience || "Peminat produk praktis"}`,
        `Link Etalase: ${trimmedUrl}`,
      ].join("\n- ");

      // 1. Pipeline Tahap 1: Idea DNA
      let ideaDna: any;
      try {
        ideaDna = await generateJSON("ideaDna", {
          rawIdea,
          realFacts,
          userProfile: profile,
          targetGoal: "Simpanan",
        });
      } catch (dnaErr) {
        console.warn("Fallback ideaDna affiliate:", dnaErr);
        ideaDna = {
          topik_inti: `Solusi praktis dengan ${productName}`,
          sudut: "Ulasan jujur tanpa klaim berlebihan",
          fakta_asli: [realFacts],
          emosi_target: "Tercerahkan & Terbantu",
          tujuan: "Konversi",
          placeholder_dibutuhkan: [],
        };
      }

      // 2. Pipeline Tahap 2: Retrieval Bank Pola Teruji
      setAffiliateGenStep("Mengambil pola hook & struktur teruji dari bank...");
      const topPatterns = await retrieveTopPatterns(
        `${ideaDna.topik_inti} ${ideaDna.sudut} rekomendasi produk`,
        userNiche,
        "Konversi"
      );

      // 3. Pipeline Tahap 3: Writer
      setAffiliateGenStep("Menulis 3 gaya utas: Problem-Solution, Cerita Pengalaman, & Perbandingan...");
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
        requestedGoal: "Konversi",
      };

      const writerOutput = await generateJSON<GenerationOutput>("writer", writerInput);

      // 4. Pipeline Tahap 4: Code Guard Audit & Penyematan CTA Link di Balasan Terakhir
      setAffiliateGenStep("Memvalidasi kepatuhan Code Guard & menyematkan link CTA di balasan terakhir...");

      // Teks CTA khusus dengan link affiliate & transparansi
      const ctaReplyText = `Buat yang mau cek ${productName.trim()}, link etalase resminya ada di sini ya:
${trimmedUrl}

(Catatan: Tautan di atas merupakan link afiliasi resmi. Belilah sesuai kebutuhan dan jangan lupa cek ulasan toko ya!)`;

      const styleLabels = ["Problem-Solution", "Cerita Pengalaman", "Perbandingan"];

      const auditedVariants = (writerOutput?.variants || []).map((variant, idx) => {
        let fixedPosts = (variant.posts || []).map((post) => ({
          ...post,
          char_count: (post.text || "").length,
        }));

        let audited = { ...variant, posts: fixedPosts };

        // Pastikan nama gaya tersemat jelas pada template
        audited.template = styleLabels[idx] || variant.template;

        // Sematkan link affiliate pada balasan terakhir (reply_2)
        audited.reply_2 = {
          text: ctaReplyText,
          contains_link: true,
        };

        let auditRes = auditVariant(audited, rawIdea);
        if (!auditRes.passed) {
          audited = autoFixVariant(audited);
          // Tetap pastikan CTA reply_2 tidak terhapus setelah autofix
          audited.reply_2 = {
            text: ctaReplyText,
            contains_link: true,
          };
        }

        return audited;
      });

      const finalOutput: GenerationOutput = {
        ...writerOutput,
        idea_dna: ideaDna,
        variants: auditedVariants,
        timestamp: Date.now(),
      };

      setAffiliateResult(finalOutput);
      await storage.saveGeneration(finalOutput);
      setActiveAffiliateVariantIdx(0);
      showToast("3 gaya utas afiliasi berhasil dirakit!");
    } catch (err: any) {
      console.error("Gagal merakit utas afiliasi:", err);
      setAffiliateGenError(err.message || "Gagal membuat varian utas afiliasi. Silakan periksa kembali data.");
    } finally {
      setIsGeneratingAffiliateThreads(false);
      setAffiliateGenStep(null);
    }
  };

  // ==================== COMMON ACTION HANDLERS ====================

  const handleCopyPost = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedPostIdx(idx);
    setTimeout(() => setCopiedPostIdx(null), 1500);
  };

  const handleCopyAll = (variant: VariantOutput) => {
    const fullText = variant.posts.map((p) => p.text).join("\n\n---\n\n");
    const withReply2 = variant.reply_2?.text
      ? `${fullText}\n\n[Reply Terakhir / CTA]\n${variant.reply_2.text}`
      : fullText;

    navigator.clipboard.writeText(withReply2);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
    showToast("Seluruh draf utas disalin ke clipboard!");
  };

  const handleSaveToCalendar = async (variant: VariantOutput, titlePillar: string) => {
    const currentCalendar = (await storage.getCalendar()) || [];
    const newDayNumber = currentCalendar.length + 1;

    const newCalendarItem: CalendarDayItem = {
      id: `link_${Date.now()}`,
      dayNumber: newDayNumber,
      dayName: `Hari ${newDayNumber}`,
      dateStr: new Date().toISOString().split("T")[0],
      goal: (variant.goal as GoalType) || "Simpanan",
      pillar: titlePillar.slice(0, 30),
      ideaPrompt: variant.hooks[0] || variant.posts[0]?.text || "Utas dari Link Lab",
      cardId: variant.fusion_trace?.card_id || "K01",
      hookPattern: variant.fusion_trace?.pola_dipinjam || "Pola Rekomendasi Link Lab",
      format: variant.template || "Rekomendasi",
      topicTag: variant.topic_tag || "Rekomendasi",
      timeWIB: variant.best_time_wib || "19.30 - 22.30 WIB",
      replyActionGoal: "Balas 10-15 komentar pertama dan pantau klik CTA di reply",
      status: "drafted",
    };

    const updatedCalendar = [...currentCalendar, newCalendarItem];
    await storage.saveCalendar(updatedCalendar);
    showToast("Utas berhasil disimpan ke Kalender Konten!");
  };

  const handleNavigateToChecker = (variant: VariantOutput) => {
    const post1 = variant.posts[0]?.text || "";
    const post2 = variant.posts[1]?.text || "";
    const tag = variant.topic_tag || "";
    const reply2 = variant.reply_2?.text || "";

    navigate("/cek", {
      state: {
        post1Text: post1,
        post2Text: post2,
        topicTag: tag,
        reply2Text: reply2,
      },
    });
  };

  const currentVideoVariant = videoResult?.variants?.[activeVideoVariantIdx];
  const currentAffiliateVariant = affiliateResult?.variants?.[activeAffiliateVariantIdx];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-28 space-y-8">
      {/* Toast Notifikasi */}
      {toastNotice && (
        <div className="fixed bottom-20 lg:bottom-8 right-6 z-50 px-4 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/60">
                <Link2 className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Link Lab
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1.5 max-w-2xl">
              Ubah link video YouTube atau link produk affiliate e-commerce (Shopee & TikTok) menjadi draf utas Threads bernilai tinggi yang lolos audit algoritma.
            </p>
          </div>

          {profile && (
            <div className="shrink-0 text-right hidden sm:block">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">Profil Niche:</span>
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                {profile.niche} ({profile.tone})
              </span>
            </div>
          )}
        </div>

        {/* Tab Switcher Mode */}
        <div className="flex items-center gap-2 mt-5">
          <button
            type="button"
            onClick={() => setActiveMode("youtube")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 cursor-pointer border ${
              activeMode === "youtube"
                ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 shadow-2xs"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Youtube className="w-4 h-4 text-red-500" />
            <span>Video YouTube</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("affiliate")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 cursor-pointer border ${
              activeMode === "affiliate"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 shadow-2xs"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-emerald-500" />
            <span>Produk Affiliate</span>
          </button>
        </div>
      </div>

      {/* ==================== TAMPILAN MODE 1: VIDEO YOUTUBE ==================== */}
      {activeMode === "youtube" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Form Input Tautan YouTube */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <form onSubmit={handleAnalyzeVideo} className="space-y-4">
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Tautan Video YouTube
              </label>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Youtube className="w-4 h-4 text-red-500" />
                  </div>
                  <input
                    type="text"
                    value={youtubeInputUrl}
                    onChange={(e) => {
                      setYoutubeInputUrl(e.target.value);
                      if (youtubeUrlError) setYoutubeUrlError(null);
                    }}
                    placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                    disabled={isAnalyzingVideo || isGeneratingVideoThreads}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAnalyzingVideo || isGeneratingVideoThreads}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer shadow-xs shrink-0"
                >
                  {isAnalyzingVideo ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menganalisis Video...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Bedah Video</span>
                    </>
                  )}
                </button>
              </div>

              {/* Validasi & Pesan Error URL YouTube */}
              {youtubeUrlError && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>{youtubeUrlError}</span>
                </div>
              )}

              {/* Pesan Error Analisis Video */}
              {videoAnalysisError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <div className="space-y-1">
                    <p className="font-semibold">Gagal memproses video YouTube</p>
                    <p>{videoAnalysisError}</p>
                  </div>
                </div>
              )}

              {/* Loading State Video Understanding */}
              {isAnalyzingVideo && (
                <div className="p-5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-indigo-900 dark:text-indigo-200 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2.5 font-medium">
                    <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span>Gemini sedang menonton dan memahami video YouTube...</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 pl-6">
                    Mengekstrak konsep inti, cerita kreator, data empiris, dan memetakan 5 angle utas terbaik sesuai niche Anda.
                  </p>
                </div>
              )}
            </form>
          </div>

          {/* Hasil Video Understanding & Pemilihan 5 Angle Utas */}
          {videoData && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-red-500 shrink-0" />
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {videoData.video_title || "Video YouTube Terpilih"}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {videoData.video_summary}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 pt-0.5">
                    <span>Kreator:</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {videoData.creator_name || "Tidak terdeteksi"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setVideoData(null);
                    setVideoResult(null);
                    setYoutubeInputUrl("");
                  }}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer self-start md:self-auto shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ganti Video</span>
                </button>
              </div>

              {/* Opsi Kredit Kreator */}
              <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <input
                    id="video-credit-toggle"
                    type="checkbox"
                    checked={includeVideoCredit}
                    onChange={(e) => setIncludeVideoCredit(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 border-zinc-300 dark:border-zinc-700 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="video-credit-toggle" className="text-xs font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer select-none">
                    Cantumkan kredit ke kreator di utas
                  </label>
                </div>

                {includeVideoCredit && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">Nama Kreator:</span>
                    <input
                      type="text"
                      value={customCreator}
                      onChange={(e) => setCustomCreator(e.target.value)}
                      placeholder="Nama kreator / kanal"
                      className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Daftar 5 Ide Angle Utas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Pilih 1 dari 5 Ide Angle Utas
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Setiap angle dirancang dengan strategi algoritma Threads yang berbeda.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold">
                    5 Pilihan
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {videoData.angles.map((angle) => {
                    const isSelected = selectedAngleId === angle.id;

                    return (
                      <div
                        key={angle.id}
                        onClick={() => setSelectedAngleId(angle.id)}
                        className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? "bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20"
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                              Angle #{angle.id}
                            </span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                              {angle.suggested_goal || "Jangkauan"}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                            {angle.angle_title}
                          </h4>

                          {angle.hook_preview && (
                            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 italic bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg border border-zinc-100 dark:border-zinc-850">
                              &ldquo;{angle.hook_preview}&rdquo;
                            </p>
                          )}

                          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            {angle.summary}
                          </p>

                          {angle.key_takeaways && angle.key_takeaways.length > 0 && (
                            <div className="space-y-1 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 block">
                                Poin Kunci Video:
                              </span>
                              <ul className="text-[10px] text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-0.5">
                                {angle.key_takeaways.slice(0, 2).map((takeaway, idx) => (
                                  <li key={idx} className="truncate">
                                    {takeaway}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center gap-1.5 text-xs">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? "border-indigo-600 bg-indigo-600 text-white"
                                  : "border-zinc-300 dark:border-zinc-700 bg-transparent"
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5" />}
                            </div>
                            <span className={`text-[11px] font-medium ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500"}`}>
                              {isSelected ? "Dipilih" : "Pilih angle ini"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tombol Eksekusi Pipeline 3 Varian Utas Video */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Pipeline: <span className="font-semibold text-zinc-800 dark:text-zinc-200">Idea DNA</span> → <span className="font-semibold text-zinc-800 dark:text-zinc-200">Writer</span> → <span className="font-semibold text-zinc-800 dark:text-zinc-200">Code Guard</span>
                  </p>

                  <button
                    type="button"
                    onClick={handleGenerateVideoThreads}
                    disabled={isGeneratingVideoThreads || selectedAngleId === null}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer shadow-xs"
                  >
                    {isGeneratingVideoThreads ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{videoGenStep || "Memproses Utas..."}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Buat 3 Varian Utas</span>
                      </>
                    )}
                  </button>
                </div>

                {videoGenError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>{videoGenError}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Output 3 Varian Utas Video */}
          {videoResult && videoResult.variants && videoResult.variants.length > 0 && currentVideoVariant && (
            <div className="space-y-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-500" />
                    <span>3 Varian Utas Siap Tayang</span>
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Tiap varian telah diaudit oleh Code Guard terhadap batas karakter dan kepatuhan algoritma Threads.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 self-start sm:self-auto">
                  {videoResult.variants.map((v, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveVideoVariantIdx(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                        activeVideoVariantIdx === idx
                          ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                      }`}
                    >
                      <span>Varian {idx + 1}</span>
                      {(videoResult.recommended_variant || 1) === idx + 1 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Rekomendasi Utama" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kotak Detail Utas Aktif */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Varian #{activeVideoVariantIdx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px]">
                      Format: {currentVideoVariant.template || "Video Breakdown"}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px]">
                      Tujuan: {currentVideoVariant.goal || "Jangkauan"}
                    </span>
                    {currentVideoVariant.topic_tag && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium">
                        #{currentVideoVariant.topic_tag}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyAll(currentVideoVariant)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAll ? "Tersalin!" : "Salin Semua Utas"}</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {currentVideoVariant.posts.map((post, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-850 space-y-2 relative group"
                    >
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-300">
                          {pIdx === 0 ? "Post #1 (Hook Pembuka)" : `Post #${pIdx + 1}`}
                        </span>
                        <div className="flex items-center gap-3">
                          <span>{post.text.length} / 500 karakter</span>
                          <button
                            type="button"
                            onClick={() => handleCopyPost(post.text, pIdx)}
                            className="text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
                            title="Salin post ini"
                          >
                            {copiedPostIdx === pIdx ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                        {post.text}
                      </p>
                    </div>
                  ))}

                  {currentVideoVariant.reply_2?.text && (
                    <div className="p-4 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                          <Send className="w-3 h-3" />
                          <span>Reply #2 (Kredit Video & Pemicu Reply Velocity)</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyPost(currentVideoVariant.reply_2.text, 999)}
                          className="text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 transition cursor-pointer"
                        >
                          {copiedPostIdx === 999 ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <p className="text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                        {currentVideoVariant.reply_2.text}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bilah Tombol Tindakan */}
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Jam Tayang Rekomendasi: {currentVideoVariant.best_time_wib || "19.30 - 22.30 WIB"}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleSaveToCalendar(currentVideoVariant, `Video: ${videoData?.video_title || "YouTube"}`)}
                      className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
                    >
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      <span>Simpan ke Kalender</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigateToChecker(currentVideoVariant)}
                      className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
                    >
                      <CheckSquare className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                      <span>Cek Utas</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAMPILAN MODE 2: PRODUK AFFILIATE ==================== */}
      {activeMode === "affiliate" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Pengingat Etika & Transparansi Afiliasi Threads */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs space-y-2 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Pengingat Transparansi Afiliasi & Kebijakan Algoritma Threads</span>
            </div>
            <ul className="text-[11px] text-amber-800 dark:text-amber-300 list-disc list-inside space-y-1 pl-1">
              <li>
                <strong>Cantumkan Keterangan Afiliasi:</strong> Selalu sertakan penanda transparan (seperti #afiliasi, tautan partner, atau catatan resmi) di balasan CTA agar audiens menghargai kejujuran Anda dan mematuhi etika periklanan digital.
              </li>
              <li>
                <strong>Hindari Klaim Berlebihan:</strong> Jangan gunakan klaim mutlak atau sensasional tak berdasar (&ldquo;100% ajaib&rdquo;, &ldquo;pasti kaya&rdquo;) agar konten Anda tidak terkena penalti shadowban atau dianggap engagement bait oleh algoritma Meta.
              </li>
            </ul>
          </div>

          {/* Form Singkat Produk Affiliate */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-500" />
                  <span>Form Produk Affiliate (Shopee & TikTok)</span>
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Masukkan tautan affiliate, gunakan analisis otomatis via AI untuk mengisi form, lalu edit sesuai detail produk asli Anda.
                </p>
              </div>

              {affiliateInputUrl && isAffiliateUrl(affiliateInputUrl) && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold self-start sm:self-auto">
                  {getAffiliatePlatformLabel(affiliateInputUrl)}
                </span>
              )}
            </div>

            <form onSubmit={handleGenerateAffiliateThreads} className="space-y-4">
              {/* Field 1: Tautan Link Affiliate */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Tautan Affiliate (Shopee / TikTok) *
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoAnalyzeAffiliate}
                    disabled={isAnalyzingProduct || !affiliateInputUrl.trim()}
                    className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    {isAnalyzingProduct ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Menganalisis link...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Isi Form Otomatis via AI</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={affiliateInputUrl}
                    onChange={(e) => {
                      setAffiliateInputUrl(e.target.value);
                      if (affiliateUrlError) setAffiliateUrlError(null);
                    }}
                    placeholder="https://shope.ee/..., https://shopee.co.id/..., atau https://vt.tiktok.com/..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition"
                  />
                </div>

                {affiliateUrlError && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{affiliateUrlError}</span>
                  </p>
                )}

                {affiliateAnalysisNotice && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{affiliateAnalysisNotice}</span>
                  </p>
                )}
              </div>

              {/* Grid 2 Kolom: Nama Produk & Harga */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Nama Produk *
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Contoh: Mouse Wireless Ergonomis Silent Click"
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Harga / Kisaran Harga
                  </label>
                  <input
                    type="text"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="Contoh: Rp129.000 atau Rp99.000 - Rp150.000"
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* 2-3 Keunggulan Utama Produk */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    2–3 Keunggulan Utama Produk
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    Fokus pada manfaat nyata, bukan klaim berlebihan
                  </span>
                </div>

                <div className="space-y-2">
                  {productFeatures.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2">
                      <span className="w-5 text-center text-xs font-semibold text-zinc-400 shrink-0">
                        {fIdx + 1}.
                      </span>
                      <input
                        type="text"
                        value={feat}
                        onChange={(e) => {
                          const updated = [...productFeatures];
                          updated[fIdx] = e.target.value;
                          setProductFeatures(updated);
                        }}
                        placeholder={`Keunggulan #${fIdx + 1}`}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {productFeatures.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setProductFeatures(productFeatures.filter((_, i) => i !== fIdx))}
                          className="p-1.5 text-zinc-400 hover:text-rose-500 transition cursor-pointer"
                          title="Hapus keunggulan ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}

                  {productFeatures.length < 3 && (
                    <button
                      type="button"
                      onClick={() => setProductFeatures([...productFeatures, ""])}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Keunggulan</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Target Pembeli */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Target Pembeli
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Contoh: Pekerja WFH, programmer, mahasiswa skripsian yang sering pegal tangan"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Error Message Affiliate */}
              {affiliateGenError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{affiliateGenError}</span>
                </div>
              )}

              {/* Tombol Eksekusi 3 Gaya Utas Afiliasi */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  3 Gaya: <span className="font-semibold text-zinc-800 dark:text-zinc-200">Problem-Solution</span>, <span className="font-semibold text-zinc-800 dark:text-zinc-200">Cerita Pengalaman</span>, & <span className="font-semibold text-zinc-800 dark:text-zinc-200">Perbandingan</span>
                </p>

                <button
                  type="submit"
                  disabled={isGeneratingAffiliateThreads || !productName.trim() || !affiliateInputUrl.trim()}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer shadow-xs"
                >
                  {isGeneratingAffiliateThreads ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{affiliateGenStep || "Memproses Utas Afiliasi..."}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Buat 3 Gaya Utas Afiliasi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Output 3 Gaya Utas Afiliasi */}
          {affiliateResult && affiliateResult.variants && affiliateResult.variants.length > 0 && currentAffiliateVariant && (
            <div className="space-y-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-500" />
                    <span>3 Gaya Utas Afiliasi Siap Diposting</span>
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Tiap gaya membawa sudut pendekatan psikologis berbeda tanpa hard-selling kasar, dengan link etalase tersimpan di balasan terakhir.
                  </p>
                </div>

                {/* Tab Switcher 3 Gaya */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 self-start sm:self-auto">
                  {["Problem-Solution", "Cerita Pengalaman", "Perbandingan"].map((styleLabel, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveAffiliateVariantIdx(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                        activeAffiliateVariantIdx === idx
                          ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                      }`}
                    >
                      <span>Gaya {idx + 1}: {styleLabel}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Kotak Detail Utas Afiliasi Aktif */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Gaya: {currentAffiliateVariant.template || "Rekomendasi"}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium">
                      CTA di Balasan Terakhir
                    </span>
                    {currentAffiliateVariant.topic_tag && (
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px]">
                        #{currentAffiliateVariant.topic_tag}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyAll(currentAffiliateVariant)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAll ? "Tersalin!" : "Salin Semua Utas"}</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {currentAffiliateVariant.posts.map((post, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-850 space-y-2 relative group"
                    >
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-300">
                          {pIdx === 0 ? "Post #1 (Hook Pembuka Tanpa Hard-sell)" : `Post #${pIdx + 1}`}
                        </span>
                        <div className="flex items-center gap-3">
                          <span>{post.text.length} / 500 karakter</span>
                          <button
                            type="button"
                            onClick={() => handleCopyPost(post.text, pIdx)}
                            className="text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
                            title="Salin post ini"
                          >
                            {copiedPostIdx === pIdx ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                        {post.text}
                      </p>
                    </div>
                  ))}

                  {/* Reply Terakhir: CTA Link Afiliasi & Keterangan Afiliasi */}
                  {currentAffiliateVariant.reply_2?.text && (
                    <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                          <Send className="w-3 h-3" />
                          <span>Balasan Terakhir (CTA Link Toko & Keterangan Afiliasi)</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyPost(currentAffiliateVariant.reply_2.text, 999)}
                          className="text-emerald-500 hover:text-emerald-800 dark:hover:text-emerald-200 transition cursor-pointer"
                        >
                          {copiedPostIdx === 999 ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <p className="text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                        {currentAffiliateVariant.reply_2.text}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bilah Tombol Tindakan Afiliasi */}
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Jam Tayang Rekomendasi: {currentAffiliateVariant.best_time_wib || "19.30 - 22.30 WIB"}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleSaveToCalendar(currentAffiliateVariant, `Afiliasi: ${productName}`)}
                      className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
                    >
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      <span>Simpan ke Kalender</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigateToChecker(currentAffiliateVariant)}
                      className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
                    >
                      <CheckSquare className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                      <span>Cek Utas</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
