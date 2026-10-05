# AutoThreads (Warga Threads Indonesia)

Web app generator dan peracik utas Threads Indonesia beralgoritma tinggi, berpola referensi teruji, dan anti-copy. Dibuat dengan **Vite + React 18 + TypeScript + Tailwind CSS** serta ditenagai model Gemini resmi melalui `@google/genai`.

---

## Fitur Utama

1. **Onboarding Profil Niche**: Personalisasi target audiens, tone suara (santai, jujur, lucu, edukatif), produk/jasa, dan aturan larangan topik.
2. **Generator Utas (Idea Fusion Pipeline)**:
   - **Idea DNA**: Mengekstrak sudut pandang, fakta riil, dan placeholder tanpa mengarang angka.
   - **Semantic Retriever**: Mengambil pola dari 12 pilar Bank Referensi dengan bobot provenance (A-E) dan memilih minimal 1 pola cross-niche.
   - **Fuser + Writer**: Menghasilkan 3 varian utas siap posting dengan template berbeda.
   - **Code Guard**: Audit anti-copy 6-gram, anti-engagement bait, batas karakter 500/post, dan topic tag tunggal tanpa `#`.
   - **Jejak Fusi & Tooltip Provenance**: Transparansi asal pola (A/B/C/D/E) dengan catatan jujur.
3. **Cek Kualitas (Algorithm-Safe Checker)**: Skor 0-100 dan tombol perbaiki otomatis satu klik.
4. **Kalender Mingguan**: Formula Mode Umum (40/40/20) dan Hub Kreator (Ilmu, Peluang, Lapak Jumat, Soft-selling) + ekspor file `.ics` ke Google Calendar.
5. **Asisten Balas Komentar (Reply Depth)**: 3 opsi balasan cerdas yang memancing percakapan lanjutan (bukan "makasih kak").
6. **Ulas Utas Viral**: Reverse-engineering utas orang lain menjadi draf kartu baru di Bank Referensi.
7. **Tracker Metrik Mandiri**: Menghitung rasio Reply-to-Like (patokan > 0,15) dan membentuk bobot personalisasi Label E.
8. **Threads API Lab & Manajemen Kuota**: Demo interaktif `THREADS_MOCK=true` di AI Studio preview dan siap integrasi penuh di produksi.

---

## Menjalankan Proyek Secara Lokal

1. **Clone repositori dan install dependencies:**
   ```bash
   git clone <repo-url>
   cd autothreads
   npm install
   ```

2. **Jalankan development server:**
   ```bash
   npm run dev
   ```
   Buka browser di `http://localhost:3000`.

3. **Uji Build TypeScript:**
   ```bash
   npm run build
   ```

---

## Deployment ke Vercel

Aplikasi ini sudah dilengkapi dengan `vercel.json` untuk SPA client-side routing dan Vercel Functions di `/api`.

1. **Push ke GitHub:**
   ```bash
   git add .
   git commit -m "feat: inisialisasi AutoThreads lengkap"
   git push origin main
   ```

2. **Import ke Vercel:**
   - Masuk ke dashboard [vercel.com](https://vercel.com).
   - Klik **Add New Project** → pilih repositori GitHub Anda.
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Konfigurasi Environment Variables di Vercel:**
   - `VITE_AI_MODE`: `proxy` (Memastikan API key Gemini aman di sisi server).
   - `GEMINI_API_KEY`: Masukkan Google Gemini API key Anda.
   - `CRON_SECRET`: Token rahasia acak untuk mengamankan Vercel Cron.
   - `VITE_THREADS_MOCK`: `true` (atau `false` jika sudah memiliki Threads App credentials).

---

## Daftar Environment Variables

| Variabel | Lingkungan | Keterangan |
|---|---|---|
| `VITE_AI_MODE` | Client | `"direct"` untuk AI Studio preview, `"proxy"` untuk produksi Vercel. |
| `VITE_STORAGE` | Client | `"local"` (IndexedDB tanpa backend) atau `"supabase"`. |
| `VITE_THREADS_MOCK` | Client | `"true"` untuk mode mock simulasi. |
| `GEMINI_API_KEY` | Server | Kunci API Gemini resmi dari Google AI Studio. |
| `THREADS_APP_ID` | Server | ID Aplikasi Meta Developers untuk integrasi Threads resmi. |
| `THREADS_APP_SECRET` | Server | Secret Aplikasi Meta Developers. |
| `CRON_SECRET` | Server | Secret proteksi `/api/cron/daily`. |

---

## Checklist App Review Meta Threads (Untuk Fase Produksi)

Jika mengajukan integrasi live akun dengan Meta Threads Graph API:
- [ ] Buat Meta App di [developers.facebook.com](https://developers.facebook.com) bertipe **Business / Consumer**.
- [ ] Tambahkan produk **Threads API**.
- [ ] Buat video screen recording alur login OAuth dan penanganan izin:
  - `threads_basic`: Membaca profil dan postingan sendiri.
  - `threads_manage_insights`: Membaca performa views, likes, dan replies.
  - `threads_content_publish`: Mempublikasikan utas dengan konfirmasi pengguna (tidak ada auto-post tanpa klik).
- [ ] Cantumkan URL Kebijakan Privasi (Privacy Policy) dan URL Ketentuan Layanan.
- [ ] Cantumkan endpoint Deauthorize Callback dan Data Deletion Callback.
