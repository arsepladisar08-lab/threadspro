import React, { useState } from "react";
import { CheckSquare, AlertTriangle, CheckCircle2, Wand2, ArrowRight, ShieldAlert, Sparkles, Copy, Check } from "lucide-react";
import { auditVariant, autoFixVariant } from "../lib/guard";
import { VariantOutput, QualityIssue } from "../types";
import { generateJSON } from "../services/ai";

export const CheckerPage: React.FC = () => {
  const [post1Text, setPost1Text] = useState("");
  const [post2Text, setPost2Text] = useState("");
  const [topicTag, setTopicTag] = useState("");
  const [reply2Text, setReply2Text] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<{
    score: number;
    issues: QualityIssue[];
    passed: boolean;
  } | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const buildVariantObj = (): VariantOutput => {
    const posts = [
      { order: 1, text: post1Text, char_count: post1Text.length },
      ...(post2Text.trim() ? [{ order: 2, text: post2Text, char_count: post2Text.length }] : []),
    ];

    return {
      template: "custom_check",
      goal: "Jangkauan",
      fusion_trace: {
        card_id: "CUSTOM",
        hook_id: "H1",
        pola_dipinjam: "Pemeriksaan Mandiri",
        perubahan_dari_ide_kasar: "Audit Teks Pengguna",
      },
      hooks: [post1Text.slice(0, 80)],
      posts,
      reply_2: {
        text: reply2Text,
        contains_link: reply2Text.includes("http"),
      },
      topic_tag: topicTag,
      closing_question: post1Text.includes("?") ? "Ada tanda tanya" : "",
      best_time_wib: "19.30 - 22.30 WIB",
      first_30_min_plan: ["Balas komentar yang masuk dalam 30 menit pertama"],
      algorithm_signal: "Pemeriksaan Kualitas",
      signal_confidence: "R",
      placeholders_to_fill: [],
    };
  };

  const handleRunCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post1Text.trim()) return;

    setIsAuditing(true);
    setAiSuggestions(null);

    const variantObj = buildVariantObj();
    // 1. Audit Cepat dengan Guard Kode Murni
    const codeResult = auditVariant(variantObj);
    setAuditResult(codeResult);

    // 2. Jika skor < 85, minta critic AI untuk rekomendasi perbaikan
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

    setPost1Text(fixed.posts[0]?.text || "");
    if (fixed.posts[1]) setPost2Text(fixed.posts[1].text);
    setTopicTag(fixed.topic_tag);
    setReply2Text(fixed.reply_2.text);

    // Re-audit
    const reAudit = auditVariant(fixed);
    setAuditResult(reAudit);
  };

  const handleCopyClean = () => {
    const combined = `${post1Text}\n\n---\n\n${post2Text}\n\n[Topic Tag: ${topicTag}]`;
    navigator.clipboard.writeText(combined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-5 md:px-6 py-6 sm:py-8 pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <CheckSquare className="w-5 h-5" />
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white">Cek Kualitas & Kepatuhan Algoritma</h1>
        </div>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1">
          Tempel draf utas Anda untuk memindai risiko engagement bait, batas karakter, tautan di post utama, dan aturan topic tag.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <form onSubmit={handleRunCheck} className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
            {/* Post 1 */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 mb-1">
                <span>Post #1 (Utama / Hook Pembuka):</span>
                <span className={post1Text.length > 500 ? "text-rose-400 font-bold" : "text-neutral-400"}>
                  {post1Text.length}/500 karakter
                </span>
              </div>
              <textarea
                rows={4}
                required
                value={post1Text}
                onChange={(e) => setPost1Text(e.target.value)}
                placeholder="Tulis kalimat pembuka utas Anda di sini... (tanpa link dan tanpa hashtag #)"
                className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-indigo-500 leading-relaxed"
              />
            </div>

            {/* Post 2 */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 mb-1">
                <span>Post #2 (Lanjutan):</span>
                <span className={post2Text.length > 500 ? "text-rose-400 font-bold" : "text-neutral-400"}>
                  {post2Text.length}/500 karakter
                </span>
              </div>
              <textarea
                rows={3}
                value={post2Text}
                onChange={(e) => setPost2Text(e.target.value)}
                placeholder="Poin penjelasan atau penutup diskusi..."
                className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-600 focus:outline-hidden focus:border-indigo-500 leading-relaxed"
              />
            </div>

            {/* Topic Tag */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Topic Tag (Gunakan TEPAT 1 tag, TANPA tanda pagar #):
              </label>
              <input
                type="text"
                value={topicTag}
                onChange={(e) => setTopicTag(e.target.value)}
                placeholder="Contoh: Keuangan Pribadi (Bukan #Keuangan)"
                className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-600 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Reply ke-2 (Opsional jika ada link) */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Reply ke-2 (Tempat Link / Referensi Tambahan):
              </label>
              <input
                type="text"
                value={reply2Text}
                onChange={(e) => setReply2Text(e.target.value)}
                placeholder="Contoh: Link pendaftaran webinar ada di sini: bit.ly/contoh"
                className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-600 focus:outline-hidden focus:border-indigo-500"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">
                Menaruh link di reply kedua melindungi post utama dari penurunan jangkauan.
              </span>
            </div>

            <button
              type="submit"
              disabled={isAuditing || !post1Text.trim()}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isAuditing ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Memeriksa Utas...</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4" />
                  <span>Jalankan Cek Algoritma</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Audit Results (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {auditResult ? (
            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 shadow-sm">
              {/* Score Display */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div>
                  <span className="text-xs text-neutral-400 block font-medium">Skor Keamanan Algoritma</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      className={`text-3xl font-black ${
                        auditResult.score >= 80
                          ? "text-emerald-400"
                          : auditResult.score >= 70
                          ? "text-amber-400"
                          : "text-rose-400"
                      }`}
                    >
                      {auditResult.score}
                    </span>
                    <span className="text-xs text-neutral-500 font-bold">/100</span>
                  </div>
                </div>

                <div
                  className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                    auditResult.passed
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  }`}
                >
                  {auditResult.passed ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                  <span>{auditResult.passed ? "Siap Posting" : "Perlu Koreksi"}</span>
                </div>
              </div>

              {/* Auto Fix Button if issues exist */}
              {auditResult.issues.length > 0 && (
                <button
                  type="button"
                  onClick={handleAutoFix}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Perbaiki Otomatis Semua Masalah</span>
                </button>
              )}

              {/* Issues List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Hasil Diagnosa ({auditResult.issues.length} catatan):
                </h4>

                {auditResult.issues.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Utas Anda bersih dari pelanggaran fatal dan mematuhi kaidah algoritma Threads.</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {auditResult.issues.map((iss, iIdx) => (
                      <div
                        key={iIdx}
                        className={`p-3 rounded-xl border text-xs space-y-1 ${
                          iss.severity === "critical"
                            ? "bg-rose-950/20 border-rose-500/30 text-rose-300"
                            : iss.severity === "warning"
                            ? "bg-amber-950/20 border-amber-500/30 text-amber-300"
                            : "bg-blue-950/20 border-blue-500/30 text-blue-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{iss.description}</span>
                        </div>
                        <p className="text-[11px] opacity-90 pl-5">
                          <strong>Solusi:</strong> {iss.fix}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCopyClean}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Tersalin!" : "Salin Draf Bersih"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] rounded-2xl border-2 border-dashed border-neutral-800 flex flex-col items-center justify-center p-6 text-center text-neutral-400 space-y-2">
              <CheckSquare className="w-8 h-8 text-neutral-600" />
              <p className="text-xs">Isi form di samping untuk memeriksa kepatuhan algoritma.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
