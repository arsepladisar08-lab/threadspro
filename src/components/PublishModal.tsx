import React, { useState, useEffect } from "react";
import { VariantOutput } from "../types";
import { threadsClient, ThreadsAccount } from "../services/threadsClient";
import { ThreadsConnectModal } from "./ThreadsConnectModal";
import { X, Send, CheckCircle2, AlertCircle, ExternalLink, Loader2, Key } from "lucide-react";

interface Props {
  variant: VariantOutput;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (permalink: string) => void;
}

export const PublishModal: React.FC<Props> = ({ variant, isOpen, onClose, onSuccess }) => {
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ permalink: string } | null>(null);
  const [account, setAccount] = useState<ThreadsAccount | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      threadsClient.getAccount().then(setAccount);
      setError(null);
      setResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const mainPostText = variant.posts[0]?.text || "";
  const topicTag = variant.topic_tag.replace(/#/g, "").trim();
  const reply2Text = variant.reply_2?.text || "";

  const handlePublish = async () => {
    if (!account) {
      setError("Silakan hubungkan akun Threads Anda terlebih dahulu menggunakan Token Akses.");
      return;
    }

    setPublishing(true);
    setError(null);
    try {
      const res = await threadsClient.publishThread({
        text: mainPostText,
        topicTag,
        reply2Text: reply2Text || undefined,
      });

      setResult({ permalink: res.permalink });
      if (onSuccess) onSuccess(res.permalink);
    } catch (e: any) {
      setError(e.message || "Gagal memposting ke Threads.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
        <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            disabled={publishing}
            className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-rose-500 text-white flex items-center justify-center font-bold">
              @
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Posting ke Akun Threads Asli</h3>
              <p className="text-xs text-neutral-400">Konfirmasi akhir sebelum diterbitkan</p>
            </div>
          </div>

          {result ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Berhasil Diposting!</h4>
                <p className="text-xs text-neutral-400 mt-1">Utas telah berhasil dipublikasikan di akun Threads Anda.</p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <a
                  href={result.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition"
                >
                  <span>Lihat di Threads</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Account State Banner */}
              {account ? (
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={account.threads_profile_picture_url}
                      alt={account.username}
                      className="w-7 h-7 rounded-full border border-neutral-700 object-cover"
                    />
                    <div>
                      <span className="text-neutral-400">Memposting sebagai: </span>
                      <span className="font-bold text-white">@{account.username}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Akun Resmi
                  </span>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-amber-200">Akun Threads Belum Terhubung</div>
                    <div className="text-[11px] text-amber-300/80 mt-0.5">
                      Mode mock dinonaktifkan. Anda perlu memasukkan Token Akses untuk memposting.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsConnectModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold bg-amber-500 text-neutral-950 hover:bg-amber-400 text-xs shrink-0 transition"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Hubungkan Akun</span>
                  </button>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Post 1 Preview */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="font-semibold text-neutral-300">Post Utama (#1)</span>
                  <span>{mainPostText.length}/500 karakter</span>
                </div>
                <p className="text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                  {mainPostText}
                </p>
              </div>

              {/* Topic Tag */}
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <span className="text-xs text-neutral-400">Topic Tag (1 tag):</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-medium">
                  {topicTag || "Umum"}
                </span>
              </div>

              {/* Reply 2 Preview */}
              {reply2Text && (
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="font-semibold text-neutral-300">Reply ke-2 (Otomatis)</span>
                    <span className="text-emerald-400 text-[10px]">Aman Algoritma</span>
                  </div>
                  <p className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto">
                    {reply2Text}
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={publishing}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing || !account}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menerbitkan ke Threads...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Setujui & Terbitkan Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connect Modal */}
      <ThreadsConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnected={(acc) => {
          setAccount(acc);
          setIsConnectModalOpen(false);
        }}
      />
    </>
  );
};
