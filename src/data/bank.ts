/**
 * AutoThreads Bank Referensi Terstruktur
 * Sumber: Ulasan Meta AI & Riset Pola Threads Indonesia
 */

import { ReferenceCard, ReferenceHook, AlgorithmRule } from "../types";

export const REFERENCE_CARDS: ReferenceCard[] = [
  {
    id: "K01",
    niche: "Keuangan",
    mode: "umum",
    format: "Tips berurutan anti-teori; kesalahan finansial + hitungan kasar; screenshot mutasi/dompet/kalkulator.",
    struktur: "1 hook angka -> 3-5 poin -> 1 gambar -> pertanyaan pilihan.",
    emosi: "penasaran, insecure, lega",
    sinyal_algoritma: "reply 'gaji gue segini bisa gak?'; save",
    pola_komentar: "orang menyebut gaji/kondisinya sendiri",
    pelajaran: "angka real & counter-intuitive, bukan teori",
    guardrail: "Jangan karang angka/omzet tanpa sumber atau data user",
    provenance: "B",
    hooks: [
      {
        id: "K01-H1",
        card_id: "K01",
        pola_slot: "[Kondisi angka] tapi [hasil berlawanan]. Setelah [tindakan audit], ini [N] [penyebab]:",
        contoh_asli: "Gaji 8 juta tapi akhir bulan selalu minus. Setelah gue audit 3 bulan, ini 3 bocor halusnya:",
        provenance: "B",
        slot_list: ["Kondisi angka", "hasil berlawanan", "tindakan audit", "N", "penyebab"]
      },
      {
        id: "K01-H2",
        card_id: "K01",
        pola_slot: "Jangan [langkah umum] dulu kalau masih [kondisi]. [Urutan salah] bikin [akibat pelan-pelan]:",
        contoh_asli: "Jangan nabung dulu kalau masih punya 3 utang ini...",
        provenance: "B",
        slot_list: ["langkah umum", "kondisi", "Urutan salah", "akibat pelan-pelan"]
      },
      {
        id: "K01-H3",
        card_id: "K01",
        pola_slot: "Gue iseng [catat/ukur] [hal sepele] [durasi]. Totalnya [angka]. [Rincian] bikin [emosi]:",
        contoh_asli: "Gue iseng catat pengeluaran 'jajan gak penting' 30 hari. Totalnya 1,7jt...",
        provenance: "B",
        slot_list: ["catat/ukur", "hal sepele", "durasi", "angka", "Rincian", "emosi"]
      },
      {
        id: "K01-H4",
        card_id: "K01",
        pola_slot: "[Gaji], [beban], tapi bisa [hasil]. Alurnya:",
        contoh_asli: "Gaji 7jt, cicilan 2,5jt, tapi bisa nabung 2jt. Alurnya:",
        provenance: "C",
        slot_list: ["Gaji", "beban", "hasil"]
      },
      {
        id: "K01-H5",
        card_id: "K01",
        pola_slot: "[Dua pilihan relatable], tim mana?",
        contoh_asli: "Tim gajian langsung nabung atau langsung jajan?",
        provenance: "C",
        slot_list: ["Dua pilihan relatable"]
      }
    ],
    status: "approved"
  },
  {
    id: "K02",
    niche: "Self-Improvement",
    mode: "umum",
    format: "Daftar brutal jujur; rutinitas; 'hal yang gue berhenti lakukan'.",
    struktur: "1 hook pengakuan -> 4-7 list pendek -> 1 penutup reflektif.",
    emosi: "relate, terinspirasi, tertampar halus",
    sinyal_algoritma: "quote repost 'ini gue banget'; save",
    pola_komentar: "warga menceritakan momen sadar diri mereka",
    pelajaran: "self-callout lebih kuat daripada menggurui",
    guardrail: "Hindari nada superior/mengajari dari atas bukit",
    provenance: "B",
    hooks: [
      {
        id: "K02-H1",
        card_id: "K02",
        pola_slot: "Umur [usia], gue berhenti melakukan [N] hal ini dan hidup gue jauh lebih [hasil]:",
        contoh_asli: "Umur 26, gue berhenti melakukan 5 hal ini dan hidup gue jauh lebih tenang:",
        provenance: "B",
        slot_list: ["usia", "N", "hasil"]
      },
      {
        id: "K02-H2",
        card_id: "K02",
        pola_slot: "[Kebiasaan populer] itu [penolakan] buat gue. Ini yang works buat orang yang [tipe kamu]:",
        contoh_asli: "Rutinitas 5 pagi itu bullshit buat gue. Ini yang works buat yang bukan morning person:",
        provenance: "B",
        slot_list: ["Kebiasaan populer", "penolakan", "tipe kamu"]
      },
      {
        id: "K02-H3",
        card_id: "K02",
        pola_slot: "Jujur, gue dulu [label diri] akut. Kalimat yang nyelamatin gue:",
        contoh_asli: "Jujur, gue dulu people pleaser akut. Kalimat yang nyelamatin gue:",
        provenance: "B",
        slot_list: ["label diri"]
      },
      {
        id: "K02-H4",
        card_id: "K02",
        pola_slot: "Gue berhenti bilang '[kalimat lama]' dengan 1 kalimat ini.",
        contoh_asli: "Gue berhenti bilang 'iya gapapa' dengan 1 kalimat ini.",
        provenance: "C",
        slot_list: ["kalimat lama"]
      }
    ],
    status: "approved"
  },
  {
    id: "K03",
    niche: "Humor/Relatable",
    mode: "umum",
    format: "Meme teks 1 baris; observasi IG vs Threads; absurditas sehari-hari.",
    struktur: "1 baris punchline, tanpa utas panjang, 0-1 gambar.",
    emosi: "ngakak, rasa komunitas",
    sinyal_algoritma: "reply pendek bertubi-tubi, velocity tinggi",
    pola_komentar: "saling sindir bercanda / menimpali lelucon",
    pelajaran: "satu observasi tajam, jangan dijelaskan bertele-tele",
    guardrail: "Jangan gunakan humor SARA, bullying, atau adu domba",
    provenance: "A",
    hooks: [
      {
        id: "K03-H1",
        card_id: "K03",
        pola_slot: "Buka [platform A]: [kesan A]. Buka [platform B]: [kesan B]. [pertanyaan komunitas]?",
        contoh_asli: "Buka IG: healing. Buka Threads: adu nasib. Emang lo tim mana?",
        provenance: "A",
        slot_list: ["platform A", "kesan A", "platform B", "kesan B", "pertanyaan komunitas"]
      },
      {
        id: "K03-H2",
        card_id: "K03",
        pola_slot: "beli [X], [X-nya] dibuang abangnya [aksi absurd]",
        contoh_asli: "beli martabak manis, coklatnya dibuang abangnya terus diganti kecap asin",
        provenance: "B",
        slot_list: ["X", "aksi absurd"]
      },
      {
        id: "K03-H3",
        card_id: "K03",
        pola_slot: "Gue janji gak bakal [kebiasaan pamer] kalo dikasih [nominal] ya Allah",
        contoh_asli: "Gue janji gak bakal story mobil kalo dikasih 500 milyar ya Allah",
        provenance: "B",
        slot_list: ["kebiasaan pamer", "nominal"]
      },
      {
        id: "K03-H4",
        card_id: "K03",
        pola_slot: "Buka IG: [suasana A]. Buka Threads: [suasana B]. Emang lo tim mana?",
        contoh_asli: "Buka IG: healing. Buka Threads: adu nasib. Emang lo tim mana?",
        provenance: "C",
        slot_list: ["suasana A", "suasana B"]
      }
    ],
    status: "approved"
  },
  {
    id: "K04",
    niche: "Curhat/Storytelling",
    mode: "umum",
    format: "Utas berseri 3-8 post; drama RT, kantor, rumah tangga.",
    struktur: "hook (waktu + konflik + emosi) -> detail -> twist -> pelajaran.",
    emosi: "penasaran, marah, simpati",
    sinyal_algoritma: "dwell time tinggi (dibaca sampai habis)",
    pola_komentar: "memberi dukungan atau curhat balik kasus serupa",
    pelajaran: "cliffhanger kronologis. Ceritanya harus pengalaman ASLI user.",
    guardrail: "Wajib cerita nyata atau tandai placeholder jika fiktif",
    provenance: "B",
    hooks: [
      {
        id: "K04-H1",
        card_id: "K04",
        pola_slot: "[Peristiwa mengejutkan], gue [aksi]. Yang gue lakuin selanjutnya bikin [pihak] [reaksi].",
        contoh_asli: "Atasan gue potong gaji sepihak, gue langsung buka laptop. Yang gue lakuin selanjutnya bikin HR shock.",
        provenance: "B",
        slot_list: ["Peristiwa mengejutkan", "aksi", "pihak", "reaksi"]
      },
      {
        id: "K04-H2",
        card_id: "K04",
        pola_slot: "Hari pertama [peran baru], gue [kejadian buruk] sama [pihak]. Besoknya...",
        contoh_asli: "Hari pertama probation, gue gak sengaja tabrak mobil direktur. Besoknya...",
        provenance: "B",
        slot_list: ["peran baru", "kejadian buruk", "pihak"]
      },
      {
        id: "K04-H3",
        card_id: "K04",
        pola_slot: "[Orang dekat] yang [klaim aneh] tiba-tiba [aksi tak terduga]",
        contoh_asli: "Sepupu yang ngaku paling miskin tiba-tiba beli rumah cash di komplek gue.",
        provenance: "B",
        slot_list: ["Orang dekat", "klaim aneh", "aksi tak terduga"]
      },
      {
        id: "K04-H4",
        card_id: "K04",
        pola_slot: "Jam [waktu], [orang] chat '[kalimat lucu]' setelah gue [tindakan]. Gue ngakak tapi...",
        contoh_asli: "Jam 2 pagi, mantan chat 'masih ingat bakso pak de?' setelah 4 tahun putus. Gue ngakak tapi mikir...",
        provenance: "C",
        slot_list: ["waktu", "orang", "kalimat lucu", "tindakan"]
      }
    ],
    status: "approved"
  },
  {
    id: "K05",
    niche: "Bisnis & UMKM",
    mode: "umum",
    format: "Behind the scene omzet; kesalahan pemula; tips jualan di Threads.",
    struktur: "hook omzet/rugi -> 3-5 langkah -> 1 foto produk/proses -> CTA diskusi.",
    emosi: "penasaran, semangat, FOMO",
    sinyal_algoritma: "save & share ke teman UMKM",
    pola_komentar: "bertanya supplier, margin, atau kendala operasional",
    pelajaran: "transparansi angka asli; jangan langsung jualan di post 1",
    guardrail: "Dilarang memalsukan nominal omzet/profit",
    provenance: "B",
    hooks: [
      {
        id: "K05-H1",
        card_id: "K05",
        pola_slot: "[Masalah channel lama] [durasi]. Pindah ke [channel baru], [hasil pertama] dari 1 [aksi] ini:",
        contoh_asli: "Iklan TikTok boncos 2 bulan. Pindah ke Threads organik, closing 12 juta dari 1 utas cerita ini:",
        provenance: "B",
        slot_list: ["Masalah channel lama", "durasi", "channel baru", "hasil pertama", "aksi"]
      },
      {
        id: "K05-H2",
        card_id: "K05",
        pola_slot: "Kesalahan fatal [pelaku] di Threads: [kesalahan]. Algoritma benci ini.",
        contoh_asli: "Kesalahan fatal seller pemula di Threads: posting foto katalog tanpa cerita. Algoritma benci ini.",
        provenance: "B",
        slot_list: ["pelaku", "kesalahan"]
      },
      {
        id: "K05-H3",
        card_id: "K05",
        pola_slot: "Gue rugi [nominal] karena ikut [tren]. Ini [N] pelajaran mahal:",
        contoh_asli: "Gue rugi 25 juta karena FOMO jualan hampers. Ini 3 pelajaran mahal buat UMKM:",
        provenance: "B",
        slot_list: ["nominal", "tren", "N"]
      },
      {
        id: "K05-H4",
        card_id: "K05",
        pola_slot: "Jualan [produk] sepi [durasi], gue coba [pendekatan cerita], bukan katalog. Hari ini laku [jumlah].",
        contoh_asli: "Jualan kue bolu sepi 3 minggu, gue coba cerita perjuangan resep ibu, bukan katalog. Hari ini laku 45 box.",
        provenance: "C",
        slot_list: ["produk", "durasi", "pendekatan cerita", "jumlah"]
      }
    ],
    status: "approved"
  },
  {
    id: "K06",
    niche: "Teknologi",
    mode: "umum",
    format: "Hot take AI/tool; perbandingan; rangkuman update praktis.",
    struktur: "'Unpopular opinion' -> 3 poin pro-kontra -> rekomendasi solutif.",
    emosi: "penasaran, debat, pencerahan",
    sinyal_algoritma: "debat di reply = reply depth melonjak",
    pola_komentar: "adu argumen tool favorit masing-masing",
    pelajaran: "argumen kuat tanpa menjatuhkan individu",
    guardrail: "Bukan promosi berafiliasi tersembunyi",
    provenance: "B",
    hooks: [
      {
        id: "K06-H1",
        card_id: "K06",
        pola_slot: "Hot take: [tool populer] itu overrated buat [segmen]. Pakai ini aja:",
        contoh_asli: "Hot take: ChatGPT Plus itu overrated buat freelancer nulis biasa. Pakai combo gratis ini aja:",
        provenance: "B",
        slot_list: ["tool populer", "segmen"]
      },
      {
        id: "K06-H2",
        card_id: "K06",
        pola_slot: "Gue coba [N] [tool] buat [tugas], cuma [n] yang [kualitas]. Rangkuman jujurnya:",
        contoh_asli: "Gue coba 14 tool AI buat bikin video presentasi, cuma 2 yang beneran layak pakai. Rangkuman jujurnya:",
        provenance: "B",
        slot_list: ["N", "tool", "tugas", "n", "kualitas"]
      },
      {
        id: "K06-H3",
        card_id: "K06",
        pola_slot: "Stop langganan [tool berbayar] kalau cuma buat [kebutuhan]. Ada yang gratis dan lebih cepat.",
        contoh_asli: "Stop langganan Canva Pro kalau cuma buat hapus background foto produk...",
        provenance: "B",
        slot_list: ["tool berbayar", "kebutuhan"]
      },
      {
        id: "K06-H4",
        card_id: "K06",
        pola_slot: "[Tool berbayar] yang lo bayar [harga] itu bisa diganti [n] tool gratis ini. Bedanya tipis.",
        contoh_asli: "Photoshop yang lo bayar 300rb/bulan itu bisa diganti 2 tool open-source ini. Bedanya tipis.",
        provenance: "C",
        slot_list: ["Tool berbayar", "harga", "n"]
      }
    ],
    status: "approved"
  },
  {
    id: "K07",
    niche: "Kesehatan Mental",
    mode: "umum",
    format: "Pertanyaan terbuka validasi; self-check; cerita terapi/recovery.",
    struktur: "hook 'pernah ngerasa...?' -> 4-5 poin -> ajakan cerita hangat.",
    emosi: "relate, lega, aman, didengarkan",
    sinyal_algoritma: "reply panjang & curhat mendalam (conversation depth)",
    pola_komentar: "pengakuan kelelahan mental yang selama ini ditahan",
    pelajaran: "ruang aman tanpa menghakimi atau mengklaim menyembuhkan",
    guardrail: "Tanpa diagnosis medis / psikologis definitif; sarankan profesional jika ada indikasi krisis",
    provenance: "B",
    hooks: [
      {
        id: "K07-H1",
        card_id: "K07",
        pola_slot: "Lo ngerasa [gejala umum] tapi gak tau kenapa? Coba cek [N] tanda [kondisi halus] ini:",
        contoh_asli: "Lo ngerasa capek terus padahal tidur 8 jam? Coba cek 4 tanda burnout emosional ini:",
        provenance: "B",
        slot_list: ["gejala umum", "N", "kondisi halus"]
      },
      {
        id: "K07-H2",
        card_id: "K07",
        pola_slot: "Bukan lo [label negatif], lo lagi [kondisi sebenarnya]. Bedanya gini:",
        contoh_asli: "Bukan lo pemalas, lo lagi kewalahan sensorik dan nervous system crash. Bedanya gini:",
        provenance: "B",
        slot_list: ["label negatif", "kondisi sebenarnya"]
      },
      {
        id: "K07-H3",
        card_id: "K07",
        pola_slot: "Pertanyaan yang sering gue tanya ke [profesional] pas [situasi malam]:",
        contoh_asli: "Pertanyaan yang dulu sering gue tanyakan ke psikolog pas overthinking jam 1 dini hari:",
        provenance: "B",
        slot_list: ["profesional", "situasi malam"]
      },
      {
        id: "K07-H4",
        card_id: "K07",
        pola_slot: "Akhir-akhir ini lo capek mental atau capek fisik? Gue baru sadar bedanya jauh.",
        contoh_asli: "Akhir-akhir ini lo capek mental atau capek fisik? Gue baru sadar bedanya jauh.",
        provenance: "C",
        slot_list: []
      }
    ],
    status: "approved"
  },
  {
    id: "K08",
    niche: "Parenting",
    mode: "umum",
    format: "Chat suami-istri, momen anak; 1-3 foto/screenshot + caption 1-2 kalimat.",
    struktur: "1 caption dialog lucu/hangat -> foto pendukung -> refleksi pendek.",
    emosi: "gemas, ngakak, relate, haru",
    sinyal_algoritma: "share ke grup keluarga / pasangan; like tinggi",
    pola_komentar: "cerita tingkah anak atau pasangan sendiri",
    pelajaran: "kejujuran dinamika rumah tangga Indonesia, bukan gaya selebgram",
    guardrail: "Jaga privasi identitas anak (tutupi seragam/sekolah jika ada)",
    provenance: "A",
    hooks: [
      {
        id: "K08-H1",
        card_id: "K08",
        pola_slot: "Udah nikah, sekarang [status baru] mereka",
        contoh_asli: "Udah nikah 5 tahun, sekarang definisi malam minggu kita:",
        provenance: "A",
        slot_list: ["status baru"]
      },
      {
        id: "K08-H2",
        card_id: "K08",
        pola_slot: "[Pasangan]: '[kalimat polos]' Gue: '[balasan lucu]' ...",
        contoh_asli: "Suami: 'Aku beli kemeja baru' Gue: 'Bagusan yang kemarin' Suami: 'Ini kemeja kemarin tapi baru dicuci'",
        provenance: "B",
        slot_list: ["Pasangan", "kalimat polos", "balasan lucu"]
      },
      {
        id: "K08-H3",
        card_id: "K08",
        pola_slot: "Dikira [situasi tenang], ternyata dia...",
        contoh_asli: "Dikira kamar sepi dia lagi bobo pules, pas dicek ternyata lagi bedak-an pakai tepung terigu...",
        provenance: "B",
        slot_list: ["situasi tenang"]
      },
      {
        id: "K08-H4",
        card_id: "K08",
        pola_slot: "[Pasangan] transfer [nominal] '[kalimat]' setelah gue tanya [barang]. [Klaim lucu].",
        contoh_asli: "Paksu transfer 200rb 'buat jajan cimol' setelah gue iseng nanya skincare habis. Mau nangis apa ketawa.",
        provenance: "A",
        slot_list: ["Pasangan", "nominal", "kalimat", "barang", "Klaim lucu"]
      }
    ],
    status: "approved"
  },
  {
    id: "K09",
    niche: "Hub: Ilmu Praktis",
    mode: "hub",
    format: "Thread 3-4 post micro-learning 5 menit; 1 rumus + contoh; myth-busting.",
    struktur: "hook hasil+waktu -> 2-3 poin daging -> 1 contoh real -> CTA tanya.",
    emosi: "penasaran, 'wah baru tau', tercerahkan",
    sinyal_algoritma: "save & share tinggi",
    pola_komentar: "bertanya penerapan kasus di kantor/bisnis sendiri",
    pelajaran: "harus bisa dipraktekkan dalam waktu 2 menit",
    guardrail: "Hindari istilah teori tanpa analogi sederhana",
    provenance: "B",
    hooks: [
      {
        id: "K09-H1",
        card_id: "K09",
        pola_slot: "Ilmu 5 menit: kenapa [fenomena sehari-hari]? Ini penjelasan sainsnya ([bukan nasihat klise]):",
        contoh_asli: "Ilmu 5 menit: kenapa otak lo mendadak males pas mau mulai nulis? Ini penjelasan sainsnya (tanpa omong kosong motivasi):",
        provenance: "B",
        slot_list: ["fenomena sehari-hari", "bukan nasihat klise"]
      },
      {
        id: "K09-H2",
        card_id: "K09",
        pola_slot: "[Rumus] yang gue pakai buat [hasil], padahal [kondisi awal kecil]:",
        contoh_asli: "Rumus 1-1-1 yang gue pakai buat dapat 5 klien pertama, padahal portofolio masih nol:",
        provenance: "B",
        slot_list: ["Rumus", "hasil", "kondisi awal kecil"]
      },
      {
        id: "K09-H3",
        card_id: "K09",
        pola_slot: "Banyak orang salah paham soal '[istilah populer]'. Bukan soal [persepsi umum], tapi ini:",
        contoh_asli: "Banyak orang salah paham soal 'Personal Branding'. Bukan soal pamer sertifikat, tapi ini:",
        provenance: "B",
        slot_list: ["istilah populer", "persepsi umum"]
      },
      {
        id: "K09-H4",
        card_id: "K09",
        pola_slot: "Cara otak nyimpen [hal] bikin lo [akibat]",
        contoh_asli: "Cara otak nyimpen to-do list bikin lo susah tidur malam. Ini trik 2 menitnya:",
        provenance: "C",
        slot_list: ["hal", "akibat"]
      },
      {
        id: "K09-H5",
        card_id: "K09",
        pola_slot: "Ilmu 5 menit: [masalah], coba rumus [nama rumus] ini:",
        contoh_asli: "Ilmu 5 menit: bingung nentuin harga jasa freelance, coba rumus 3-Tier ini:",
        provenance: "C",
        slot_list: ["masalah", "nama rumus"]
      }
    ],
    status: "approved"
  },
  {
    id: "K10",
    niche: "Hub: Peluang",
    mode: "hub",
    format: "List 3-5 peluang (gaji/modal/skill), screenshot loker/chat klien jujur.",
    struktur: "jumlah + 'tanpa modal/remote' -> list + syarat jujur -> link di reply ke-2.",
    emosi: "FOMO, semangat, optimis",
    sinyal_algoritma: "save & share ke teman sesama pencari kerja/freelance",
    pola_komentar: "menanyakan syarat detail dan mendoakan",
    pelajaran: "transparansi gaji/fee = reply banyak. Wajib peluang nyata.",
    guardrail: "Syarat jujur, tanpa janji penghasilan muluk-muluk; ingatkan user memverifikasi",
    provenance: "B",
    hooks: [
      {
        id: "K10-H1",
        card_id: "K10",
        pola_slot: "[N] side hustle yang gue liat [komunitas] laku keras bulan ini, modal di bawah [nominal]:",
        contoh_asli: "4 side hustle yang gue liat teman-teman desainer laku keras bulan ini, modal di bawah 500 ribu:",
        provenance: "B",
        slot_list: ["N", "komunitas", "nominal"]
      },
      {
        id: "K10-H2",
        card_id: "K10",
        pola_slot: "Gue kumpulin [N] loker remote yang [syarat longgar], gaji [range]:",
        contoh_asli: "Gue kumpulin 5 loker remote customer support yang boleh tanpa pengalaman, gaji 6-10jt:",
        provenance: "B",
        slot_list: ["N", "syarat longgar", "range"]
      },
      {
        id: "K10-H3",
        card_id: "K10",
        pola_slot: "Butuh [portofolio pertama]? [N] [pelaku] lagi cari bantuan [skema]:",
        contoh_asli: "Butuh portofolio copywriting pertama? 3 UMKM rekanan lagi cari bantuan barter review produk:",
        provenance: "B",
        slot_list: ["portofolio pertama", "N", "pelaku", "skema"]
      },
      {
        id: "K10-H4",
        card_id: "K10",
        pola_slot: "[N] job freelance yang nerima pemula, bayarannya [range] per job:",
        contoh_asli: "3 job freelance voice-over yang nerima pemula modal HP, bayarannya 150-350rb per menit:",
        provenance: "C",
        slot_list: ["N", "range"]
      },
      {
        id: "K10-H5",
        card_id: "K10",
        pola_slot: "Gue cari [n] orang buat collab: [peran]. Project kecil, fee jelas, buat [output] bareng:",
        contoh_asli: "Gue cari 2 orang buat collab: 1 video editor & 1 scriptwriter. Project santai, fee jelas, buat konten YouTube bareng:",
        provenance: "C",
        slot_list: ["n", "peran", "output"]
      }
    ],
    status: "approved"
  },
  {
    id: "K11",
    niche: "Hub: Panggung Warga",
    mode: "hub",
    format: "Utas lapak mingguan; spotlight 1 warga; before-after bisnis.",
    struktur: "hook ajakan kolektif/hari khusus -> aturan main + format wajib -> contoh promo bagus vs jelek -> kurasi di reply.",
    emosi: "rasa memiliki, komunitas, didukung",
    sinyal_algoritma: "reply depth masif (promotor dan penanya saling ngobrol)",
    pola_komentar: "drop link jualan sesuai format wajib dan saling apresiasi",
    pelajaran: "format wajib 'Bantu siapa - Hasil apa - Mulai Rp...'; kurasi min 3 warga; user wajib balas minimal 10 reply",
    guardrail: "Hanya untuk akun & hasil nyata dengan izin; jangan jadi spam lapak tak terarah",
    provenance: "B",
    hooks: [
      {
        id: "K11-H1",
        card_id: "K11",
        pola_slot: "[HARI] LAPAK WARGA - Drop 1 [jasa/produk] lo di reply, format: [format]. Gue review [n] paling jelas.",
        contoh_asli: "JUMAT LAPAK WARGA - Drop 1 jasa freelance lo di reply, format: Bantu Siapa - Hasil Apa - Mulai Rp. Gue review 5 paling menarik!",
        provenance: "B",
        slot_list: ["HARI", "jasa/produk", "format", "n"]
      },
      {
        id: "K11-H2",
        card_id: "K11",
        pola_slot: "SPOTLIGHT WARGA: [akun] jualan [produk]. Gue bedah strateginya:",
        contoh_asli: "SPOTLIGHT WARGA: @kopi_masbudi jualan kopi keliling modal gerobak. Gue bedah gimana dia dapat 80 cup/hari:",
        provenance: "B",
        slot_list: ["akun", "produk"]
      },
      {
        id: "K11-H3",
        card_id: "K11",
        pola_slot: "Gue punya [n] slot shoutout gratis minggu ini buat warga yang jualan [kategori]. Syaratnya cuma 1:",
        contoh_asli: "Gue punya 3 slot shoutout gratis minggu ini buat teman-teman UMKM kuliner rumahan. Syaratnya cuma 1:",
        provenance: "B",
        slot_list: ["n", "kategori"]
      },
      {
        id: "K11-H4",
        card_id: "K11",
        pola_slot: "[n] minggu lalu dia drop jasa di lapak, hari ini closing [n] klien. Apa yang dia ubah?",
        contoh_asli: "2 minggu lalu dia drop jasa admin olshop di lapak, hari ini closing 3 klien tetap. Apa yang dia ubah?",
        provenance: "C",
        slot_list: ["n"]
      }
    ],
    status: "approved"
  },
  {
    id: "K12",
    niche: "Hub: Soft-selling Produk Digital",
    mode: "hub",
    format: "Cerita di balik produk; breakdown isi; testimoni warga (bukan puji diri sendiri).",
    struktur: "(Rule 80/20) masalah pribadi -> solusi yang dibuat -> spill 2-3 isi -> testimoni warga -> link di reply ke-2 + opsi lite gratis.",
    emosi: "relate, penasaran, trust, lega",
    sinyal_algoritma: "profile visit + follow naik",
    pola_komentar: "minta link atau bertanya kompatibilitas file",
    pelajaran: "tanpa link di post 1, tanpa ajakan bait 'komen EBOOK nanti dikirim DM'",
    guardrail: "Link HANYA di reply ke-2. Jangan gunakan engagement bait berisiko penal downrank",
    provenance: "B",
    hooks: [
      {
        id: "K12-H1",
        card_id: "K12",
        pola_slot: "Awalnya bikin [produk] ini buat [masalah pribadi]. Abis gue share di Threads, [hasil nyata]. Spill isinya:",
        contoh_asli: "Awalnya bikin template notion ini cuma buat beresin catatan kuliah yang berantakan. Abis gue share, dipakai 300+ orang. Ini isinya:",
        provenance: "B",
        slot_list: ["produk", "masalah pribadi", "hasil nyata"]
      },
      {
        id: "K12-H2",
        card_id: "K12",
        pola_slot: "Gue jual [produk] [harga], yang beli [n] orang bulan pertama. Setelah gue ganti 1 hal ini, jadi [n].",
        contoh_asli: "Gue rilis e-book 49rb, yang beli cuma 4 orang. Setelah gue ganti judul & studi kasus aslinya, bulan ini tembus 82 pembeli.",
        provenance: "B",
        slot_list: ["produk", "harga", "n"]
      },
      {
        id: "K12-H3",
        card_id: "K12",
        pola_slot: "Bukan mau jualan, tapi banyak yang DM minta [file]. Jadi gue rapihin dan taruh di sini:",
        contoh_asli: "Bukan mau jualan, tapi tiap minggu ada aja yang DM minta rumus hitung HPP makanan. Jadi gue rapihin dan taruh di link bawah:",
        provenance: "B",
        slot_list: ["file"]
      },
      {
        id: "K12-H4",
        card_id: "K12",
        pola_slot: "Gue rugi [nominal] karena [masalah], jadi gue bikin [produk] ini.",
        contoh_asli: "Gue rugi 15 juta karena salah kontrak freelance, jadi gue susun template SOP anti-klien kabur ini.",
        provenance: "C",
        slot_list: ["nominal", "masalah", "produk"]
      },
      {
        id: "K12-H5",
        card_id: "K12",
        pola_slot: "Gue bikin checklist [n] hari buat yang mau mulai [tujuan]. File-nya di sini, gratis:",
        contoh_asli: "Gue bikin checklist 7 hari buat yang mau mulai buka jasa jastip. File template-nya gratis di reply bawah:",
        provenance: "C",
        slot_list: ["n", "tujuan"]
      }
    ],
    status: "approved"
  }
];

export const ALGORITHM_RULES: AlgorithmRule[] = [
  {
    id: "RULE-R01",
    title: "Feed Diranking Nilai Nilai Personal",
    description: "Algoritma memprediksi value per orang secara individual; tidak ada satu trik universal untuk semua audiens.",
    confidence: "R",
    category: "resmi"
  },
  {
    id: "RULE-R02",
    title: "Prioritas Following Feed",
    description: "Ranking diseimbangkan ke arah akun yang di-follow, jadi follower aktif = jangkauan stabil berulang.",
    confidence: "R",
    category: "resmi"
  },
  {
    id: "RULE-R03",
    title: "Penalti Engagement Bait",
    description: "Post dengan ajakan paksa seperti 'Komen MAU nanti gue kirim link di DM' atau 'Like kalau setuju' diturunkan jangkauannya secara agresif.",
    confidence: "R",
    category: "penalti"
  },
  {
    id: "RULE-R04",
    title: "Topic Tag Tunggal & Spesifik",
    description: "Topic tag berfungsi sebagai routing minat topik; gunakan TEPAT 1 tag spesifik tanpa tanda pagar (#). Jangan gunakan banyak tag atau hashtag.",
    confidence: "R",
    category: "resmi"
  },
  {
    id: "RULE-P01",
    title: "Reply = Sinyal Algoritma Utama",
    description: "Reply bernilai jauh lebih tinggi daripada sekadar like. Membalas komentar sama berharganya dengan membuat post baru.",
    confidence: "P",
    category: "praktisi"
  },
  {
    id: "RULE-P02",
    title: "Velocity 30-60 Menit Pertama",
    description: "Kecepatan reply dan interaksi pada 30-60 menit awal menentukan apakah post akan didistribusikan ke For You feed yang lebih luas.",
    confidence: "P",
    category: "praktisi"
  },
  {
    id: "RULE-P03",
    title: "Formula Rasio Reply-to-Like (>0,15)",
    description: "Patokan praktisi: rasio reply terhadap like di atas 0,15 (15%) menandakan percakapan berkualitas dan disukai algoritma.",
    confidence: "P",
    category: "praktisi"
  },
  {
    id: "RULE-P04",
    title: "Reply Depth Sangat Bernilai",
    description: "Percakapan bercabang (balasan di dalam balasan antara pengguna) mengirim sinyal komunitas aktif yang kuat.",
    confidence: "P",
    category: "praktisi"
  },
  {
    id: "RULE-P05",
    title: "Visual Low-Effort Jujur",
    description: "Screenshot, foto asli, atau carousel slide sederhana mengungguli desain poster studio estetik di ekosistem Threads Indonesia.",
    confidence: "P",
    category: "praktisi"
  },
  {
    id: "RULE-H01",
    title: "Link Keluar di Reply ke-2",
    description: "Hipotesis kuat: menaruh link keluar langsung di post utama menurunkan jangkauan. Letakkan link di reply ke-2.",
    confidence: "H",
    category: "hipotesis"
  },
  {
    id: "RULE-H02",
    title: "Dwell Time & Profile Visit",
    description: "Membaca utas hingga tuntas dan kunjungan profil yang berujung follow memperkuat skor akun di mata sistem.",
    confidence: "H",
    category: "hipotesis"
  },
  {
    id: "RULE-H03",
    title: "Watermark Repost Ditekan",
    description: "Konten dengan watermark TikTok/Reels atau konten daur ulang mentah cenderung dibatasi distribusinya.",
    confidence: "H",
    category: "penalti"
  }
];

export const PROVENANCE_LABELS: Record<string, { label: string; desc: string; badgeClass: string }> = {
  A: {
    label: "Ulasan Viral (A)",
    desc: "Klaim viral + angka likes dari ulasan Meta AI (belum diverifikasi independen).",
    badgeClass: "bg-amber-500/10 text-amber-400 border border-amber-500/20"
  },
  B: {
    label: "Pola Teruji (B)",
    desc: "Klaim berhasil 'works' tanpa angka dari ulasan referensi.",
    badgeClass: "bg-blue-500/10 text-blue-400 border border-blue-500/20"
  },
  C: {
    label: "Hipotetis (C)",
    desc: "Pola hipotetis terstruktur menurut referensi.",
    badgeClass: "bg-purple-500/10 text-purple-400 border border-purple-500/20"
  },
  D: {
    label: "Pencarian Threads (D)",
    desc: "Ditemukan dari peringkat pencarian Threads, tanpa angka engagement pasti.",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
  },
  E: {
    label: "Terbukti di Akunmu (E)",
    desc: "Terbukti di akun user lewat data Insights & Tracker Metrik.",
    badgeClass: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
  }
};
