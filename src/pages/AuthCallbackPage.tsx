import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export const AuthCallbackPage: React.FC = () => {
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Memproses otorisasi Meta Threads...");

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const code = urlParams.get("code") || hashParams.get("code");
      const accessToken = urlParams.get("access_token") || hashParams.get("access_token");
      const error = urlParams.get("error_description") || urlParams.get("error");

      if (error) {
        setStatus("error");
        setMessage(`Otorisasi gagal: ${error}`);
        return;
      }

      if (code || accessToken) {
        setStatus("success");
        setMessage("Otorisasi Threads berhasil! Jendela ini akan tertutup otomatis.");

        if (window.opener) {
          // Kirim pesan ke jendela utama via postMessage
          window.opener.postMessage(
            {
              type: "THREADS_OAUTH_SUCCESS",
              code: code ? code.replace(/#_$/, "") : undefined,
              accessToken,
            },
            "*"
          );
          setTimeout(() => {
            window.close();
          }, 1200);
        } else {
          // Jika dibuka di tab mandiri, arahkan kembali ke aplikasi
          setTimeout(() => {
            window.location.href = "/profil?tab=api";
          }, 1500);
        }
      } else {
        setStatus("error");
        setMessage("Tidak ditemukan parameter kode otorisasi pada URL.");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Terjadi kesalahan saat memproses callback.");
    }
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full p-6 rounded-2xl bg-neutral-900 border border-neutral-800 text-center space-y-4 shadow-2xl">
        {status === "processing" && (
          <div className="space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
            <h2 className="text-base font-bold text-white">Menghubungkan Akun Threads</h2>
            <p className="text-xs text-neutral-400">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-white">Koneksi Berhasil</h2>
            <p className="text-xs text-neutral-400">{message}</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-white">Koneksi Gagal</h2>
            <p className="text-xs text-rose-300">{message}</p>
            <button
              onClick={() => window.close()}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
            >
              Tutup Jendela
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
