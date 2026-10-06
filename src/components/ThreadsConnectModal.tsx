import React, { useState, useEffect } from "react";
import { X, Key, ShieldCheck, ExternalLink, Loader2, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";
import { threadsClient, ThreadsAccount } from "../services/threadsClient";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (account: ThreadsAccount) => void;
}

export const ThreadsConnectModal: React.FC<Props> = ({ isOpen, onClose, onConnected }) => {
  const [activeTab, setActiveTab] = useState<"token" | "oauth">("token");
  const [tokenInput, setTokenInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const redirectUri = `${window.location.origin}/auth/callback`;

  // Listen for OAuth message from popup
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Validate origin
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost")) {
        return;
      }

      if (event.data?.type === "THREADS_OAUTH_SUCCESS") {
        if (event.data.accessToken) {
          try {
            setLoading(true);
            const acc = await threadsClient.connectWithToken(event.data.accessToken);
            setSuccessMsg(`Akun @${acc.username} berhasil terhubung!`);
            onConnected(acc);
            setTimeout(() => {
              onClose();
            }, 1200);
          } catch (e: any) {
            setError(e.message || "Gagal memproses token dari login OAuth.");
          } finally {
            setLoading(false);
          }
        } else if (event.data.code) {
          // Received authorization code
          setError(
            `Kode otorisasi diterima (${event.data.code.slice(0, 10)}...). Untuk koneksi langsung tanpa server backend token exchange, disarankan menggunakan tab "Token Akses Langsung" dengan token yang digenerate dari Meta Developers Console.`
          );
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onConnected, onClose]);

  if (!isOpen) return null;

  const handleConnectWithToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setError("Silakan masukkan token akses Meta Threads Anda.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const acc = await threadsClient.connectWithToken(tokenInput.trim());
      setSuccessMsg(`Berhasil terhubung ke akun Threads @${acc.username}!`);
      onConnected(acc);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Gagal memvalidasi token akses Threads.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOAuth = () => {
    setError(null);
    const authUrl = threadsClient.getOAuthUrl(redirectUri);

    const popup = window.open(authUrl, "threads_oauth_popup", "width=600,height=720");
    if (!popup) {
      setError("Pop-up diblokir oleh browser. Harap izinkan pop-up untuk situs ini.");
    }
  };

  const copyCallbackUrl = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20">
            @
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Hubungkan Akun Threads Asli</h3>
            <p className="text-xs text-neutral-400">Pilih metode integrasi Meta Threads resmi</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex rounded-xl bg-neutral-950 p-1 mb-5 border border-neutral-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab("token");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === "token"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Token Akses (Rekomendasi Cepat)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("oauth");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === "oauth"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Login via OAuth Popup
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: DIRECT TOKEN */}
        {activeTab === "token" && (
          <form onSubmit={handleConnectWithToken} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Threads User Access Token:
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Contoh: THQWJ... atau token dari Graph API Explorer"
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-indigo-500 font-mono"
                  disabled={loading}
                />
              </div>
              <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed">
                Token disimpan secara privat di IndexedDB browser Anda dan tidak pernah dikirim ke server pihak ketiga.
              </p>
            </div>

            {/* Step-by-step Helper */}
            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 text-xs space-y-2">
              <div className="font-semibold text-neutral-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cara mendapatkan Token Akses Threads (1 Menit):</span>
              </div>
              <ol className="list-decimal list-inside text-[11px] text-neutral-400 space-y-1 leading-relaxed">
                <li>
                  Buka{" "}
                  <a
                    href="https://developers.facebook.com/apps/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 underline inline-flex items-center gap-0.5"
                  >
                    Meta for Developers <ExternalLink className="w-2.5 h-2.5 inline" />
                  </a>
                </li>
                <li>Pilih / Buat App &gt; Tambahkan use-case <b>Threads API</b></li>
                <li>
                  Buka menu <b>Threads &gt; Token Generator</b> atau Graph API Explorer
                </li>
                <li>
                  Beri izin scope: <code className="text-neutral-300 bg-neutral-800 px-1 rounded">threads_basic</code>,{" "}
                  <code className="text-neutral-300 bg-neutral-800 px-1 rounded">threads_content_publish</code>,{" "}
                  <code className="text-neutral-300 bg-neutral-800 px-1 rounded">threads_manage_insights</code>
                </li>
                <li>Klik <b>Generate Token</b> lalu salin dan tempel di sini</li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Token...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verifikasi & Hubungkan Akun</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: OAUTH POPUP */}
        {activeTab === "oauth" && (
          <div className="space-y-4">
            <p className="text-xs text-neutral-300 leading-relaxed">
              Masuk langsung menggunakan popup autentikasi resmi Meta Threads.
            </p>

            {/* Redirect URI Info Box */}
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
              <span className="text-[11px] font-semibold text-neutral-400 block">
                Callback URL Resmi untuk Meta Developer App Settings:
              </span>
              <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-neutral-900 border border-neutral-800 font-mono text-[11px] text-neutral-300 overflow-x-auto">
                <span className="truncate">{redirectUri}</span>
                <button
                  type="button"
                  onClick={copyCallbackUrl}
                  className="shrink-0 p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                  title="Salin URL"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <span className="text-[10px] text-neutral-400 block">
                Tambahkan URL ini di bagian: <i>Meta App Dashboard &gt; Threads &gt; Redirect URIs</i>.
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">
                Scope: basic, content_publish, insights
              </span>
              <button
                type="button"
                onClick={handleOpenOAuth}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Otorisasi Threads (Popup)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
