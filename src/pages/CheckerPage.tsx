import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { CheckSquare, AlertTriangle, CheckCircle2, Wand2, ShieldAlert, Sparkles, Copy, Check } from "lucide-react";
import { auditVariant, autoFixVariant } from "../lib/guard";
import { VariantOutput, QualityIssue } from "../types";
import { generateJSON } from "../services/ai";

export const CheckerPage: React.FC = () => {
  const location = useLocation();
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (location.state) {
      const s = location.state as any;
      if (typeof s.post1Text === "string") setPost1Text(s.post1Text);
      if (typeof s.post2Text === "string") setPost2Text(s.post2Text);
      if (typeof s.topicTag === "string") setTopicTag(s.topicTag);
      if (typeof s.reply2Text === "string") setReply2Text(s.reply2Text);
    }
  }, [location.state]);

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

    setPost1Text(fixed.posts[0]?.text || "");
    if (fixed.posts[1]) setPost2Text(fixed.posts[1].text);
    setTopicTag(fixed.topic_tag);
    setReply2Text(fixed.reply_2.text);

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-28 space-y-6">
      {/* Calm Header */}
      <div className="border-b border-zinc-900 pb-5">
        <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
          Cek Kualitas & Kepatuhan Algoritma
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Pindai draf utas dari risiko engagement bait, batas karakter, peletakan link, dan kepatuhan topic tag Threads.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Form (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <form onSubmit={handleRunCheck} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-900/20 space-y-4">
            {/* Post 1 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-zinc-300">
                  Post #1 (Hook Pembuka Utama)
                </label>
                <span className={`font-mono text-[11px] ${post1Text.length > 500 ? "text-rose-400 font-semibold" : "text-zinc-500"}`}>
                  {post1Text.length}/500
                </span>
              </div>
              <textarea
                rows={4}
                required
                value={post1Text}
                onChange={(e) => setPost1Text(e.target.value)}
                placeholder="Tulis kalimat pembuka utas di sini (tanpa link dan tanpa hashtag #)..."
                className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-zinc-600 leading-relaxed transition"
              />
            </div>

            {/* Post 2 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-zinc-300">
                  Post #2 (Lanjutan Diskusi)
                </label>
                <span className={`font-mono text-[11px] ${post2Text.length > 500 ? "text-rose-400 font-semibold" : "text-zinc-500"}`}>
                  {post2Text.length}/500
                </span>
              </div>
              <textarea
                rows={3}
                value={post2Text}
                onChange={(e) => setPost2Text(e.target.value)}
                placeholder="Penjelasan lanjutan atau penutup diskusi..."
                className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-zinc-600 leading-relaxed transition"
              />
            </div>

            {/* Topic Tag */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Topic Tag (Gunakan 1 topik, TANPA simbol #):
              </label>
              <input
                type="text"
                value={topicTag}
                onChange={(e) => setTopicTag(e.target.value)}
                placeholder="Contoh: Keuangan Pribadi (Bukan #Keuangan)"
                className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-zinc-600 transition"
              />
            </div>

            {/* Reply ke-2 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Reply #2 (Tautan / Referensi):
              </label>
              <input
                type="text"
                value={reply2Text}
                onChange={(e) => setReply2Text(e.target.value)}
                placeholder="Contoh: Tautan pendaftaran ada di sini: bit.ly/..."
                className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-zinc-600 transition"
              />
              <span className="text-[11px] text-zinc-500 block">
                Menaruh link di reply #2 menjaga post utama dari penalti algoritma Threads.
              </span>
            </div>

            <button
              type="submit"
              disabled={isAuditing || !post1Text.trim()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-950 transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {isAuditing ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Memeriksa Kepatuhan...</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Jalankan Cek Algoritma</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Audit Results (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {auditResult ? (
            <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/60 space-y-4">
              {/* Score Display */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
                <div>
                  <span className="text-xs text-zinc-400 block">Skor Keamanan Algoritma</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      className={`text-2xl font-semibold tracking-tight ${
                        auditResult.score >= 80
                          ? "text-emerald-400"
                          : auditResult.score >= 70
                          ? "text-amber-400"
                          : "text-rose-400"
                      }`}
                    >
                      {auditResult.score}
                    </span>
                    <span className="text-xs text-zinc-500">/100</span>
                  </div>
                </div>

                <div
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                    auditResult.passed
                      ? "bg-emerald-950/40 text-emerald-300 border-emerald-900/60"
                      : "bg-rose-950/40 text-rose-300 border-rose-900/60"
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
                  className="w-full py-2 px-3 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Koreksi Otomatis Otomatisasi</span>
                </button>
              )}

              {/* Issues List */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                  Hasil Diagnosa ({auditResult.issues.length} poin):
                </h4>

                {auditResult.issues.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Draf bersih dari engagement-bait dan mematuhi aturan algoritma.</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {auditResult.issues.map((iss, iIdx) => (
                      <div
                        key={iIdx}
                        className={`p-3 rounded-xl border text-xs space-y-1 ${
                          iss.severity === "critical"
                            ? "bg-zinc-900 border-rose-500/30 text-rose-300"
                            : iss.severity === "warning"
                            ? "bg-zinc-900 border-amber-500/30 text-amber-300"
                            : "bg-zinc-900 border-zinc-800 text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{iss.description}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 pl-5 leading-relaxed">
                          <strong className="text-zinc-300">Solusi:</strong> {iss.fix}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-zinc-900 flex justify-end">
                <button
                  type="button"
                  onClick={handleCopyClean}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-950 transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Tersalin" : "Salin Draf"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="min-h-[280px] rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col items-center justify-center p-6 text-center text-zinc-500 space-y-2">
              <CheckSquare className="w-8 h-8 text-zinc-700" />
              <p className="text-xs text-zinc-400">
                Isi draf di sebelah kiri lalu klik tombol untuk menguji kepatuhan algoritma.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
