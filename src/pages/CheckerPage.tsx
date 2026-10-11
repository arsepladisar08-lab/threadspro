import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  CheckSquare,
  AlertTriangle,
  CheckCircle2,
  Wand2,
  ShieldAlert,
  Sparkles,
  Copy,
  Check,
  Plus,
  Trash2,
  Send,
  Calendar,
  Layers,
} from "lucide-react";
import { auditVariant, autoFixVariant } from "../lib/guard";
import { VariantOutput, QualityIssue, CalendarDayItem, GoalType } from "../types";
import { generateJSON } from "../services/ai";
import { storage } from "../lib/storage";
import { PublishModal } from "../components/PublishModal";

export interface PostDraftItem {
  order: number;
  text: string;
}

export const CheckerPage: React.FC = () => {
  const location = useLocation();

  // State multi-post yang fleksibel & mendukung utas 4 tahap penuh tanpa ada yang terpotong
  const [posts, setPosts] = useState<PostDraftItem[]>([
    { order: 1, text: "" },
    { order: 2, text: "" },
    { order: 3, text: "" },
  ]);
  const [topicTag, setTopicTag] = useState("");
  const [reply2Text, setReply2Text] = useState("");
  const [originalVariant, setOriginalVariant] = useState<VariantOutput | null>(null);

  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<{
    score: number;
    issues: QualityIssue[];
    passed: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [publishModalVariant, setPublishModalVariant] = useState<VariantOutput | null>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3000);
  };

  useEffect(() => {
    if (location.state) {
      const s = location.state as any;
      if (s.variant) {
        const v = s.variant as VariantOutput;
        setOriginalVariant(v);

        // Pertahankan seluruh postingan dari varian asli tanpa ada yang hilang
        if (Array.isArray(v.posts) && v.posts.length > 0) {
          setPosts(
            v.posts.map((p, idx) => ({
              order: idx + 1,
              text: p.text || "",
            }))
          );
        }

        if (v.reply_2?.text) {
          setReply2Text(v.reply_2.text);
        }
        if (v.topic_tag) {
          setTopicTag(v.topic_tag);
        }
      } else {
        // Fallback untuk state parsial lama
        const incomingPosts: PostDraftItem[] = [];
        if (typeof s.post1Text === "string") incomingPosts.push({ order: 1, text: s.post1Text });
        if (typeof s.post2Text === "string" && s.post2Text.trim()) incomingPosts.push({ order: 2, text: s.post2Text });
        if (typeof s.post3Text === "string" && s.post3Text.trim()) incomingPosts.push({ order: 3, text: s.post3Text });
        if (typeof s.post4Text === "string" && s.post4Text.trim()) incomingPosts.push({ order: 4, text: s.post4Text });

        if (incomingPosts.length === 0) {
          incomingPosts.push({ order: 1, text: "" });
          incomingPosts.push({ order: 2, text: "" });
        }
        setPosts(incomingPosts);
        if (typeof s.topicTag === "string") setTopicTag(s.topicTag);
        if (typeof s.reply2Text === "string") setReply2Text(s.reply2Text);
      }
    }
  }, [location.state]);

  const handlePostChange = (idx: number, newText: string) => {
    setPosts((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], text: newText };
      return updated;
    });
  };

  const handleAddPost = () => {
    if (posts.length >= 8) return;
    setPosts((prev) => [
      ...prev,
      { order: prev.length + 1, text: "" },
    ]);
  };

  const handleRemovePost = (idxToRemove: number) => {
    if (posts.length <= 1) return;
    setPosts((prev) =>
      prev
        .filter((_, idx) => idx !== idxToRemove)
        .map((p, newIdx) => ({ ...p, order: newIdx + 1 }))
    );
  };

  const buildVariantObj = (): VariantOutput => {
    const builtPosts = posts.map((p, idx) => ({
      order: idx + 1,
      text: p.text,
      char_count: p.text.length,
      media: originalVariant?.posts?.[idx]?.media,
      mediaAttachments: originalVariant?.posts?.[idx]?.mediaAttachments,
    }));

    return {
      ...(originalVariant || {}),
      template: originalVariant?.template || "custom_check",
      goal: originalVariant?.goal || "Jangkauan",
      fusion_trace: originalVariant?.fusion_trace || {
        card_id: "CUSTOM",
        hook_id: "H1",
        pola_dipinjam: "Pemeriksaan Mandiri",
        perubahan_dari_ide_kasar: "Audit Teks Pengguna",
      },
      hooks: originalVariant?.hooks || [posts[0]?.text.slice(0, 80) || ""],
      posts: builtPosts,
      reply_2: {
        text: reply2Text,
        contains_link: reply2Text.includes("http") || (originalVariant?.reply_2?.contains_link ?? false),
        media: originalVariant?.reply_2?.media,
        mediaAttachments: originalVariant?.reply_2?.mediaAttachments,
      },
      topic_tag: topicTag,
      closing_question: originalVariant?.closing_question || (posts[0]?.text.includes("?") ? "Ada tanda tanya" : ""),
      best_time_wib: originalVariant?.best_time_wib || "19.30 - 22.30 WIB",
      first_30_min_plan: originalVariant?.first_30_min_plan || ["Balas komentar yang masuk dalam 30 menit pertama"],
      algorithm_signal: originalVariant?.algorithm_signal || "Pemeriksaan Kualitas",
      signal_confidence: originalVariant?.signal_confidence || "R",
      placeholders_to_fill: originalVariant?.placeholders_to_fill || [],
    };
  };

  const handleRunCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posts[0]?.text.trim()) return;

    setIsAuditing(true);

    const variantObj = buildVariantObj();
    const codeResult = auditVariant(variantObj);
    setAuditResult(codeResult);

    if (codeResult.score < 85) {
      try {
        const criticOutput = await generateJSON("critic", {
          posts: variantObj.posts,
          topic_tag: variantObj.topic_tag,
          issuesFound: codeResult.issues,
        });
        if (criticOutput && criticOutput.issues) {
          setAuditResult({
            score: Math.min(codeResult.score, criticOutput.score || codeResult.score),
            issues: [...codeResult.issues, ...(criticOutput.issues || [])],
            passed: codeResult.score >= 70,
          });
        }
      } catch (e) {
        console.warn("AI Critic fallback to code result:", e);
      }
    }

    setIsAuditing(false);
  };

  const handleAutoFix = () => {
    const current = buildVariantObj();
    const fixed = autoFixVariant(current);

    // Perbarui seluruh postingan tanpa ada yang terpotong
    setPosts(
      fixed.posts.map((p, idx) => ({
        order: idx + 1,
        text: p.text || "",
      }))
    );
    setTopicTag(fixed.topic_tag);
    if (fixed.reply_2?.text) {
      setReply2Text(fixed.reply_2.text);
    }

    const reAudit = auditVariant(fixed);
    setAuditResult(reAudit);
    showToast("Draf berhasil disesuaikan otomatis!");
  };

  const handleCopyClean = () => {
    const variantObj = buildVariantObj();
    const blocks = variantObj.posts.map((p, idx) => {
      const label = idx === 0 ? "Post Utama (#1)" : `Reply ke-${idx + 1}`;
      return `[${label}]\n${p.text}`;
    });
    const reply4Label = `Reply ke-${variantObj.posts.length + 1} / CTA`;
    if (variantObj.reply_2?.text) {
      blocks.push(`[${reply4Label}]\n${variantObj.reply_2.text}`);
    }
    if (topicTag) {
      blocks.push(`[Topic Tag: ${topicTag}]`);
    }

    navigator.clipboard.writeText(blocks.join("\n\n---\n\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast("Seluruh draf utas berhasil disalin!");
  };

  const handleSaveToCalendarFromChecker = async () => {
    const variantObj = buildVariantObj();
    const currentCalendar = (await storage.getCalendar()) || [];
    const newDayNumber = currentCalendar.length + 1;

    const newCalendarItem: CalendarDayItem = {
      id: `checked_${Date.now()}`,
      dayNumber: newDayNumber,
      dayName: `Hari ${newDayNumber}`,
      dateStr: new Date().toISOString().split("T")[0],
      goal: (variantObj.goal as GoalType) || "Jangkauan",
      pillar: variantObj.fusion_trace?.pola_dipinjam || "Utas Terverifikasi",
      ideaPrompt: variantObj.posts[0]?.text || "Utas dari Cek Utas",
      cardId: variantObj.fusion_trace?.card_id || "K01",
      hookPattern: variantObj.hooks[0] || "Pola Teruji",
      format: variantObj.template || "Utas Teruji",
      topicTag: variantObj.topic_tag || topicTag || "Umum",
      timeWIB: variantObj.best_time_wib || "19.30 - 22.30 WIB",
      replyActionGoal: "Pantau komentar dan interaksi awal warga Threads",
      status: "drafted",
      variant: JSON.parse(JSON.stringify(variantObj)),
    };

    const updated = [...currentCalendar, newCalendarItem];
    await storage.saveCalendar(updated);
    showToast("Utas lengkap (Post 1 s/d Reply ke-4) tersimpan ke Kalender!");
  };

  const totalThreadItems = posts.length + (reply2Text.trim() ? 1 : 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-28 space-y-6">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-semibold shadow-lg border border-zinc-700 dark:border-zinc-300 animate-in fade-in">
          {toastNotice}
        </div>
      )}

      {/* Calm Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-900 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-500" />
            <span>Cek Kualitas & Kepatuhan Algoritma</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Pindai draf utas dari risiko engagement bait, batas karakter, peletakan link, dan kepatuhan topic tag Threads.
          </p>
        </div>

        {originalVariant && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs self-start sm:self-auto font-medium">
            <Layers className="w-3.5 h-3.5" />
            <span>Draf Lengkap Terhubung: {totalThreadItems} Postingan</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Form (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {location.state?.fromLinkLab && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                <strong>Draf dari Link Lab Berhasil Dimuat:</strong> Seluruh bagian ({totalThreadItems} postingan: Post Utama hingga Reply ke-4) tersaji utuh tanpa ada teks yang hilang atau diubah.
              </span>
            </div>
          )}

          <form onSubmit={handleRunCheck} className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/20 space-y-5 shadow-xs">
            {/* Multi-Post Rendering: Post Utama (#1) sampai Reply ke-(N) */}
            <div className="space-y-4">
              {posts.map((post, pIdx) => {
                const isRoot = pIdx === 0;
                const charCount = post.text.length;
                const isExceeded = charCount > 500;

                return (
                  <div key={pIdx} className="space-y-1.5 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <label className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {isRoot ? "Post Utama (#1) - Hook Pembuka" : `Reply ke-${pIdx + 1}`}
                        </label>
                        {isRoot && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            Hook
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-[11px] ${isExceeded ? "text-rose-500 font-bold" : "text-zinc-500 dark:text-zinc-400"}`}>
                          {charCount} / 500
                        </span>

                        {!isRoot && (
                          <button
                            type="button"
                            onClick={() => handleRemovePost(pIdx)}
                            className="text-zinc-400 hover:text-rose-500 transition cursor-pointer p-0.5"
                            title="Hapus post ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <textarea
                      rows={isRoot ? 4 : 3}
                      required={isRoot}
                      value={post.text}
                      onChange={(e) => handlePostChange(pIdx, e.target.value)}
                      placeholder={
                        isRoot
                          ? "Tulis kalimat pembuka utas di sini (tanpa link dan tanpa hashtag #)..."
                          : `Penjelasan lanjutan atau argumen babak di Reply ke-${pIdx + 1}...`
                      }
                      className="w-full p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-hidden focus:border-indigo-500 leading-relaxed transition"
                    />
                  </div>
                );
              })}
            </div>

            {/* Tombol Tambah Reply Post */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddPost}
                className="px-3 py-1.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Balasan Bertingkat</span>
              </button>
            </div>

            {/* Reply ke-4 (Balasan Penutup / CTA / Diskusi) */}
            <div className="space-y-1.5 p-3.5 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <Send className="w-3 h-3 text-indigo-500" />
                  <span>Reply #{posts.length + 1} (Balasan Penutup / CTA / Kredit Video)</span>
                </label>
                <span className={`font-mono text-[11px] ${reply2Text.length > 500 ? "text-rose-500 font-bold" : "text-zinc-500 dark:text-zinc-400"}`}>
                  {reply2Text.length} / 500
                </span>
              </div>
              <textarea
                rows={3}
                value={reply2Text}
                onChange={(e) => setReply2Text(e.target.value)}
                placeholder="Tautan referensi, kredit kreator, atau pemantik diskusi santai warga..."
                className="w-full p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-hidden focus:border-indigo-500 leading-relaxed transition"
              />
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block pt-0.5">
                Menaruh link di balasan penutup (Reply #4) menjaga post utama dari penalti algoritma Threads.
              </span>
            </div>

            {/* Topic Tag */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Topic Tag (Gunakan 1 topik, TANPA simbol #):
              </label>
              <input
                type="text"
                value={topicTag}
                onChange={(e) => setTopicTag(e.target.value)}
                placeholder="Contoh: Belajar Coding (Bukan #Coding)"
                className="w-full p-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-hidden focus:border-indigo-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isAuditing || !posts[0]?.text.trim()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {isAuditing ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Memeriksa Seluruh Postingan ({totalThreadItems} Bagian)...</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Jalankan Cek Algoritma Lengkap</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Audit Results (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {auditResult ? (
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/60 space-y-4 shadow-xs">
              {/* Score Display */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-900">
                <div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Skor Keamanan Algoritma</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      className={`text-2xl font-bold tracking-tight ${
                        auditResult.score >= 80
                          ? "text-emerald-500 dark:text-emerald-400"
                          : auditResult.score >= 70
                          ? "text-amber-500 dark:text-amber-400"
                          : "text-rose-500 dark:text-rose-400"
                      }`}
                    >
                      {auditResult.score}
                    </span>
                    <span className="text-xs text-zinc-400">/100</span>
                  </div>
                </div>

                <div
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                    auditResult.passed
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60"
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60"
                  }`}
                >
                  {auditResult.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                  <span>{auditResult.passed ? "Sesuai Kaidah" : "Perlu Penyesuaian"}</span>
                </div>
              </div>

              {/* Auto Fix Button if issues exist */}
              {auditResult.issues.length > 0 && (
                <button
                  type="button"
                  onClick={handleAutoFix}
                  className="w-full py-2 px-3 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Koreksi Otomatis Seluruh Postingan</span>
                </button>
              )}

              {/* Issues List */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Hasil Diagnosa ({auditResult.issues.length} poin):
                </h4>

                {auditResult.issues.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>Draf bersih dari engagement-bait dan mematuhi aturan algoritma.</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {auditResult.issues.map((iss, iIdx) => (
                      <div
                        key={iIdx}
                        className={`p-3 rounded-xl border text-xs space-y-1 ${
                          iss.severity === "critical"
                            ? "bg-rose-50/50 dark:bg-zinc-900 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300"
                            : iss.severity === "warning"
                            ? "bg-amber-50/50 dark:bg-zinc-900 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300"
                            : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{iss.description}</span>
                        </div>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 pl-5 leading-relaxed">
                          <strong className="text-zinc-700 dark:text-zinc-300">Solusi:</strong> {iss.fix}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons: Posting ke Threads, Simpan ke Kalender, Salin */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 space-y-2">
                <button
                  type="button"
                  onClick={() => setPublishModalVariant(buildVariantObj())}
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Posting ke Threads Langsung</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveToCalendarFromChecker}
                    className="flex-1 py-1.5 px-3 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Simpan ke Kalender</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyClean}
                    className="flex-1 py-1.5 px-3 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Tersalin!" : "Salin Semua"}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="min-h-[280px] rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/10 flex flex-col items-center justify-center p-6 text-center text-zinc-500 space-y-2 shadow-xs">
              <CheckSquare className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Periksa susunan draf di sebelah kiri lalu klik tombol untuk menguji kepatuhan algoritma Meta Threads.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* PublishModal jika dipanggil langsung dari Cek Utas */}
      {publishModalVariant && (
        <PublishModal
          variant={publishModalVariant}
          isOpen={!!publishModalVariant}
          onClose={() => setPublishModalVariant(null)}
          onSuccess={() => {
            setPublishModalVariant(null);
            showToast("Utas berhasil dipublikasikan ke Threads!");
          }}
        />
      )}
    </div>
  );
};
