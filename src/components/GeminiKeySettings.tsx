import React, { useState, useEffect } from "react";
import {
  Key,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { storage } from "../lib/storage";
import { testGeminiApiKey } from "../services/ai";

interface GeminiKeySettingsProps {
  onSaved?: (key: string) => void;
  compact?: boolean;
}

export const GeminiKeySettings: React.FC<GeminiKeySettingsProps> = ({
  onSaved,
  compact = false,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [hasCustomKey, setHasCustomKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });

  useEffect(() => {
    loadKey();
  }, []);

  const loadKey = async () => {
    const key = await storage.getCustomApiKey();
    if (key) {
      setApiKeyInput(key);
      setHasCustomKey(true);
    } else {
      setApiKeyInput("");
      setHasCustomKey(false);
    }
  };

  const handleSaveKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = apiKeyInput.trim();
    if (!clean) {
      setTestStatus({
        type: "error",
        message: "API Key Gemini tidak boleh kosong.",
      });
      return;
    }

    setIsTesting(true);
    setTestStatus({
      type: "info",
      message: "Menguji validitas API Key langsung ke Google Gemini...",
    });

    try {
      const res = await testGeminiApiKey(clean);
      if (res.success) {
        await storage.saveCustomApiKey(clean);
        setHasCustomKey(true);
        setTestStatus({
          type: "success",
          message:
            "API Key Google Gemini valid dan berhasil disimpan privat di perangkat Anda!",
        });
        if (onSaved) onSaved(clean);
      } else {
        setTestStatus({
          type: "error",
          message: `Verifikasi gagal: ${res.message}`,
        });
      }
    } catch (err: any) {
      setTestStatus({
        type: "error",
        message: `Terjadi kendala saat menguji: ${
          err.message || "Pastikan kunci API benar."
        }`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearKey = async () => {
    await storage.clearCustomApiKey();
    setApiKeyInput("");
    setHasCustomKey(false);
    setTestStatus({
      type: "info",
      message:
        "Kunci API mandiri dihapus. Aplikasi kini menggunakan kunci bawaan sistem.",
    });
    setTimeout(() => setTestStatus({ type: null, message: "" }), 3500);
  };

  return (
    <div
      className={`rounded-2xl border border-zinc-900 bg-zinc-950/60 ${
        compact ? "p-4 space-y-3.5" : "p-5 sm:p-6 space-y-4"
      }`}
    >
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-3.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-zinc-300" />
            <h3 className="text-sm font-semibold text-zinc-100">
              Input API Gemini Mandiri
            </h3>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono flex items-center gap-1.5 ${
                hasCustomKey
                  ? "bg-zinc-900 text-emerald-400 border border-emerald-900/40"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-800"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  hasCustomKey ? "bg-emerald-400" : "bg-zinc-500"
                }`}
              />
              {hasCustomKey ? "Kunci Mandiri Aktif" : "Kunci Bawaan Sistem"}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Gunakan API Key Google Gemini pribadi Anda untuk kuota pembuatan tanpa batas dan kecepatan maksimal.
          </p>
        </div>

        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 transition shrink-0 cursor-pointer"
        >
          <span>Dapatkan Kunci Gratis</span>
          <ExternalLink className="w-3 h-3 text-zinc-400" />
        </a>
      </div>

      {/* Test / Validation Alert */}
      {testStatus.type && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            testStatus.type === "success"
              ? "bg-zinc-900 border-emerald-500/30 text-emerald-300"
              : testStatus.type === "error"
              ? "bg-zinc-900 border-rose-500/30 text-rose-300"
              : "bg-zinc-900 border-zinc-800 text-zinc-300"
          }`}
        >
          {testStatus.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : testStatus.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <RefreshCw className="w-4 h-4 animate-spin text-zinc-400 shrink-0" />
          )}
          <span className="flex-1">{testStatus.message}</span>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSaveKey} className="space-y-3.5">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-300">
            Google Gemini API Key (format: <code>AIzaSy...</code>):
          </label>
          <div className="relative flex items-center">
            <input
              type={showKey ? "text" : "password"}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Tempel kunci Gemini Anda di sini (AIzaSy...)"
              className="w-full p-2.5 pr-20 rounded-xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-zinc-600 font-mono tracking-wider"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 p-1 text-zinc-500 hover:text-white cursor-pointer"
              title={showKey ? "Sembunyikan" : "Tampilkan"}
            >
              {showKey ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-zinc-500 gap-1 pt-0.5">
            <span>
              Tersimpan aman di peramban (IndexedDB lokal), tidak dibagikan ke pihak ketiga.
            </span>
            <span>Mendukung model Gemini 2.5 Flash</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
          {hasCustomKey ? (
            <button
              type="button"
              onClick={handleClearKey}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Kunci Mandiri</span>
            </button>
          ) : (
            <span className="text-[11px] text-zinc-500">
              Jika kosong, aplikasi memakai proxy bawaan server.
            </span>
          )}

          <button
            type="submit"
            disabled={isTesting || !apiKeyInput.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-950 transition cursor-pointer shadow-xs disabled:opacity-40"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Menguji & Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Uji & Simpan Gemini Key</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Guide Note */}
      {!compact && (
        <div className="p-3.5 rounded-xl border border-zinc-900 bg-zinc-950/40 text-xs text-zinc-400 space-y-1">
          <div className="font-medium text-zinc-200 text-xs flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            <span>Cara mendapatkan Google Gemini API Key gratis:</span>
          </div>
          <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-zinc-400 pl-1 leading-relaxed">
            <li>
              Buka{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-zinc-200 underline hover:text-white"
              >
                Google AI Studio (aistudio.google.com)
              </a>
              .
            </li>
            <li>Klik tombol <strong>"Create API key"</strong>.</li>
            <li>Salin string kunci yang berawalan <code>AIzaSy...</code>.</li>
            <li>Tempel ke kolom di atas dan klik <strong>"Uji & Simpan Gemini Key"</strong>.</li>
          </ol>
        </div>
      )}
    </div>
  );
};
