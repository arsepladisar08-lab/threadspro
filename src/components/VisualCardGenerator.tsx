import React, { useState, useEffect, useRef, useCallback } from "react";
import { VariantOutput } from "../types";
import { threadsClient } from "../services/threadsClient";
import {
  X,
  Download,
  Check,
  ChevronLeft,
  ChevronRight,
  Palette,
  Sparkles,
  Layers,
  Ratio,
  User,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";

export type VisualTheme = "dark" | "paper" | "terminal" | "gradient";
export type AspectRatio = "1:1" | "4:5";

export interface SlideItem {
  id: string;
  headline: string;
  body: string;
  subtext?: string;
  category?: string;
}

interface Props {
  variant?: VariantOutput | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyToVariant?: (slidesBase64: string[], meta: { theme: VisualTheme; aspectRatio: AspectRatio }) => void;
}

const THEME_OPTIONS: { id: VisualTheme; name: string; desc: string; bgClass: string; badge: string }[] = [
  {
    id: "dark",
    name: "Dark Minimal",
    desc: "Zinc-950 elegan khas Threads",
    bgClass: "bg-neutral-950 border-neutral-700 text-white",
    badge: "Populer",
  },
  {
    id: "paper",
    name: "Paper Craft",
    desc: "Hangat editorial ala koran modern",
    bgClass: "bg-[#faf8f5] border-[#e4ded5] text-neutral-900",
    badge: "Editorial",
  },
  {
    id: "terminal",
    name: "Terminal Mono",
    desc: "Gaya hacker / developer monospaced",
    bgClass: "bg-[#050811] border-emerald-500/40 text-emerald-400",
    badge: "Code",
  },
  {
    id: "gradient",
    name: "Gradient Dusk",
    desc: "Aksen gradasi neon ungu & pink",
    bgClass: "bg-gradient-to-br from-[#0c0a1d] to-[#250d3d] border-indigo-500/40 text-indigo-300",
    badge: "Vibrant",
  },
];

export const VisualCardGenerator: React.FC<Props> = ({
  variant,
  isOpen,
  onClose,
  onApplyToVariant,
}) => {
  const [theme, setTheme] = useState<VisualTheme>("dark");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [authorName, setAuthorName] = useState("AutoThreads");
  const [authorHandle, setAuthorHandle] = useState("@threads_creator");
  const [showSlideNumber, setShowSlideNumber] = useState(true);
  const [showCategory, setShowCategory] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Inisialisasi slide dari varian aktif
  useEffect(() => {
    if (!isOpen) return;

    // Ambil info akun Threads jika terhubung
    threadsClient.getAccount().then((acc) => {
      if (acc) {
        setAuthorName(acc.name || acc.username || "Kreator Threads");
        setAuthorHandle(`@${acc.username || "threads_user"}`);
      }
    });

    if (variant && variant.posts && variant.posts.length > 0) {
      const initialSlides: SlideItem[] = variant.posts.map((post, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === variant.posts.length - 1;
        const topic = variant.topic_tag ? variant.topic_tag.replace(/#/g, "").trim() : "Threads";

        let headline = isFirst ? `Utas: ${topic}` : `Insight #${post.order}`;
        let subtext = "";

        if (isFirst && variant.posts.length > 1) {
          subtext = `Geser ke slide selanjutnya 👉 (${idx + 1}/${variant.posts.length})`;
        } else if (isLast) {
          subtext = variant.closing_question || "Ketik pendapat lo di reply! 💬";
        } else {
          subtext = `Lanjut ke slide ${idx + 2} 👉`;
        }

        return {
          id: `slide-${idx + 1}-${Date.now()}`,
          headline,
          body: post.text,
          subtext,
          category: topic,
        };
      });

      setSlides(initialSlides);
      setCurrentSlideIdx(0);
    } else {
      // Default placeholder jika dibuka tanpa varian
      setSlides([
        {
          id: "default-1",
          headline: "Kunci Pertumbuhan di Threads",
          body: "Konsistensi bukan cuma soal kuantitas posting, tapi soal seberapa dalam kamu memicu percakapan yang bermakna di kolom balasan.",
          subtext: "Geser ke slide 2 👉",
          category: "Pertumbuhan Akun",
        },
        {
          id: "default-2",
          headline: "Golden Rule Algoritma Meta",
          body: "Postingan dengan rasio Reply-to-Like di atas 0.3 memiliki peluang 4x lipat lebih besar untuk direkomendasikan di tab For You.",
          subtext: "Sampaikan sudut pandang lo di bawah 💬",
          category: "Pertumbuhan Akun",
        },
      ]);
      setCurrentSlideIdx(0);
    }
  }, [isOpen, variant]);

  // Helper untuk wrapping text di canvas
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    fontSize: number,
    lineHeightFactor: number = 1.4
  ): { lines: string[]; totalHeight: number } => {
    ctx.font = `${fontSize}px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const paragraphs = text.split("\n");
    const lines: string[] = [];
    const lineHeight = fontSize * lineHeightFactor;

    for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
      const para = paragraphs[pIdx];
      if (para.trim() === "") {
        lines.push("");
        continue;
      }
      const words = para.split(" ");
      let currentLine = "";

      for (let w = 0; w < words.length; w++) {
        const word = words[w];
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
    }

    return { lines, totalHeight: lines.length * lineHeight };
  };

  // Render slide tunggal ke canvas
  const drawSlideToCanvas = useCallback(
    (canvas: HTMLCanvasElement, slide: SlideItem, slideIndex: number, totalCount: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = 1080;
      const height = aspectRatio === "1:1" ? 1080 : 1350;

      canvas.width = width;
      canvas.height = height;

      // 1. Gambar Background & Border sesuai Tema
      if (theme === "dark") {
        // Dark Mode Minimal
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, "#09090b");
        bgGrad.addColorStop(1, "#121217");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Frame Border halus
        ctx.strokeStyle = "#27272a";
        ctx.lineWidth = 16;
        ctx.strokeRect(32, 32, width - 64, height - 64);

        // Accent Line
        ctx.strokeStyle = "#3f3f46";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(96, 210);
        ctx.lineTo(width - 96, 210);
        ctx.stroke();

      } else if (theme === "paper") {
        // Paper Craft
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, "#faf8f5");
        bgGrad.addColorStop(1, "#f3ede2");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Double Border Vintage
        ctx.strokeStyle = "#d6cec2";
        ctx.lineWidth = 8;
        ctx.strokeRect(36, 36, width - 72, height - 72);

        ctx.strokeStyle = "#c2410c";
        ctx.lineWidth = 3;
        ctx.strokeRect(48, 48, width - 96, height - 96);

        // Garis Pembatas
        ctx.strokeStyle = "#e2ded4";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(96, 210);
        ctx.lineTo(width - 96, 210);
        ctx.stroke();

      } else if (theme === "terminal") {
        // Monospaced Terminal
        ctx.fillStyle = "#050811";
        ctx.fillRect(0, 0, width, height);

        // Subtle Terminal Grid
        ctx.strokeStyle = "#0d1527";
        ctx.lineWidth = 1;
        for (let x = 60; x < width; x += 60) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 60; y < height; y += 60) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Terminal Window Header Box
        ctx.fillStyle = "#0c1222";
        ctx.fillRect(40, 40, width - 80, 70);
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 3;
        ctx.strokeRect(40, 40, width - 80, height - 80);

        // 3 Window Dots (Mac style)
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(75, 75, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(105, 75, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.arc(135, 75, 10, 0, Math.PI * 2);
        ctx.fill();

        // Title bar
        ctx.fillStyle = "#64748b";
        ctx.font = 'bold 22px "Courier New", monospace';
        ctx.fillText(`threads:~/carousel_slide_0${slideIndex + 1}.sh`, 170, 83);

      } else if (theme === "gradient") {
        // Gradient Dusk
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, "#0c081e");
        bgGrad.addColorStop(0.5, "#180a2e");
        bgGrad.addColorStop(1, "#270c38");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Glowing Gradient Border
        const borderGrad = ctx.createLinearGradient(0, 0, width, height);
        borderGrad.addColorStop(0, "#6366f1");
        borderGrad.addColorStop(0.5, "#ec4899");
        borderGrad.addColorStop(1, "#a855f7");
        ctx.strokeStyle = borderGrad;
        ctx.lineWidth = 14;
        ctx.strokeRect(36, 36, width - 72, height - 72);

        // Garis Pembatas Neon
        ctx.strokeStyle = "#432874";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(96, 210);
        ctx.lineTo(width - 96, 210);
        ctx.stroke();
      }

      // 2. Header Area: Avatar, Nama, Threads Handle & Tag
      const headerY = theme === "terminal" ? 170 : 130;

      // Avatar Circle Mock
      ctx.save();
      ctx.beginPath();
      ctx.arc(130, headerY, 36, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      const avatarGrad = ctx.createLinearGradient(94, headerY - 36, 166, headerY + 36);
      if (theme === "paper") {
        avatarGrad.addColorStop(0, "#ea580c");
        avatarGrad.addColorStop(1, "#c2410c");
      } else if (theme === "terminal") {
        avatarGrad.addColorStop(0, "#10b981");
        avatarGrad.addColorStop(1, "#047857");
      } else if (theme === "gradient") {
        avatarGrad.addColorStop(0, "#ec4899");
        avatarGrad.addColorStop(1, "#6366f1");
      } else {
        avatarGrad.addColorStop(0, "#4f46e5");
        avatarGrad.addColorStop(1, "#9333ea");
      }
      ctx.fillStyle = avatarGrad;
      ctx.fillRect(94, headerY - 36, 72, 72);

      // Inisial avatar
      ctx.fillStyle = "#ffffff";
      ctx.font = 'bold 30px Inter, sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const initial = (authorName || "TH").slice(0, 2).toUpperCase();
      ctx.fillText(initial, 130, headerY);
      ctx.restore();

      // Nama Kreator & Handle
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      if (theme === "paper") {
        ctx.fillStyle = "#1c1917";
        ctx.font = 'bold 32px "Georgia", serif';
        ctx.fillText(authorName, 185, headerY - 4);

        ctx.fillStyle = "#78716c";
        ctx.font = '22px Inter, sans-serif';
        ctx.fillText(authorHandle, 185, headerY + 26);
      } else if (theme === "terminal") {
        ctx.fillStyle = "#38bdf8";
        ctx.font = 'bold 28px "Courier New", monospace';
        ctx.fillText(authorName, 185, headerY - 4);

        ctx.fillStyle = "#34d399";
        ctx.font = '22px "Courier New", monospace';
        ctx.fillText(authorHandle, 185, headerY + 26);
      } else if (theme === "gradient") {
        ctx.fillStyle = "#ffffff";
        ctx.font = 'bold 32px Inter, sans-serif';
        ctx.fillText(authorName, 185, headerY - 4);

        ctx.fillStyle = "#c084fc";
        ctx.font = '22px Inter, sans-serif';
        ctx.fillText(authorHandle, 185, headerY + 26);
      } else {
        // Dark Minimal
        ctx.fillStyle = "#f4f4f5";
        ctx.font = 'bold 32px Inter, sans-serif';
        ctx.fillText(authorName, 185, headerY - 4);

        ctx.fillStyle = "#a1a1aa";
        ctx.font = '22px Inter, sans-serif';
        ctx.fillText(authorHandle, 185, headerY + 26);
      }

      // Kanan Atas: Topic Tag Badge & Slide Number
      const rightX = width - 96;
      ctx.textAlign = "right";

      if (showCategory && slide.category) {
        const catText = slide.category.toUpperCase();
        ctx.font = 'bold 18px Inter, sans-serif';
        const catMetrics = ctx.measureText(catText);
        const pillW = catMetrics.width + 32;
        const pillH = 36;
        const pillX = rightX - pillW;
        const pillY = headerY - 32;

        ctx.fillStyle =
          theme === "paper"
            ? "#e7e2d8"
            : theme === "terminal"
            ? "#0f172a"
            : theme === "gradient"
            ? "#311854"
            : "#27272a";
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 18);
        ctx.fill();

        ctx.fillStyle =
          theme === "paper"
            ? "#9a3412"
            : theme === "terminal"
            ? "#34d399"
            : theme === "gradient"
            ? "#f472b6"
            : "#818cf8";
        ctx.fillText(catText, rightX - 16, headerY - 8);
      }

      if (showSlideNumber) {
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.fillStyle =
          theme === "paper"
            ? "#78716c"
            : theme === "terminal"
            ? "#64748b"
            : theme === "gradient"
            ? "#c084fc"
            : "#71717a";
        ctx.fillText(`${slideIndex + 1} / ${totalCount}`, rightX, headerY + 28);
      }

      // 3. Konten Utama: Headline & Body Text
      let contentStartY = theme === "terminal" ? 310 : 280;
      const contentMaxWidth = width - 192; // margin 96px kiri dan kanan

      // Prompt header untuk tema terminal
      if (theme === "terminal") {
        ctx.textAlign = "left";
        ctx.fillStyle = "#10b981";
        ctx.font = 'bold 26px "Courier New", monospace';
        ctx.fillText("❯ cat insight_card.md", 96, contentStartY);
        contentStartY += 45;
      }

      // Headline
      if (slide.headline) {
        ctx.textAlign = "left";
        if (theme === "paper") {
          ctx.fillStyle = "#c2410c";
          ctx.font = 'bold 44px "Georgia", serif';
        } else if (theme === "terminal") {
          ctx.fillStyle = "#38bdf8";
          ctx.font = 'bold 40px "Courier New", monospace';
        } else if (theme === "gradient") {
          ctx.fillStyle = "#f472b6";
          ctx.font = 'bold 46px Inter, sans-serif';
        } else {
          ctx.fillStyle = "#818cf8";
          ctx.font = 'bold 46px Inter, sans-serif';
        }

        const headWrap = wrapText(ctx, slide.headline, contentMaxWidth, 44, 1.25);
        for (let i = 0; i < headWrap.lines.length; i++) {
          ctx.fillText(headWrap.lines[i], 96, contentStartY);
          contentStartY += 55;
        }
        contentStartY += 20;
      }

      // Body Text: Hitung ukuran font adaptif jika teks sangat panjang
      const textLength = slide.body.length;
      let bodyFontSize = 36;
      let lineHeight = 54;

      if (textLength > 350) {
        bodyFontSize = 28;
        lineHeight = 44;
      } else if (textLength > 220) {
        bodyFontSize = 32;
        lineHeight = 48;
      }

      ctx.textAlign = "left";
      if (theme === "paper") {
        ctx.fillStyle = "#292524";
        ctx.font = `${bodyFontSize}px "Georgia", serif`;
      } else if (theme === "terminal") {
        ctx.fillStyle = "#e2e8f0";
        ctx.font = `${bodyFontSize}px "Courier New", monospace`;
      } else if (theme === "gradient") {
        ctx.fillStyle = "#ffffff";
        ctx.font = `${bodyFontSize}px Inter, sans-serif`;
      } else {
        ctx.fillStyle = "#f4f4f5";
        ctx.font = `${bodyFontSize}px Inter, sans-serif`;
      }

      const bodyWrap = wrapText(ctx, slide.body, contentMaxWidth, bodyFontSize, 1.5);
      for (let i = 0; i < bodyWrap.lines.length; i++) {
        ctx.fillText(bodyWrap.lines[i], 96, contentStartY);
        contentStartY += lineHeight;
      }

      // Terminal Cursor Effect
      if (theme === "terminal") {
        ctx.fillStyle = "#10b981";
        ctx.fillRect(96, contentStartY + 10, 18, 32);
      }

      // 4. Footer Area: Subtext & Swipe Indicator
      const footerY = height - 110;

      // Garis Pembatas Bawah
      ctx.strokeStyle =
        theme === "paper"
          ? "#e7e2d8"
          : theme === "terminal"
          ? "#1e293b"
          : theme === "gradient"
          ? "#381861"
          : "#27272a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(96, footerY - 45);
      ctx.lineTo(width - 96, footerY - 45);
      ctx.stroke();

      // Subtext di Kiri
      ctx.textAlign = "left";
      ctx.font = '22px Inter, sans-serif';
      ctx.fillStyle =
        theme === "paper"
          ? "#78716c"
          : theme === "terminal"
          ? "#64748b"
          : theme === "gradient"
          ? "#a78bfa"
          : "#a1a1aa";
      const footerSubtext = slide.subtext || "AutoThreads Media Generator";
      ctx.fillText(footerSubtext, 96, footerY);

      // Threads Glyph Logo Mock di Kanan
      ctx.textAlign = "right";
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillStyle =
        theme === "paper"
          ? "#1c1917"
          : theme === "terminal"
          ? "#34d399"
          : theme === "gradient"
          ? "#ffffff"
          : "#ffffff";
      ctx.fillText("@ Threads", width - 96, footerY);
    },
    [theme, aspectRatio, authorName, authorHandle, showSlideNumber, showCategory]
  );

  // Redraw canvas saat slide aktif / tema / rasio berubah
  useEffect(() => {
    if (!isOpen || slides.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const currentSlide = slides[currentSlideIdx] || slides[0];
    drawSlideToCanvas(canvas, currentSlide, currentSlideIdx, slides.length);
  }, [isOpen, slides, currentSlideIdx, drawSlideToCanvas]);

  // Handler Download Single PNG
  const handleDownloadSinglePng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `threads_slide_${currentSlideIdx + 1}.png`;
    link.href = dataUrl;
    link.click();

    setToastNotice(`Slide #${currentSlideIdx + 1} berhasil diunduh sebagai PNG.`);
    setTimeout(() => setToastNotice(null), 3000);
  };

  // Handler Download All PNGs
  const handleDownloadAllPng = async () => {
    if (slides.length === 0) return;

    const tempCanvas = document.createElement("canvas");
    for (let i = 0; i < slides.length; i++) {
      drawSlideToCanvas(tempCanvas, slides[i], i, slides.length);
      const dataUrl = tempCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `threads_slide_${i + 1}_of_${slides.length}.png`;
      link.href = dataUrl;
      link.click();
      // Tunggu jeda sedikit agar browser tidak memblokir multiple downloads
      await new Promise((r) => setTimeout(r, 200));
    }

    setToastNotice(`Semua ${slides.length} slide berhasil diunduh!`);
    setTimeout(() => setToastNotice(null), 3000);
  };

  // Handler "Gunakan untuk Utas Ini"
  const handleApplyToVariant = async () => {
    if (slides.length === 0) return;
    setIsApplying(true);

    try {
      // Render semua slide ke base64
      const tempCanvas = document.createElement("canvas");
      const generatedBase64s: string[] = [];

      for (let i = 0; i < slides.length; i++) {
        drawSlideToCanvas(tempCanvas, slides[i], i, slides.length);
        const dataUrl = tempCanvas.toDataURL("image/png");
        generatedBase64s.push(dataUrl);
      }

      if (onApplyToVariant) {
        onApplyToVariant(generatedBase64s, { theme, aspectRatio });
      }

      setToastNotice(`✨ ${slides.length} Slide Visual berhasil disematkan ke Utas ini!`);
      setTimeout(() => {
        setToastNotice(null);
        setIsApplying(false);
        onClose();
      }, 1500);
    } catch (e: any) {
      console.error(e);
      setToastNotice("Gagal merender slide visual.");
      setIsApplying(false);
    }
  };

  const handleAddSlide = () => {
    if (slides.length >= 10) {
      setToastNotice("Maksimal 10 slide untuk carousel Meta Threads.");
      setTimeout(() => setToastNotice(null), 3000);
      return;
    }
    const newIdx = slides.length + 1;
    const newSlide: SlideItem = {
      id: `slide-custom-${Date.now()}`,
      headline: `Poin Penting #${newIdx}`,
      body: "Tuliskan wawasan atau argumen pendukung tambahan di sini untuk audiens Threads lo.",
      subtext: `Slide ${newIdx} dari ${newIdx}`,
      category: slides[0]?.category || "Threads",
    };
    setSlides([...slides, newSlide]);
    setCurrentSlideIdx(slides.length);
  };

  const handleRemoveSlide = (idx: number) => {
    if (slides.length <= 1) {
      setToastNotice("Minimal harus ada 1 slide visual.");
      setTimeout(() => setToastNotice(null), 3000);
      return;
    }
    const updated = slides.filter((_, i) => i !== idx);
    setSlides(updated);
    if (currentSlideIdx >= updated.length) {
      setCurrentSlideIdx(updated.length - 1);
    }
  };

  const updateCurrentSlide = (field: keyof SlideItem, val: string) => {
    setSlides((prev) => {
      const copy = [...prev];
      if (copy[currentSlideIdx]) {
        copy[currentSlideIdx] = { ...copy[currentSlideIdx], [field]: val };
      }
      return copy;
    });
  };

  if (!isOpen) return null;

  const currentSlide = slides[currentSlideIdx] || slides[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Media Visual & Carousel Generator</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Resmi Meta Threads
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Buat slide visual estetis 1080px & terbitkan ke Threads sebagai IMAGE / CAROUSEL_ALBUM
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 overflow-y-auto">
          {/* Left / Center: Preview Canvas */}
          <div className="lg:col-span-7 flex flex-col items-center justify-between space-y-4">
            {/* Canvas Preview Container */}
            <div className="w-full flex-1 flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 min-h-[360px] sm:min-h-[460px]">
              <div
                className={`relative shadow-2xl rounded-xl overflow-hidden border border-neutral-800 transition-all ${
                  aspectRatio === "1:1" ? "aspect-square max-w-[400px]" : "aspect-[4/5] max-w-[340px]"
                } w-full flex items-center justify-center bg-black`}
              >
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain block"
                  style={{ imageRendering: "auto" }}
                />
              </div>

              {/* Slide Navigation Buttons */}
              <div className="flex items-center justify-between w-full max-w-sm mt-3 px-2">
                <button
                  type="button"
                  onClick={() => setCurrentSlideIdx((prev) => Math.max(0, prev - 1))}
                  disabled={currentSlideIdx === 0}
                  className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="text-xs font-bold text-neutral-300">
                  Slide {currentSlideIdx + 1} dari {slides.length}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentSlideIdx((prev) => Math.min(slides.length - 1, prev + 1))}
                  disabled={currentSlideIdx === slides.length - 1}
                  className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="w-full flex items-center gap-2 overflow-x-auto pb-1 px-1">
              {slides.map((s, idx) => {
                const isActive = idx === currentSlideIdx;
                return (
                  <button
                    key={s.id || idx}
                    type="button"
                    onClick={() => setCurrentSlideIdx(idx)}
                    className={`shrink-0 w-16 h-16 rounded-xl border flex flex-col items-center justify-center p-1 text-center transition cursor-pointer ${
                      isActive
                        ? "border-indigo-500 bg-indigo-950/40 text-white ring-2 ring-indigo-500/30"
                        : "border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    <span className="text-[10px] font-bold">#{idx + 1}</span>
                    <span className="text-[9px] line-clamp-1 truncate max-w-full text-neutral-400">
                      {s.headline.slice(0, 10)}
                    </span>
                  </button>
                );
              })}

              {slides.length < 10 && (
                <button
                  type="button"
                  onClick={handleAddSlide}
                  className="shrink-0 w-16 h-16 rounded-xl border border-dashed border-neutral-700 hover:border-indigo-500 bg-neutral-900/40 text-neutral-400 hover:text-white flex flex-col items-center justify-center transition cursor-pointer"
                  title="Tambah slide baru"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-[9px] font-bold mt-0.5">Tambah</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Customizer Controls */}
          <div className="lg:col-span-5 flex flex-col space-y-5 overflow-y-auto pr-1">
            {/* Theme Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-400" />
                <span>Pilih Tema Visual Threads:</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {THEME_OPTIONS.map((t) => {
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer relative ${
                        isSelected
                          ? "border-indigo-500 ring-2 ring-indigo-500/30 bg-neutral-800"
                          : "border-neutral-800 hover:border-neutral-700 bg-neutral-950/60"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{t.name}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                          {t.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-tight">{t.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aspect Ratio & Display Settings */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800 text-xs">
              <div>
                <label className="text-[11px] font-bold text-neutral-400 block mb-1.5">
                  Rasio Slide (Format Threads):
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAspectRatio("1:1")}
                    className={`flex-1 py-1.5 rounded-xl font-bold text-[11px] border transition cursor-pointer ${
                      aspectRatio === "1:1"
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    1:1 Persegi
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio("4:5")}
                    className={`flex-1 py-1.5 rounded-xl font-bold text-[11px] border transition cursor-pointer ${
                      aspectRatio === "4:5"
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    4:5 Vertikal
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-400 block mb-1.5">
                  Elemen Tampilan:
                </label>
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-neutral-300">
                    <input
                      type="checkbox"
                      checked={showSlideNumber}
                      onChange={(e) => setShowSlideNumber(e.target.checked)}
                      className="rounded border-neutral-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Nomor Slide (1/X)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-neutral-300">
                    <input
                      type="checkbox"
                      checked={showCategory}
                      onChange={(e) => setShowCategory(e.target.checked)}
                      className="rounded border-neutral-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Topic Tag Badge</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Author Profile Information */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                  Nama Kreator:
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                  placeholder="Nama Akun"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                  Handle Threads:
                </label>
                <input
                  type="text"
                  value={authorHandle}
                  onChange={(e) => setAuthorHandle(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                  placeholder="@username"
                />
              </div>
            </div>

            {/* Current Slide Editor */}
            {currentSlide && (
              <div className="p-3.5 rounded-2xl bg-neutral-950/90 border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span>Edit Konten Slide #{currentSlideIdx + 1}:</span>
                  </span>
                  {slides.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSlide(currentSlideIdx)}
                      className="text-rose-400 hover:text-rose-300 text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus Slide</span>
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                    Judul / Headline:
                  </label>
                  <input
                    type="text"
                    value={currentSlide.headline}
                    onChange={(e) => updateCurrentSlide("headline", e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                    placeholder="Judul Slide"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                    Isi Teks Slide:
                  </label>
                  <textarea
                    rows={4}
                    value={currentSlide.body}
                    onChange={(e) => updateCurrentSlide("body", e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-hidden focus:border-indigo-500 leading-relaxed"
                    placeholder="Isi teks paragraf atau poin slide..."
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                    Catatan Bawah (Subtext / CTA):
                  </label>
                  <input
                    type="text"
                    value={currentSlide.subtext || ""}
                    onChange={(e) => updateCurrentSlide("subtext", e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                    placeholder="Geser ke slide selanjutnya 👉"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleApplyToVariant}
                disabled={isApplying}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isApplying ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Menerapkan Slide Visual...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Gunakan untuk Utas Ini ({slides.length} Slide Carousel)</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSinglePng}
                  className="py-2 px-3 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-300" />
                  <span>Download Slide Ini</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadAllPng}
                  className="py-2 px-3 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Download Semua ({slides.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Toast Notice */}
        {toastNotice && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xl border border-emerald-400/40 flex items-center gap-2 animate-bounce">
            <Check className="w-4 h-4" />
            <span>{toastNotice}</span>
          </div>
        )}
      </div>
    </div>
  );
};
