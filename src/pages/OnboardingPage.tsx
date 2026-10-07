import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Key,
  ShieldCheck,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  UserCheck,
  Zap,
  Clock,
  BarChart3,
  HelpCircle,
  Layers,
} from "lucide-react";
import { threadsClient, ThreadsAccount } from "../services/threadsClient";
import { storage } from "../lib/storage";

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"token" | "oauth" | "demo">("token");
  const [tokenInput, setTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [demoUsername, setDemoUsername] = useState("@kreator_threads");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedAccount, setConnectedAccount] = useState<ThreadsAccount | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const redirectUri = `${window.location.origin}/auth/callback`;

  // Periksa apakah sudah ada akun yang terhubung sebelumnya
  useEffect(() => {
    threadsClient.getAccount().then((acc) => {
      if (acc) {
        setConnectedAccount(acc);
      }
    });
  }, []);

  // Countdown otomatis menuju /profil saat akun berhasil terhubung
  useEffect(() => {
    if (redirectCountdown === null) return;
    if (redirectCountdown <= 0) {
      navigate("/profil?onboarding=true");
      return;
    }

    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [redirectCountdown, navigate]);

  // Listener popup OAuth 2.0 Threads
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost")) {
        return;
      }

      if (event.data?.type === "THREADS_OAUTH_SUCCESS") {
        if (event.data.accessToken) {
          try {
            setLoading(true);
            setError(null);
            const acc = await threadsClient.connectWithToken(event.data.accessToken);
            setConnectedAccount(acc);
            setRedirectCountdown(2);
          } catch (e: any) {
            setError(e.message || "Gagal memproses otorisasi akun Threads via OAuth.");
          } finally {
            setLoading(false);
          }
        } else if (event.data.code) {
          setError(
            "Kode otorisasi diterima. Disarankan menggunakan tab 'Token Akses Meta' untuk validasi instan langsung ke Graph API."
          );
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Hubungkan dengan User Access Token Meta Threads
  const handleConnectWithToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setError("Silakan masukkan token akses Meta Threads Anda.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const acc = await threadsClient.connectWithToken(tokenInput.trim());
      setConnectedAccount(acc);
      setRedirectCountdown(2);
    } catch (err: any) {
      setError(
        err.message || "Gagal memvalidasi token akses Threads. Pastikan token masih aktif dan belum kedaluwarsa."
      );
    } finally {
      setLoading(false);
    }
  };

  // Hubungkan dengan Akun Sandbox / Demo
  const handleConnectDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const acc = await threadsClient.connectDemoAccount(demoUsername);
      setConnectedAccount(acc);
      setRedirectCountdown(2);
    } catch (err: any) {
      setError(err.message || "Gagal mengaktifkan akun demo.");
    } finally {
      setLoading(false);
    }
  };

  // Buka popup OAuth Threads
  const handleOpenOAuth = () => {
    setError(null);
    const authUrl = threadsClient.getOAuthUrl(redirectUri);
    const popup = window.open(authUrl, "threads_oauth_popup", "width=600,height=720");
    if (!popup) {
      setError("Pop-up diblokir oleh browser. Harap izinkan pop-up untuk situs ini.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 py-8 sm:py-12 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-2xl space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Langkah 1 dari 2: Syarat Wajib Akses Tools
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-zinc-950 flex items-center justify-center font-bold text-xl shadow-lg shadow-white/5">
              @
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              AutoThreads
            </h1>
          </div>
          <p className="text-zinc-400 text-sm sm:text-base max-w-lg mx-auto">
            Studio Utas AI & Engine Publikasi Resmi Meta Threads. Hubungkan akun Threads Anda untuk membuka akses ke generator, penjadwalan WIB, dan analitik.
          </p>
        </div>

        {/* Multi-Step Flow Indicator */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs text-center">
          <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-zinc-800/70 border border-zinc-700/60 font-semibold text-white">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
              1
            </div>
            <span>Login Threads</span>
            <span className="text-[10px] text-emerald-400 font-mono">Aktif</span>
          </div>

          <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg text-zinc-400 font-medium">
            <div className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs">
              2
            </div>
            <span>Atur Profil & Niche</span>
            <span className="text-[10px] text-zinc-400 font-mono">Otomatis Lanjut</span>
          </div>

          <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg text-zinc-400 font-medium">
            <div className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs">
              3
            </div>
            <span>Akses Semua Tools</span>
            <span className="text-[10px] text-zinc-400 font-mono">Terbuka Penuh</span>
          </div>
        </div>

        {/* If Account is Already Connected */}
        {connectedAccount ? (
          <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/90 border border-emerald-500/30 shadow-xl shadow-emerald-500/5 space-y-6 text-center animate-in fade-in duration-300">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Akun Threads Terhubung!</h3>
              <p className="text-sm text-zinc-400">
                Selamat datang, <span className="text-white font-semibold">@{connectedAccount.username}</span> ({connectedAccount.name}). Akun Anda telah siap disinkronkan dengan AutoThreads.
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800 max-w-sm mx-auto">
              <img
                src={connectedAccount.threads_profile_picture_url}
                alt={connectedAccount.username}
                className="w-12 h-12 rounded-full border border-zinc-700 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${connectedAccount.username}`;
                }}
              />
              <div className="text-left">
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  @{connectedAccount.username}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                    {connectedAccount.isReal ? "Meta Official" : "Sandbox"}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 truncate max-w-[180px]">
                  {connectedAccount.threads_biography || "Kreator AutoThreads"}
                </div>
              </div>
            </div>

            {redirectCountdown !== null && (
              <div className="text-xs text-zinc-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                Mengarahkan otomatis ke Pengaturan Profil dalam {redirectCountdown} detik...
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => navigate("/profil?onboarding=true")}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:scale-[1.01]"
              >
                <span>Lanjut ke Pengaturan Profil</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                <span>Buka Generator Utas →</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await threadsClient.disconnectAccount();
                  setConnectedAccount(null);
                  setRedirectCountdown(null);
                }}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors"
              >
                Ganti Akun Lain
              </button>
            </div>
          </div>
        ) : (
          /* Authentication Method Selection */
          <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800/90 shadow-xl overflow-hidden divide-y divide-zinc-800">
            {/* Tabs */}
            <div className="flex border-b border-zinc-800 bg-zinc-950/60 p-1.5 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("token");
                  setError(null);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === "token"
                    ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                }`}
              >
                <Key className="w-4 h-4 text-indigo-400" />
                <span>Token Akses Meta</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("oauth");
                  setError(null);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === "oauth"
                    ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Login OAuth Threads</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("demo");
                  setError(null);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === "demo"
                    ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Coba Sandbox</span>
              </button>
            </div>

            {/* Error Message Box */}
            {error && (
              <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
                <div className="leading-relaxed">{error}</div>
              </div>
            )}

            {/* Tab 1: Token Akses Meta Threads */}
            {activeTab === "token" && (
              <form onSubmit={handleConnectWithToken} className="p-5 sm:p-7 space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-300">
                    User Access Token Meta Threads
                  </label>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Masukkan token yang memiliki izin <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded">threads_basic</code>,{" "}
                    <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded">threads_content_publish</code>, dan{" "}
                    <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded">threads_manage_insights</code>.
                  </p>
                </div>

                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="THQW... atau EAAG..."
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-3 pr-10 text-sm font-mono text-zinc-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-1"
                    title={showToken ? "Sembunyikan Token" : "Tampilkan Token"}
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Collapsible Meta Developers Guide */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3.5 text-xs space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowGuide(!showGuide)}
                    className="w-full flex items-center justify-between font-medium text-zinc-300 hover:text-white"
                  >
                    <span className="flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-indigo-400" />
                      Cara mendapatkan User Token dari Meta Developer Console?
                    </span>
                    <span className="text-[11px] text-zinc-400">{showGuide ? "Tutup ▲" : "Lihat Panduan ▼"}</span>
                  </button>

                  {showGuide && (
                    <ol className="list-decimal list-inside space-y-1.5 pt-2 text-zinc-400 border-t border-zinc-800 text-[11px] leading-relaxed">
                      <li>
                        Buka{" "}
                        <a
                          href="https://developers.facebook.com"
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 underline inline-flex items-center gap-0.5"
                        >
                          developers.facebook.com <ExternalLink className="w-2.5 h-2.5" />
                        </a>{" "}
                        dan pilih aplikasi Anda (Type: Business / None).
                      </li>
                      <li>Tambahkan produk <strong>Threads API</strong> di sidebar dashboard.</li>
                      <li>
                        Buka menu <strong>Graph API Explorer</strong> atau <strong>Tools &gt; User Token</strong>, pilih permissions:{" "}
                        <span className="text-zinc-300 font-mono">threads_basic, threads_content_publish, threads_manage_insights</span>.
                      </li>
                      <li>Klik <strong>Generate Access Token</strong> dan salin hasilnya ke input di atas.</li>
                    </ol>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !tokenInput.trim()}
                  className="w-full py-3.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.005] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memvalidasi Akun dengan Meta API...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Validasi & Hubungkan Akun Threads</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Tab 2: Login via OAuth Threads */}
            {activeTab === "oauth" && (
              <div className="p-5 sm:p-7 space-y-6 text-center">
                <div className="space-y-2 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-white flex items-center justify-center font-bold text-2xl mx-auto border border-zinc-700 shadow-md">
                    @
                  </div>
                  <h3 className="text-base font-bold text-white">Login Otorisasi Threads Popup</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Login langsung menggunakan jendela pop-up otorisasi Meta Threads resmi. Akun Anda akan diverifikasi tanpa harus menyalin token secara manual.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-left text-xs space-y-2 text-zinc-400">
                  <div className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Izin Akses Resmi yang Diminta:
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px]">
                    <li>Membaca profil dasar & avatar akun Threads Anda</li>
                    <li>Menerbitkan konten utas & reply atas nama Anda</li>
                    <li>Mengambil statistik views, likes, dan balasan</li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={handleOpenOAuth}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.005] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menunggu Otorisasi...</span>
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-base">@</span>
                      <span>Buka Pop-up Login Meta Threads</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Tab 3: Mode Sandbox / Coba Cepat */}
            {activeTab === "demo" && (
              <form onSubmit={handleConnectDemo} className="p-5 sm:p-7 space-y-5">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-semibold uppercase tracking-wider">
                    Eksplorasi Instan
                  </div>
                  <h3 className="text-sm font-bold text-white">Coba AutoThreads dengan Akun Sandbox</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Belum menyiapkan Meta Developer App? Anda dapat langsung mencoba seluruh tools AutoThreads menggunakan profil kreator sandbox untuk merasakan pengalaman penuh.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Username Akun Uji Coba:
                  </label>
                  <input
                    type="text"
                    value={demoUsername}
                    onChange={(e) => setDemoUsername(e.target.value)}
                    placeholder="@nama_kreator"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-sm text-zinc-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 hover:scale-[1.005]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyiapkan Akun Sandbox...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-zinc-950" />
                      <span>Mulai dengan Akun Sandbox & Lanjut ke Profil</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Feature Pillars: Why AutoThreads Needs Threads Login */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <h4 className="text-xs font-bold text-zinc-200">Publikasi Resmi</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Utas 1 & Reply 2 otomatis tayang ke Threads API resmi dengan idempotency aman.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <h4 className="text-xs font-bold text-zinc-200">Auto-Scheduler WIB</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Jadwalkan posting di prime time Indonesia (07.30, 12.00, atau 19.30 WIB) tanpa buka laptop.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <h4 className="text-xs font-bold text-zinc-200">Metrik 24 Jam</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Pantau views, likes, dan reposts untuk continuous learning variasi utas terbaik.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
