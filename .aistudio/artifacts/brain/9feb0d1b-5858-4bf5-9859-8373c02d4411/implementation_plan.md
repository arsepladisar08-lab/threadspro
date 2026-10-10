# Penataan Struktur Utas 4 Tahap: Post #1, Reply #2, Reply #3, dan Reply #4

Mengubah alur penomoran dan visualisasi draf utas pada 3 varian hasil fusi AutoThreads sehingga Post #1 berfungsi sebagai Postingan Utama, Post #2 sebagai Reply ke-2, Post #3 sebagai Reply ke-3, dan balasan penutup/CTA/link yang sebelumnya berlabel Reply ke-2 menjadi Reply ke-4 secara konsisten di seluruh aplikasi.

## User Review & Critical Decisions

> [!IMPORTANT]
> Keputusan ini telah dikonfirmasi melalui interaksi klarifikasi dengan pengguna:

- **Konfirmasi Cakupan**: Pengguna memilih opsi komprehensif, yaitu memperbarui **Label UI, Alur Salin Semua Utas, serta Instruksi AI Writer 4 Tahap**.
- **Kompatibilitas Skema Data**: Struktur data internal tetap mempertahankan keandalan array `posts` (post 1, 2, 3) dan objek balasan penutup `reply_2` yang sudah tersimpan di database lokal/Supabase, namun di tingkat representasi, salin teks, penayangan, dan prompt diperlakukan secara konsisten sebagai rantai 4 tahap: Post #1 -> Reply #2 -> Reply #3 -> Reply #4.

---

## 1. Overview & Core Concept

- **What It Does**: Memberikan pemetaan urutan yang alami bagi kreator Threads:
  1. **Post #1 (Postingan Utama)**: Hook pembuka dan fondasi keresahan/ide.
  2. **Reply #2 (Balasan Pertama)**: Poin lanjutan isi/cerita yang membalas Post #1.
  3. **Reply #3 (Balasan Kedua)**: Poin inti/payoff/kesimpulan yang melengkapi pembahasan.
  4. **Reply #4 (Balasan Penutup / CTA)**: Balasan pemantik interaksi dua arah, konteks tambahan, atau tautan resmi/afiliasi tanpa merusak jangkauan post utama.
- **Target Audience**: Kreator konten dan praktisi Threads Indonesia yang mempublikasikan thread berantai 3-4 bagian.
- **Key Value**: Menghilangkan kebingungan penomoran (yang sebelumnya menampilkan Post #1, Post #2, Post #3, lalu tiba-tiba berlabel "Reply #2" untuk CTA).

---

## 2. User Experience & Visual Design

### Walkthrough & Alur Visual

1. **Generator Utas (`/`)**:
   - Node pertama: Avatar `@`, label `Post Utama (#1)`.
   - Node kedua: Avatar `R2`, label `Reply ke-2`.
   - Node ketiga: Avatar `R3`, label `Reply ke-3`.
   - Node keempat: Avatar `R4`, label `Reply ke-4 (Tautan / CTA)`.
   - Garis konektor vertikal menghubungkan node 1 ke node 2, 3, dan 4 secara berkesinambungan.
   - Tombol **Salin Semua** menghasilkan format yang rapi:
     ```
     [Post Utama #1]
     ...
     ---
     [Reply ke-2]
     ...
     ---
     [Reply ke-3]
     ...
     ---
     [Reply ke-4 / CTA]
     ...
     ```
2. **Modal Publikasi Threads (`PublishModal.tsx`)**:
   - Preview balasan otomatis diberi label `Reply ke-4 (Otomatis / CTA):` dan deskripsi mode root merujuk ke Reply ke-2, ke-3, dan ke-4.
3. **Daftar Antrean Jadwal (`ScheduledQueueList.tsx`)**:
   - Preview balasan penutup menampilkan `Reply #4: ...`.
4. **Link Lab (`/link`)**:
   - Varian hasil analisis video YouTube dan produk afiliasi menampilkan urutan yang selaras (Post Utama #1 -> Reply ke-2 -> Reply ke-3 -> Reply ke-4).
5. **Checker Page (`/checker`)**:
   - Input audit balasan penutup diselaraskan dengan label `Reply #4 (Tautan / Referensi Penutup)`.

### Tema & Gaya Antarmuka
- Menggunakan Tailwind utility berpasangan (mis. `bg-white dark:bg-zinc-950`, `text-zinc-900 dark:text-zinc-100`, `border-zinc-200 dark:border-zinc-850`).
- Avatar node menggunakan badge minimalis yang jelas (`@`, `R2`, `R3`, `R4`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Representasi 4 Tahap tanpa Breaking Changes Database**
  - *Chosen Approach*: `posts[0]` = Post Utama, `posts[1]` = Reply ke-2, `posts[2]` = Reply ke-3, dan field balasan penutup yang sudah ada (`reply_2`) dipetakan secara visual dan operasional sebagai Reply ke-4.
  - *Why*: Draf utas lama yang sudah ada di IndexedDB/Supabase milik pengguna tidak rusak, namun seluruh antarmuka dan penomoran baru tampil rapi sebagai urutan 1, 2, 3, 4.
  - *Alternatives Considered*: Mengubah nama field skema Zod secara paksa menjadi `reply_4` yang dapat menyebabkan invalidasi draf lama yang sudah tersimpan.
- **Decision 2: Instruksi AI Writer Prompt**
  - *Chosen Approach*: Perjelas panduan di `src/prompts/writer.ts` bahwa draf dirancang tepat 3 post utama yang mengalir (Post 1 sebagai pembuka, Post 2 sebagai balasan pertama/Reply 2, Post 3 sebagai balasan kedua/Reply 3) diikuti oleh balasan penutup sebagai Reply ke-4.
  - *Why*: Hasil generasi AI baru akan memiliki ritme percakapan bersambung yang terasa seperti balasan organik di bawah postingan pertama.

---

## 4. Technical Architecture & Data Strategy

```
┌──────────────────────────────────────────────────────────────┐
│                    AI Writer Generation                     │
│  Input: Niche, Tone, Ide Kasar, 3 Kartu Pola Teruji          │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                  Struktur Utas 4 Tahap                       │
│  ├─ Post 1 (Order 1) : Post Utama (#1)                       │
│  ├─ Post 2 (Order 2) : Reply ke-2                            │
│  ├─ Post 3 (Order 3) : Reply ke-3                            │
│  └─ Reply CTA        : Reply ke-4 (Konteks / CTA / Link)     │
└──────────────────────────────┬───────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│ Generator UI  │      │ Publish Modal │      │ Salin & Queue │
│ Node @,R2,R3, │      │ Preview       │      │ Format Utas   │
│ dan R4        │      │ Reply #4      │      │ Berurutan     │
└───────────────┘      └───────────────┘      └───────────────┘
```

## 5. Status Pelaksanaan & Hasil Verifikasi

- [x] **Prompt AI Writer (`src/prompts/writer.ts`)**: Instruksi diperbarui untuk memandu pembagian 4 tahap (Post 1 sebagai pembuka, Post 2 sebagai Reply ke-2, Post 3 sebagai Reply ke-3, dan reply_2 sebagai Reply ke-4).
- [x] **Generator Utas (`src/pages/GeneratorPage.tsx`)**: Badge node diperbarui (@, R2, R3, R4), label dinamis disesuaikan, tombol "Salin Semua" menyalin dengan tag sekuensial lengkap, dan toast simpanan diperbarui.
- [x] **Modal Publikasi (`src/components/PublishModal.tsx`)**: Label pratinjau diperbarui menjadi `Reply ke-4 (Otomatis / CTA)`.
- [x] **Antrean Jadwal (`src/components/ScheduledQueueList.tsx`)**: Pratinjau draf antrean menampilkan `Reply #4:`.
- [x] **Link Lab (`src/pages/LinkLabPage.tsx`)**: Penomoran kartu video & afiliasi serta alur salin diselaraskan ke struktur 4 tahap.
- [x] **Pemeriksa Kepatuhan (`src/pages/CheckerPage.tsx`)**: Label input balasan diselaraskan ke `Reply #4`.
- [x] **Kompilasi & Lint**: Lulus verifikasi TypeScript dan build Vite tanpa error.
