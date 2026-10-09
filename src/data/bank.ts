/**
 * AutoThreads Bank Referensi Terstruktur
 * Sumber: Ulasan Meta AI & Riset Pola Threads Indonesia
 * Dilengkapi distribusi berimbang provenance A, B, C, D, dan E bawaan di 12 niche
 * Ekspansi v2: +6 hook per kartu (H7-H12), +12 kartu niche baru (K13-K24), +17 aturan algoritma.
 * Catatan: semua data ekspansi berprovenance "C" (hipotetis) sampai diverifikasi data riil (naikkan ke D/E).
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
    provenance: "A",
    hooks: [
      {
        id: "K01-H1",
        card_id: "K01",
        pola_slot: "[Kondisi angka] tapi [hasil berlawanan]. Setelah [tindakan audit], ini [N] [penyebab]:",
        contoh_asli: "Gaji 8 juta tapi akhir bulan selalu minus (4.2k likes). Setelah gue audit 3 bulan, ini 3 bocor halusnya:",
        provenance: "A",
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
        pola_slot: "Cari keyword '[keyword finansial]' di Threads: banyak yang bingung [isu]. Ini solusinya:",
        contoh_asli: "Cari keyword 'dana darurat' di Threads: ternyata 80% orang salah tempat nyimpennya. Ini rekomendasi aman:",
        provenance: "D",
        slot_list: ["keyword finansial", "isu"]
      },
      {
        id: "K01-H6",
        card_id: "K01",
        pola_slot: "Berdasarkan evaluasi pengeluaran pribadi [periode], formula [rasio] ini yang paling tahan banting:",
        contoh_asli: "Berdasarkan riwayat mutasi pribadi 6 bulan terakhir, rasio 50-30-20 ini yang paling realistis buat karyawan Jakarta:",
        provenance: "E",
        slot_list: ["periode", "rasio"]
      },
      {
        id: "K01-H7",
        card_id: "K01",
        pola_slot: "[N] pengeluaran yang kelihatan kecil tapi diam-diam makan [persen] gaji lo:",
        contoh_asli: "5 pengeluaran yang kelihatan kecil tapi diam-diam makan 20% gaji lo:",
        provenance: "C",
        slot_list: ["N", "persen"]
      },
      {
        id: "K01-H8",
        card_id: "K01",
        pola_slot: "Bedanya orang gaji [angka] yang [hasil A] vs yang [hasil B] ternyata cuma di [kebiasaan]:",
        contoh_asli: "Bedanya orang gaji 6 juta yang bisa nabung vs yang selalu minus ternyata cuma di urutan transfer pas gajian:",
        provenance: "C",
        slot_list: ["angka", "hasil A", "hasil B", "kebiasaan"]
      },
      {
        id: "K01-H9",
        card_id: "K01",
        pola_slot: "Pertanyaan jujur: kalau [kejadian darurat] besok, dana lo cukup buat [durasi]?",
        contoh_asli: "Pertanyaan jujur: kalau besok kena PHK, dana lo cukup buat bertahan berapa bulan? Ini cara ngitung minimalnya:",
        provenance: "C",
        slot_list: ["kejadian darurat", "durasi"]
      },
      {
        id: "K01-H10",
        card_id: "K01",
        pola_slot: "Simulasi: [nominal] per [periode] selama [durasi] jadinya [hasil]. Ini hitungan kasarnya:",
        contoh_asli: "Simulasi: nyisihin 300 ribu per minggu selama 2 tahun jadinya sekitar 31 juta (belum termasuk bunga). Ini hitungan kasarnya:",
        provenance: "C",
        slot_list: ["nominal", "periode", "durasi", "hasil"]
      },
      {
        id: "K01-H11",
        card_id: "K01",
        pola_slot: "Mitos [topik finansial] yang masih dipercaya banyak orang: [mitos]. Faktanya:",
        contoh_asli: "Mitos paylater yang masih dipercaya banyak orang: 'cicilan 0% berarti gratis'. Faktanya:",
        provenance: "C",
        slot_list: ["topik finansial", "mitos"]
      },
      {
        id: "K01-H12",
        card_id: "K01",
        pola_slot: "Checklist [momen] biar [akibat buruk] gak keulang:",
        contoh_asli: "Checklist H-1 gajian biar 'tanggal tua' gak keulang tiap bulan:",
        provenance: "C",
        slot_list: ["momen", "akibat buruk"]
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
    provenance: "A",
    hooks: [
      {
        id: "K02-H1",
        card_id: "K02",
        pola_slot: "Umur [usia], gue berhenti melakukan [N] hal ini dan hidup gue jauh lebih [hasil]:",
        contoh_asli: "Umur 26, gue berhenti melakukan 5 hal ini dan hidup gue jauh lebih tenang (5.8k likes, 800 shares):",
        provenance: "A",
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
      },
      {
        id: "K02-H5",
        card_id: "K02",
        pola_slot: "Ketikan trending di Threads soal '[frase kebiasaan]': ternyata banyak yang terjebak di sini:",
        contoh_asli: "Ketikan trending di Threads soal 'burnout produktif': banyak yang ngira lelah itu prestasi. Ini cara remnya:",
        provenance: "D",
        slot_list: ["frase kebiasaan"]
      },
      {
        id: "K02-H6",
        card_id: "K02",
        pola_slot: "Catatan kebiasaan [durasi] di jurnal harian gue: satu perubahan kecil ini naikin fokus 2x lipat:",
        contoh_asli: "Catatan kebiasaan 90 hari di tracker harian gue: matiin notifikasi grup jam 8 malam bikin tidur nyenyak:",
        provenance: "E",
        slot_list: ["durasi"]
      },
      {
        id: "K02-H7",
        card_id: "K02",
        pola_slot: "Gue berhenti [kebiasaan] selama [durasi]. Yang berubah ternyata bukan [ekspektasi], tapi [hasil tak terduga]:",
        contoh_asli: "Gue berhenti scroll HP sebelum tidur selama 21 hari. Yang berubah ternyata bukan jam tidur, tapi mood pagi:",
        provenance: "C",
        slot_list: ["kebiasaan", "durasi", "ekspektasi", "hasil tak terduga"]
      },
      {
        id: "K02-H8",
        card_id: "K02",
        pola_slot: "Lo gak malas. Lo cuma [penyebab sebenarnya]. Coba [solusi kecil]:",
        contoh_asli: "Lo gak malas. Lo cuma kebanyakan keputusan kecil dari pagi. Coba siapin 3 hal ini malam sebelumnya:",
        provenance: "C",
        slot_list: ["penyebab sebenarnya", "solusi kecil"]
      },
      {
        id: "K02-H9",
        card_id: "K02",
        pola_slot: "[N] kebiasaan kecil yang kalau dilakuin [frekuensi] efeknya kerasa dalam [durasi]:",
        contoh_asli: "4 kebiasaan kecil yang kalau dilakuin tiap hari efeknya kerasa dalam sebulan:",
        provenance: "C",
        slot_list: ["N", "frekuensi", "durasi"]
      },
      {
        id: "K02-H10",
        card_id: "K02",
        pola_slot: "Versi diri gue [periode] lalu bakal [reaksi] kalau lihat [kondisi sekarang]. Ini yang gue ubah pelan-pelan:",
        contoh_asli: "Versi diri gue 2 tahun lalu bakal kaget kalau lihat gue sekarang bangun jam 5. Ini yang gue ubah pelan-pelan:",
        provenance: "C",
        slot_list: ["periode", "reaksi", "kondisi sekarang"]
      },
      {
        id: "K02-H11",
        card_id: "K02",
        pola_slot: "Aturan [angka] menit buat [masalah]: [cara singkat].",
        contoh_asli: "Aturan 2 menit buat yang suka nunda: kalau bisa kelar di bawah 2 menit, kerjain sekarang juga.",
        provenance: "C",
        slot_list: ["angka", "masalah", "cara singkat"]
      },
      {
        id: "K02-H12",
        card_id: "K02",
        pola_slot: "Yang jarang dibahas soal [topik produktivitas]: [sisi gelap].",
        contoh_asli: "Yang jarang dibahas soal bangun pagi: kalau tidurnya kurang, produktivitasnya cuma ilusi.",
        provenance: "C",
        slot_list: ["topik produktivitas", "sisi gelap"]
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
        contoh_asli: "Buka IG: healing. Buka Threads: adu nasib. Emang lo tim mana? (8.1k likes, 1.2k replies)",
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
        contoh_asli: "Buka IG: estetik kafe. Buka Threads: panik tanggal tua. Emang lo tim mana?",
        provenance: "C",
        slot_list: ["suasana A", "suasana B"]
      },
      {
        id: "K03-H5",
        card_id: "K03",
        pola_slot: "Meme Threads hari ini yang lewat search feed: '[lelucon singkat]'. Valid gak?",
        contoh_asli: "Meme Threads hari ini yang lewat search feed: 'Gajian cuma numpang bayar cicilan paylater'. Valid banget gak sih?",
        provenance: "D",
        slot_list: ["lelucon singkat"]
      },
      {
        id: "K03-H6",
        card_id: "K03",
        pola_slot: "Momen absurd nyata minggu ini di hidup gue: [kejadian]. Siapa yang pernah ngalamin?",
        contoh_asli: "Momen absurd nyata minggu ini di hidup gue: udah siap berangkat kerja rapi, ternyata hari libur nasional. Nangis di motor.",
        provenance: "E",
        slot_list: ["kejadian"]
      },
      {
        id: "K03-H7",
        card_id: "K03",
        pola_slot: "Tipe-tipe orang pas [situasi umum]. Lo nomor berapa?",
        contoh_asli: "Tipe-tipe orang pas grup WA keluarga mulai bahas politik. Lo nomor berapa?",
        provenance: "C",
        slot_list: ["situasi umum"]
      },
      {
        id: "K03-H8",
        card_id: "K03",
        pola_slot: "Gue: [rencana ideal]. Juga gue [waktu]: [kenyataan].",
        contoh_asli: "Gue: mulai besok hidup sehat. Juga gue jam 11 malem: pesen martabak manis keju.",
        provenance: "C",
        slot_list: ["rencana ideal", "waktu", "kenyataan"]
      },
      {
        id: "K03-H9",
        card_id: "K03",
        pola_slot: "Hal yang cuma dimengerti [kelompok orang]:",
        contoh_asli: "Hal yang cuma dimengerti anak kos pas akhir bulan:",
        provenance: "C",
        slot_list: ["kelompok orang"]
      },
      {
        id: "K03-H10",
        card_id: "K03",
        pola_slot: "Plot twist paling [emosi] minggu ini: [kejadian].",
        contoh_asli: "Plot twist paling nyesek minggu ini: udah dandan rapi, meetingnya diundur.",
        provenance: "C",
        slot_list: ["emosi", "kejadian"]
      },
      {
        id: "K03-H11",
        card_id: "K03",
        pola_slot: "Kalau [benda sehari-hari] bisa ngomong, dia bakal bilang: '[kalimat]'",
        contoh_asli: "Kalau charger HP bisa ngomong, dia bakal bilang: 'gue di sini 3 tahun, kok baru dicari pas baterai 1%?'",
        provenance: "C",
        slot_list: ["benda sehari-hari", "kalimat"]
      },
      {
        id: "K03-H12",
        card_id: "K03",
        pola_slot: "Red flag [konteks] versi [kelompok]: [contoh].",
        contoh_asli: "Red flag kantor versi karyawan baru: 'di sini kita kayak keluarga'.",
        provenance: "C",
        slot_list: ["konteks", "kelompok", "contoh"]
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
    provenance: "A",
    hooks: [
      {
        id: "K04-H1",
        card_id: "K04",
        pola_slot: "[Peristiwa mengejutkan], gue [aksi]. Yang gue lakuin selanjutnya bikin [pihak] [reaksi].",
        contoh_asli: "Atasan gue potong gaji sepihak, gue langsung buka laptop. Yang gue lakuin selanjutnya bikin HR shock (6.4k likes, 940 replies).",
        provenance: "A",
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
      },
      {
        id: "K04-H5",
        card_id: "K04",
        pola_slot: "Lagi rame di Threads search soal [topik drama]: cerita serupa pernah nimpa gue [waktu lalu].",
        contoh_asli: "Lagi rame di Threads search soal drama pinjam nama KTP: kejadian serupa pernah nimpa gue 2 tahun lalu. Rangkuman pahitnya:",
        provenance: "D",
        slot_list: ["topik drama", "waktu lalu"]
      },
      {
        id: "K04-H6",
        card_id: "K04",
        pola_slot: "Pengalaman paling bikin gemetar di hidup gue sendiri pas [momen]: ini yang gue pelajari.",
        contoh_asli: "Pengalaman paling bikin gemetar di hidup gue sendiri pas resign tanpa tabungan: 3 bulan pertama beneran uji nyali mental.",
        provenance: "E",
        slot_list: ["momen"]
      },
      {
        id: "K04-H7",
        card_id: "K04",
        pola_slot: "[Waktu] lalu gue [titik terendah]. Hari ini [kondisi sekarang]. Ini yang terjadi di antaranya:",
        contoh_asli: "Setahun lalu gue nangis di parkiran kantor. Hari ini gue resign dengan tenang. Ini yang terjadi di antaranya:",
        provenance: "C",
        slot_list: ["Waktu", "titik terendah", "kondisi sekarang"]
      },
      {
        id: "K04-H8",
        card_id: "K04",
        pola_slot: "Gak ada yang tau, tapi [rahasia kecil]. Gue baru berani cerita sekarang.",
        contoh_asli: "Gak ada yang tau, tapi gue pernah 3 bulan pura-pura berangkat kerja padahal udah di-PHK. Gue baru berani cerita sekarang.",
        provenance: "C",
        slot_list: ["rahasia kecil"]
      },
      {
        id: "K04-H9",
        card_id: "K04",
        pola_slot: "Kalimat dari [orang] yang masih gue inget sampai sekarang: '[kalimat]'.",
        contoh_asli: "Kalimat dari almarhum bapak yang masih gue inget sampai sekarang: 'pelan gak apa-apa, asal gak berhenti.'",
        provenance: "C",
        slot_list: ["orang", "kalimat"]
      },
      {
        id: "K04-H10",
        card_id: "K04",
        pola_slot: "Gue pikir [asumsi], ternyata [kenyataan]. Thread pendek soal [topik]:",
        contoh_asli: "Gue pikir pindah kota bakal nyelesain semua masalah, ternyata masalahnya ikut kebawa. Thread pendek soal lari dari diri sendiri:",
        provenance: "C",
        slot_list: ["asumsi", "kenyataan", "topik"]
      },
      {
        id: "K04-H11",
        card_id: "K04",
        pola_slot: "Surat buat diri gue umur [umur]: [pesan].",
        contoh_asli: "Surat buat diri gue umur 20: gak usah buru-buru punya semuanya.",
        provenance: "C",
        slot_list: ["umur", "pesan"]
      },
      {
        id: "K04-H12",
        card_id: "K04",
        pola_slot: "Hari ini [momen kecil] bikin gue sadar [pelajaran].",
        contoh_asli: "Hari ini lihat ibu penjual gorengan ngajarin anaknya PR di sela jualan bikin gue sadar arti capek yang ikhlas.",
        provenance: "C",
        slot_list: ["momen kecil", "pelajaran"]
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
    provenance: "A",
    hooks: [
      {
        id: "K05-H1",
        card_id: "K05",
        pola_slot: "[Masalah channel lama] [durasi]. Pindah ke [channel baru], [hasil pertama] dari 1 [aksi] ini:",
        contoh_asli: "Iklan TikTok boncos 2 bulan. Pindah ke Threads organik, closing 12 juta dari 1 utas cerita ini (3.9k likes, 420 saves):",
        provenance: "A",
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
      },
      {
        id: "K05-H5",
        card_id: "K05",
        pola_slot: "Keyword '[kata kunci bisnis]' lagi naik daun di Threads: ini celah pasar yang belum digarap rapi.",
        contoh_asli: "Keyword 'hampers sehat murah' lagi naik daun di Threads: ini celah pasar yang belum digarap rapi sama kompetitor lokal:",
        provenance: "D",
        slot_list: ["kata kunci bisnis"]
      },
      {
        id: "K05-H6",
        card_id: "K05",
        pola_slot: "Hasil uji coba toko sendiri [periode]: strategi [teknik] ini naikin konversi [persentase]% di Threads.",
        contoh_asli: "Hasil uji coba toko kopi botolan sendiri 30 hari: strategi reply edukasi biji kopi naikin repeat order 45% tanpa bakar iklan.",
        provenance: "E",
        slot_list: ["periode", "teknik", "persentase"]
      },
      {
        id: "K05-H7",
        card_id: "K05",
        pola_slot: "Modal [nominal], jualan [produk], [periode] pertama dapet [hasil]. Kesalahan yang gue sesalin:",
        contoh_asli: "Modal 2 juta, jualan sambal botolan, 3 bulan pertama cuma laku 40 botol. Kesalahan yang gue sesalin:",
        provenance: "C",
        slot_list: ["nominal", "produk", "periode", "hasil"]
      },
      {
        id: "K05-H8",
        card_id: "K05",
        pola_slot: "Pelanggan gak beli karena [alasan umum], tapi karena [alasan sebenarnya].",
        contoh_asli: "Pelanggan gak beli karena harganya murah, tapi karena mereka yakin chat-nya bakal dibales cepat.",
        provenance: "C",
        slot_list: ["alasan umum", "alasan sebenarnya"]
      },
      {
        id: "K05-H9",
        card_id: "K05",
        pola_slot: "Cara ngitung HPP [produk] biar gak [kerugian]:",
        contoh_asli: "Cara ngitung HPP kopi literan biar gak 'rame tapi rugi':",
        provenance: "C",
        slot_list: ["produk", "kerugian"]
      },
      {
        id: "K05-H10",
        card_id: "K05",
        pola_slot: "[N] pertanyaan yang wajib lo jawab sebelum [keputusan bisnis]:",
        contoh_asli: "5 pertanyaan yang wajib lo jawab sebelum buka cabang kedua:",
        provenance: "C",
        slot_list: ["N", "keputusan bisnis"]
      },
      {
        id: "K05-H11",
        card_id: "K05",
        pola_slot: "Komplain pelanggan paling [sifat] yang pernah gue terima, dan gimana itu ngubah [aspek bisnis]:",
        contoh_asli: "Komplain pelanggan paling pedes yang pernah gue terima, dan gimana itu ngubah cara gue packing:",
        provenance: "C",
        slot_list: ["sifat", "aspek bisnis"]
      },
      {
        id: "K05-H12",
        card_id: "K05",
        pola_slot: "Sebelum vs sesudah [perubahan kecil] di [kanal jualan]:",
        contoh_asli: "Sebelum vs sesudah ganti foto produk pakai cahaya jendela di marketplace:",
        provenance: "C",
        slot_list: ["perubahan kecil", "kanal jualan"]
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
    provenance: "A",
    hooks: [
      {
        id: "K06-H1",
        card_id: "K06",
        pola_slot: "Hot take: [tool populer] itu overrated buat [segmen]. Pakai ini aja:",
        contoh_asli: "Hot take: ChatGPT Plus itu overrated buat freelancer nulis biasa (5.1k likes, 750 comments). Pakai combo gratis ini aja:",
        provenance: "A",
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
      },
      {
        id: "K06-H5",
        card_id: "K06",
        pola_slot: "Pencarian topik '[fitur teknologi]' di Threads melonjak minggu ini: ini perbandingan objektifnya.",
        contoh_asli: "Pencarian topik 'Gemini vs Claude 3.5' di Threads melonjak minggu ini: ini perbandingan objektif untuk workflow coding harian.",
        provenance: "D",
        slot_list: ["fitur teknologi"]
      },
      {
        id: "K06-H6",
        card_id: "K06",
        pola_slot: "Alat yang beneran gue pakai kerja tiap hari selama [durasi]: workflow lengkap tanpa ribet.",
        contoh_asli: "Stack teknologi yang beneran gue pakai ngoding & nulis 12 bulan terakhir: hemat 2 jam kerja setiap hari tanpa langganan mahal.",
        provenance: "E",
        slot_list: ["durasi"]
      },
      {
        id: "K06-H7",
        card_id: "K06",
        pola_slot: "Fitur [perangkat/aplikasi] yang jarang dipakai padahal bisa [manfaat]:",
        contoh_asli: "Fitur HP Android yang jarang dipakai padahal bisa hemat baterai seharian:",
        provenance: "C",
        slot_list: ["perangkat/aplikasi", "manfaat"]
      },
      {
        id: "K06-H8",
        card_id: "K06",
        pola_slot: "Prompt AI yang gue pakai buat [tugas], tinggal copy-paste:",
        contoh_asli: "Prompt AI yang gue pakai buat ngerangkum notulen rapat 1 jam jadi 5 poin, tinggal copy-paste:",
        provenance: "C",
        slot_list: ["tugas"]
      },
      {
        id: "K06-H9",
        card_id: "K06",
        pola_slot: "Jangan [aksi teknis umum] sebelum [cek penting]. Ini alasannya:",
        contoh_asli: "Jangan beli laptop second sebelum cek 4 hal ini. Ini alasannya:",
        provenance: "C",
        slot_list: ["aksi teknis umum", "cek penting"]
      },
      {
        id: "K06-H10",
        card_id: "K06",
        pola_slot: "[Tools gratis] vs [tools berbayar] buat [kebutuhan]: mana yang worth it?",
        contoh_asli: "Canva gratis vs Canva Pro buat UMKM: mana yang worth it?",
        provenance: "C",
        slot_list: ["Tools gratis", "tools berbayar", "kebutuhan"]
      },
      {
        id: "K06-H11",
        card_id: "K06",
        pola_slot: "Modus penipuan [kanal] terbaru: [ciri]. Cara ngeceknya:",
        contoh_asli: "Modus penipuan WhatsApp terbaru: kirim file 'undangan.apk'. Cara ngeceknya:",
        provenance: "C",
        slot_list: ["kanal", "ciri"]
      },
      {
        id: "K06-H12",
        card_id: "K06",
        pola_slot: "Setup [perangkat/ruang] gue buat [tujuan], biaya total [nominal]:",
        contoh_asli: "Setup meja kerja gue buat WFH, biaya total di bawah 3 juta:",
        provenance: "C",
        slot_list: ["perangkat/ruang", "tujuan", "nominal"]
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
    provenance: "A",
    hooks: [
      {
        id: "K07-H1",
        card_id: "K07",
        pola_slot: "Lo ngerasa [gejala umum] tapi gak tau kenapa? Coba cek [N] tanda [kondisi halus] ini:",
        contoh_asli: "Lo ngerasa capek terus padahal tidur 8 jam? Coba cek 4 tanda burnout emosional ini (7.3k likes, 1.1k saves):",
        provenance: "A",
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
      },
      {
        id: "K07-H5",
        card_id: "K07",
        pola_slot: "Topik pencarian '[istilah kesehatan mental]' di Threads banyak keliru: ini penjelasan ringkasnya.",
        contoh_asli: "Topik pencarian 'imposter syndrome' di Threads banyak keliru diartikan: ini penjelasan ringkas cara mengatasinya tanpa menyalahkan diri.",
        provenance: "D",
        slot_list: ["istilah kesehatan mental"]
      },
      {
        id: "K07-H6",
        card_id: "K07",
        pola_slot: "Metode regulasi emosi yang beneran ngebantu gue keluar dari fase [kondisi tertekan]:",
        contoh_asli: "Metode regulasi emosi 'grounding 5-4-3-2-1' yang beneran ngebantu gue keluar dari serangan cemas saat presentasi kantor:",
        provenance: "E",
        slot_list: ["kondisi tertekan"]
      },
      {
        id: "K07-H7",
        card_id: "K07",
        pola_slot: "Tanda lo lagi [kondisi], bukan cuma [salah kaprah]:",
        contoh_asli: "Tanda lo lagi burnout, bukan cuma kurang liburan:",
        provenance: "C",
        slot_list: ["kondisi", "salah kaprah"]
      },
      {
        id: "K07-H8",
        card_id: "K07",
        pola_slot: "Hal kecil yang bantu gue waktu [situasi berat]. Bukan solusi, tapi [fungsi]:",
        contoh_asli: "Hal kecil yang bantu gue waktu cemas tengah malam. Bukan solusi, tapi pegangan:",
        provenance: "C",
        slot_list: ["situasi berat", "fungsi"]
      },
      {
        id: "K07-H9",
        card_id: "K07",
        pola_slot: "Kalimat yang sebaiknya gak lo bilang ke orang yang [kondisi], dan gantinya:",
        contoh_asli: "Kalimat yang sebaiknya gak lo bilang ke teman yang lagi berduka, dan gantinya:",
        provenance: "C",
        slot_list: ["kondisi"]
      },
      {
        id: "K07-H10",
        card_id: "K07",
        pola_slot: "Izin buat lo hari ini: [izin].",
        contoh_asli: "Izin buat lo hari ini: gak produktif juga gak apa-apa.",
        provenance: "C",
        slot_list: ["izin"]
      },
      {
        id: "K07-H11",
        card_id: "K07",
        pola_slot: "Gue baru paham [fakta psikologis] setelah [pengalaman].",
        contoh_asli: "Gue baru paham kalau overthinking bisa jadi cara otak cari rasa aman setelah rutin konsultasi ke psikolog.",
        provenance: "C",
        slot_list: ["fakta psikologis", "pengalaman"]
      },
      {
        id: "K07-H12",
        card_id: "K07",
        pola_slot: "Cek-in mingguan: dari skala 1-10, [aspek] lo minggu ini di angka berapa?",
        contoh_asli: "Cek-in mingguan: dari skala 1-10, energi lo minggu ini di angka berapa? Gue jujur: 4.",
        provenance: "C",
        slot_list: ["aspek"]
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
        contoh_asli: "Udah nikah 5 tahun, sekarang definisi malam minggu kita: (9.2k likes, 2.1k shares)",
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
        pola_slot: "Beda gaya parenting zaman [dulu] vs [sekarang] pas anak [tantrum/tingkah]:",
        contoh_asli: "Beda gaya parenting zaman ortu dulu vs kita sekarang pas anak tantrum di mall: ada yang relate?",
        provenance: "C",
        slot_list: ["dulu", "sekarang", "tantrum/tingkah"]
      },
      {
        id: "K08-H5",
        card_id: "K08",
        pola_slot: "Keyword pencarian parenting Threads '[isu anak]': ini solusi yang paling banyak disepakati ibu-ibu.",
        contoh_asli: "Keyword pencarian parenting Threads 'anak susah makan GTM': ini trik finger food santai yang paling disepakati para bunda.",
        provenance: "D",
        slot_list: ["isu anak"]
      },
      {
        id: "K08-H6",
        card_id: "K08",
        pola_slot: "Pola komunikasi rumah tangga yang kita terapin sendiri di rumah: konflik turun drastis.",
        contoh_asli: "Aturan 'cooling down 15 menit tanpa gadget' yang kami terapin sendiri di rumah: perdebatan suami-istri langsung mereda.",
        provenance: "E",
        slot_list: []
      },
      {
        id: "K08-H7",
        card_id: "K08",
        pola_slot: "Anak [usia] [perilaku]? Sebelum [reaksi umum], coba [pendekatan]:",
        contoh_asli: "Anak 3 tahun tantrum di supermarket? Sebelum marah, coba validasi dulu pakai kalimat ini:",
        provenance: "C",
        slot_list: ["usia", "perilaku", "reaksi umum", "pendekatan"]
      },
      {
        id: "K08-H8",
        card_id: "K08",
        pola_slot: "Hal yang gue sesalin sebagai orang tua di [periode] pertama:",
        contoh_asli: "Hal yang gue sesalin sebagai orang tua di 2 tahun pertama:",
        provenance: "C",
        slot_list: ["periode"]
      },
      {
        id: "K08-H9",
        card_id: "K08",
        pola_slot: "Kegiatan [durasi] di rumah tanpa gadget buat anak [usia]:",
        contoh_asli: "Kegiatan 15 menit di rumah tanpa gadget buat anak 4-6 tahun:",
        provenance: "C",
        slot_list: ["durasi", "usia"]
      },
      {
        id: "K08-H10",
        card_id: "K08",
        pola_slot: "Kalimat yang bikin anak mau [aktivitas] tanpa [konflik]:",
        contoh_asli: "Kalimat yang bikin anak mau mandi tanpa drama tiap sore:",
        provenance: "C",
        slot_list: ["aktivitas", "konflik"]
      },
      {
        id: "K08-H11",
        card_id: "K08",
        pola_slot: "Orang tua baru: [N] barang yang ternyata gak perlu dibeli:",
        contoh_asli: "Orang tua baru: 5 barang bayi yang ternyata gak perlu dibeli:",
        provenance: "C",
        slot_list: ["N"]
      },
      {
        id: "K08-H12",
        card_id: "K08",
        pola_slot: "Pembagian tugas [peran] di rumah kami biar [hasil]:",
        contoh_asli: "Pembagian tugas suami-istri di rumah kami biar gak ada yang ngerasa paling capek:",
        provenance: "C",
        slot_list: ["peran", "hasil"]
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
    provenance: "A",
    hooks: [
      {
        id: "K09-H1",
        card_id: "K09",
        pola_slot: "Ilmu 5 menit: kenapa [fenomena sehari-hari]? Ini penjelasan sainsnya ([bukan nasihat klise]):",
        contoh_asli: "Ilmu 5 menit: kenapa otak lo mendadak males pas mau mulai nulis? Ini penjelasan sainsnya (tanpa omong kosong motivasi) (4.7k likes, 890 saves):",
        provenance: "A",
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
        pola_slot: "Pertanyaan paling sering muncul di pencarian Threads soal '[topik skill]': bedah tuntas dalam 3 slide.",
        contoh_asli: "Pertanyaan paling sering muncul di pencarian Threads soal 'cara bikin prompt AI presisi': bedah tuntas dalam 3 slide ringkas.",
        provenance: "D",
        slot_list: ["topik skill"]
      },
      {
        id: "K09-H6",
        card_id: "K09",
        pola_slot: "Kerangka kerja yang sudah terbukti di [bidang kerja sendiri] selama [durasi]: langkah taktisnya.",
        contoh_asli: "Kerangka copywriting micro-learning yang terbukti menaikkan retensi pembaca utas di akun saya hingga 68%:",
        provenance: "E",
        slot_list: ["bidang kerja sendiri", "durasi"]
      },
      {
        id: "K09-H7",
        card_id: "K09",
        pola_slot: "Konsep [istilah] dijelasin pakai analogi [hal sehari-hari]:",
        contoh_asli: "Konsep inflasi dijelasin pakai analogi harga semangkuk bakso:",
        provenance: "C",
        slot_list: ["istilah", "hal sehari-hari"]
      },
      {
        id: "K09-H8",
        card_id: "K09",
        pola_slot: "[N] shortcut [software] yang bikin kerja lo 2x lebih cepat:",
        contoh_asli: "7 shortcut Excel yang bikin kerja lo 2x lebih cepat:",
        provenance: "C",
        slot_list: ["N", "software"]
      },
      {
        id: "K09-H9",
        card_id: "K09",
        pola_slot: "Mitos vs fakta soal [topik]: [N] hal yang ternyata salah kaprah.",
        contoh_asli: "Mitos vs fakta soal belajar bahasa Inggris: 4 hal yang ternyata salah kaprah.",
        provenance: "C",
        slot_list: ["topik", "N"]
      },
      {
        id: "K09-H10",
        card_id: "K09",
        pola_slot: "Cara cepat paham [skill] dalam [waktu], versi orang sibuk:",
        contoh_asli: "Cara cepat paham dasar desain grafis dalam 1 akhir pekan, versi orang sibuk:",
        provenance: "C",
        slot_list: ["skill", "waktu"]
      },
      {
        id: "K09-H11",
        card_id: "K09",
        pola_slot: "Kesalahan pemula di [bidang] yang bikin [akibat], dan cara benarnya:",
        contoh_asli: "Kesalahan pemula di public speaking yang bikin suara gemetar, dan cara benarnya:",
        provenance: "C",
        slot_list: ["bidang", "akibat"]
      },
      {
        id: "K09-H12",
        card_id: "K09",
        pola_slot: "Template [dokumen] yang bisa lo pakai hari ini:",
        contoh_asli: "Template email follow-up lamaran kerja yang bisa lo pakai hari ini:",
        provenance: "C",
        slot_list: ["dokumen"]
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
    provenance: "A",
    hooks: [
      {
        id: "K10-H1",
        card_id: "K10",
        pola_slot: "[N] side hustle yang gue liat [komunitas] laku keras bulan ini, modal di bawah [nominal]:",
        contoh_asli: "4 side hustle yang gue liat teman-teman desainer laku keras bulan ini, modal di bawah 500 ribu (5.5k likes, 1.4k saves):",
        provenance: "A",
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
        pola_slot: "Peluang yang sering dicari di Threads tapi jarang disediain: [kebutuhan pasar].",
        contoh_asli: "Peluang yang sering dicari di Threads tapi jarang disediain: jasa rekap data spreadsheet buat online shop kecil. Ini peluang cuan:",
        provenance: "D",
        slot_list: ["kebutuhan pasar"]
      },
      {
        id: "K10-H6",
        card_id: "K10",
        pola_slot: "Data penghasilan riil dari side project yang gue bangun sendiri [durasi]: rincian modal & profit bersih.",
        contoh_asli: "Data penghasilan riil dari side project newsletter berbayar yang saya kelola 6 bulan: rincian modal $10 dan profit bersihnya.",
        provenance: "E",
        slot_list: ["durasi"]
      },
      {
        id: "K10-H7",
        card_id: "K10",
        pola_slot: "[N] skill yang dicari [industri] tahun ini, dan cara belajarnya gratis:",
        contoh_asli: "5 skill yang dicari perusahaan e-commerce tahun ini, dan cara belajarnya gratis:",
        provenance: "C",
        slot_list: ["N", "industri"]
      },
      {
        id: "K10-H8",
        card_id: "K10",
        pola_slot: "Kerja sampingan [kategori] yang bisa mulai dengan modal [modal]:",
        contoh_asli: "Kerja sampingan dari rumah yang bisa mulai dengan modal HP dan kuota:",
        provenance: "C",
        slot_list: ["kategori", "modal"]
      },
      {
        id: "K10-H9",
        card_id: "K10",
        pola_slot: "Info [jenis peluang] yang jarang disebar: [ringkasan]. Cek syaratnya di sumber resmi:",
        contoh_asli: "Info pelatihan yang jarang disebar: short course digital gratis dari program pemerintah. Cek syaratnya di sumber resmi:",
        provenance: "C",
        slot_list: ["jenis peluang", "ringkasan"]
      },
      {
        id: "K10-H10",
        card_id: "K10",
        pola_slot: "Dari [kondisi awal] ke [hasil], jalur yang gue tempuh:",
        contoh_asli: "Dari admin gudang ke data analyst, jalur yang gue tempuh selama 18 bulan:",
        provenance: "C",
        slot_list: ["kondisi awal", "hasil"]
      },
      {
        id: "K10-H11",
        card_id: "K10",
        pola_slot: "Peluang di [tren] yang belum banyak diambil orang:",
        contoh_asli: "Peluang di tren belanja lewat live streaming yang belum banyak diambil orang:",
        provenance: "C",
        slot_list: ["tren"]
      },
      {
        id: "K10-H12",
        card_id: "K10",
        pola_slot: "Waspada lowongan [jenis] dengan ciri [ciri]:",
        contoh_asli: "Waspada lowongan 'kerja ringan gaji besar' dengan ciri minta biaya pendaftaran atau seragam:",
        provenance: "C",
        slot_list: ["jenis", "ciri"]
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
    provenance: "A",
    hooks: [
      {
        id: "K11-H1",
        card_id: "K11",
        pola_slot: "[HARI] LAPAK WARGA - Drop 1 [jasa/produk] lo di reply, format: [format]. Gue review [n] paling jelas.",
        contoh_asli: "JUMAT LAPAK WARGA - Drop 1 jasa freelance lo di reply, format: Bantu Siapa - Hasil Apa - Mulai Rp. Gue review 5 paling menarik! (2.8k replies, 1.2k likes)",
        provenance: "A",
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
      },
      {
        id: "K11-H5",
        card_id: "K11",
        pola_slot: "Trending tagar #WargaBantuWarga di Threads: yang butuh [jasa/skill], komen di bawah biar saling match.",
        contoh_asli: "Trending tagar #WargaBantuWarga di Threads: yang butuh desain logo atau konten, komen kebutuhan lo biar ketemu freelancer yang cocok.",
        provenance: "D",
        slot_list: ["jasa/skill"]
      },
      {
        id: "K11-H6",
        card_id: "K11",
        pola_slot: "Studi kasus interaksi komunitas di akun sendiri: cara kami naikin engagement balasan [persentase]% secara organik.",
        contoh_asli: "Studi kasus interaksi komunitas di akun sendiri: rutin balas 15 menit pertama melipatgandakan reply depth hingga 85%.",
        provenance: "E",
        slot_list: ["persentase"]
      },
      {
        id: "K11-H7",
        card_id: "K11",
        pola_slot: "Ceritain [pengalaman] paling [sifat] lo di balasan, minggu depan gue rangkum jadi thread:",
        contoh_asli: "Ceritain pengalaman kerja pertama paling absurd lo di balasan, minggu depan gue rangkum jadi thread:",
        provenance: "C",
        slot_list: ["pengalaman", "sifat"]
      },
      {
        id: "K11-H8",
        card_id: "K11",
        pola_slot: "Spotlight warga: [profesi/nama] yang [pencapaian].",
        contoh_asli: "Spotlight warga: guru honorer yang bikin perpustakaan keliling dari gerobak bekas.",
        provenance: "C",
        slot_list: ["profesi/nama", "pencapaian"]
      },
      {
        id: "K11-H9",
        card_id: "K11",
        pola_slot: "Lo dari [daerah]? Apa [hal khas] yang orang luar sering salah paham?",
        contoh_asli: "Lo dari Medan? Apa logat atau kebiasaan yang orang luar sering salah paham?",
        provenance: "C",
        slot_list: ["daerah", "hal khas"]
      },
      {
        id: "K11-H10",
        card_id: "K11",
        pola_slot: "Hasil polling minggu lalu soal [topik]: [temuan].",
        contoh_asli: "Hasil polling minggu lalu soal kerja remote: mayoritas milih hybrid, bukan full WFH.",
        provenance: "C",
        slot_list: ["topik", "temuan"]
      },
      {
        id: "K11-H11",
        card_id: "K11",
        pola_slot: "Lapak [tema] minggu ini: tulis [format wajib]. Gue kurasi [jumlah] yang paling jelas:",
        contoh_asli: "Lapak jasa kreatif minggu ini: tulis 'Bantu siapa - Hasil apa - Mulai Rp...'. Gue kurasi 5 yang paling jelas:",
        provenance: "C",
        slot_list: ["tema", "format wajib", "jumlah"]
      },
      {
        id: "K11-H12",
        card_id: "K11",
        pola_slot: "Rangkuman jawaban kalian soal [pertanyaan]: [N] pola yang muncul.",
        contoh_asli: "Rangkuman jawaban kalian soal 'kapan pertama kali ngerasa dewasa': 4 pola yang muncul.",
        provenance: "C",
        slot_list: ["pertanyaan", "N"]
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
    provenance: "A",
    hooks: [
      {
        id: "K12-H1",
        card_id: "K12",
        pola_slot: "Awalnya bikin [produk] ini buat [masalah pribadi]. Abis gue share di Threads, [hasil nyata]. Spill isinya:",
        contoh_asli: "Awalnya bikin template notion ini cuma buat beresin catatan kuliah yang berantakan. Abis gue share, dipakai 300+ orang (3.4k likes, 620 saves). Ini isinya:",
        provenance: "A",
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
        pola_slot: "Keyword '[kategori produk digital]' sering dicari di Threads: ini checklist evaluasi sebelum lo beli.",
        contoh_asli: "Keyword 'template dashboard keuangan' sering dicari di Threads: ini checklist 5 fitur wajib sebelum lo beli template manapun.",
        provenance: "D",
        slot_list: ["kategori produk digital"]
      },
      {
        id: "K12-H6",
        card_id: "K12",
        pola_slot: "Angka konversi produk digital di akun sendiri [periode]: kenapa narasi jujur lebih laku daripada diskon besar.",
        contoh_asli: "Angka konversi produk digital di akun sendiri 3 bulan ini: bercerita kegagalan nyata menghasilkan konversi 4x lebih tinggi daripada promo diskon.",
        provenance: "E",
        slot_list: ["periode"]
      },
      {
        id: "K12-H7",
        card_id: "K12",
        pola_slot: "Masalah [target audiens] yang bikin gue akhirnya bikin [produk]:",
        contoh_asli: "Masalah freelancer pemula yang bikin gue akhirnya bikin template invoice ini:",
        provenance: "C",
        slot_list: ["target audiens", "produk"]
      },
      {
        id: "K12-H8",
        card_id: "K12",
        pola_slot: "Isi [produk] gue sebenarnya bisa lo cari gratis. Bedanya cuma [nilai tambah]:",
        contoh_asli: "Isi e-book gue sebenarnya bisa lo cari gratis. Bedanya cuma udah gue susun berurutan dan dicoba sendiri:",
        provenance: "C",
        slot_list: ["produk", "nilai tambah"]
      },
      {
        id: "K12-H9",
        card_id: "K12",
        pola_slot: "Testimoni paling jujur soal [produk]: '[kutipan asli]'.",
        contoh_asli: "Testimoni paling jujur soal template budgeting gue: 'simpel, tapi gue jadi tau duit gue ke mana.'",
        provenance: "C",
        slot_list: ["produk", "kutipan asli"]
      },
      {
        id: "K12-H10",
        card_id: "K12",
        pola_slot: "Proses bikin [produk] dari [awal] sampai [akhir]: behind the scenes.",
        contoh_asli: "Proses bikin kelas mini dari draft di notes HP sampai rilis: behind the scenes.",
        provenance: "C",
        slot_list: ["produk", "awal", "akhir"]
      },
      {
        id: "K12-H11",
        card_id: "K12",
        pola_slot: "Gratis: [freebie] buat [audiens]. Versi lengkapnya ada di reply ke-2.",
        contoh_asli: "Gratis: checklist budgeting 1 halaman buat fresh graduate. Versi lengkapnya ada di reply ke-2.",
        provenance: "C",
        slot_list: ["freebie", "audiens"]
      },
      {
        id: "K12-H12",
        card_id: "K12",
        pola_slot: "Siapa yang GAK cocok beli [produk] gue:",
        contoh_asli: "Siapa yang GAK cocok beli planner digital gue (biar lo gak buang duit):",
        provenance: "C",
        slot_list: ["produk"]
      }
    ],
    status: "approved"
  },
  {
    id: "K13",
    niche: "Karier & Dunia Kerja",
    mode: "umum",
    format: "Cerita kantor + tips konkret; screenshot chat HR/email (disensor); template kalimat siap pakai.",
    struktur: "hook situasi kerja -> 3 poin praktis -> contoh kalimat/template -> pertanyaan pengalaman.",
    emosi: "relate, kesal, lega, termotivasi",
    sinyal_algoritma: "reply cerita kantor sendiri; save template",
    pola_komentar: "orang berbagi pengalaman atasan, HR, atau interview",
    pelajaran: "template kalimat siap pakai lebih banyak di-save daripada nasihat umum",
    guardrail: "Sensor nama perusahaan/orang; jangan beri nasihat hukum ketenagakerjaan tanpa rujukan resmi",
    provenance: "C",
    hooks: [
      {
        id: "K13-H1",
        card_id: "K13",
        pola_slot: "Jawaban '[pertanyaan interview]' yang bikin HRD [reaksi]:",
        contoh_asli: "Jawaban 'apa kelemahan kamu?' yang bikin HRD manggut-manggut:",
        provenance: "C",
        slot_list: ["pertanyaan interview", "reaksi"]
      },
      {
        id: "K13-H2",
        card_id: "K13",
        pola_slot: "Gue negosiasi gaji dari [angka awal] ke [angka akhir] pakai [N] kalimat ini:",
        contoh_asli: "Gue negosiasi gaji dari 6 ke 7,5 juta pakai 3 kalimat ini:",
        provenance: "C",
        slot_list: ["angka awal", "angka akhir", "N"]
      },
      {
        id: "K13-H3",
        card_id: "K13",
        pola_slot: "Tanda kantor lo [kondisi], dan kapan waktunya [keputusan]:",
        contoh_asli: "Tanda kantor lo udah gak sehat, dan kapan waktunya mulai cari kerja baru:",
        provenance: "C",
        slot_list: ["kondisi", "keputusan"]
      },
      {
        id: "K13-H4",
        card_id: "K13",
        pola_slot: "Cara bilang '[penolakan]' ke atasan tanpa [risiko]:",
        contoh_asli: "Cara bilang 'nggak bisa' ke atasan tanpa kelihatan malas:",
        provenance: "C",
        slot_list: ["penolakan", "risiko"]
      },
      {
        id: "K13-H5",
        card_id: "K13",
        pola_slot: "CV gue ditolak [jumlah] kali sampai gue ubah [bagian]:",
        contoh_asli: "CV gue ditolak puluhan kali sampai gue ubah bagian ringkasan profil:",
        provenance: "C",
        slot_list: ["jumlah", "bagian"]
      },
      {
        id: "K13-H6",
        card_id: "K13",
        pola_slot: "Hal yang gak diajarin kampus soal [aspek kerja]:",
        contoh_asli: "Hal yang gak diajarin kampus soal politik kantor:",
        provenance: "C",
        slot_list: ["aspek kerja"]
      }
    ],
    status: "approved"
  },
  {
    id: "K14",
    niche: "Kuliner & Resep",
    mode: "umum",
    format: "Resep 3-5 langkah, foto/video proses, estimasi biaya & waktu, review jujur tempat makan.",
    struktur: "hook hasil + biaya/waktu -> bahan singkat -> langkah -> tips anti-gagal -> tanya versi daerah.",
    emosi: "lapar, penasaran, nostalgia",
    sinyal_algoritma: "save resep; share ke pasangan/teman",
    pola_komentar: "orang share versi resep keluarga/daerah dan tanya substitusi bahan",
    pelajaran: "visual hasil akhir + angka biaya per porsi bikin save naik",
    guardrail: "Jangan klaim manfaat kesehatan makanan tanpa sumber; review tempat harus jujur dan ungkapkan jika endorse",
    provenance: "C",
    hooks: [
      {
        id: "K14-H1",
        card_id: "K14",
        pola_slot: "[Menu] ala [tempat terkenal] cuma [biaya], [N] bahan doang:",
        contoh_asli: "Ayam geprek ala warung viral cuma 15 ribu per porsi, 6 bahan doang:",
        provenance: "C",
        slot_list: ["Menu", "tempat terkenal", "biaya", "N"]
      },
      {
        id: "K14-H2",
        card_id: "K14",
        pola_slot: "Kenapa [masakan] lo selalu [masalah]? Ternyata gara-gara [penyebab]:",
        contoh_asli: "Kenapa nasi goreng lo selalu lembek? Ternyata gara-gara nasinya masih anget:",
        provenance: "C",
        slot_list: ["masakan", "masalah", "penyebab"]
      },
      {
        id: "K14-H3",
        card_id: "K14",
        pola_slot: "Meal prep [durasi] budget [nominal] buat [target]:",
        contoh_asli: "Meal prep 5 hari budget 150 ribu buat anak kos:",
        provenance: "C",
        slot_list: ["durasi", "nominal", "target"]
      },
      {
        id: "K14-H4",
        card_id: "K14",
        pola_slot: "Makanan [daerah] yang namanya sama tapi beda banget di [daerah lain]:",
        contoh_asli: "Makanan Jawa yang namanya sama tapi beda banget di Sumatra:",
        provenance: "C",
        slot_list: ["daerah", "daerah lain"]
      },
      {
        id: "K14-H5",
        card_id: "K14",
        pola_slot: "Review jujur [tempat makan viral]: [verdict singkat].",
        contoh_asli: "Review jujur bakso viral yang antreannya 1 jam: enak, tapi bukan buat semua orang.",
        provenance: "C",
        slot_list: ["tempat makan viral", "verdict singkat"]
      },
      {
        id: "K14-H6",
        card_id: "K14",
        pola_slot: "Resep warisan [orang] yang gak pernah ditulis, akhirnya gue catat:",
        contoh_asli: "Resep rendang warisan nenek yang gak pernah ditulis, akhirnya gue catat:",
        provenance: "C",
        slot_list: ["orang"]
      }
    ],
    status: "approved"
  },
  {
    id: "K15",
    niche: "Travel Hemat",
    mode: "umum",
    format: "Itinerary + rincian biaya per pos, tips anti-zonk, foto lokasi asli tanpa filter berlebihan.",
    struktur: "hook destinasi + total biaya -> rincian pos biaya -> 2-3 tips -> tanya rekomendasi.",
    emosi: "pengen jalan, penasaran, FOMO sehat",
    sinyal_algoritma: "save itinerary; tag teman di reply",
    pola_komentar: "orang nanya detail biaya dan share destinasi alternatif",
    pelajaran: "rincian biaya per pos lebih dipercaya daripada total saja",
    guardrail: "Cantumkan bahwa harga bisa berubah; jangan promosikan lokasi terlarang atau aktivitas yang merusak alam",
    provenance: "C",
    hooks: [
      {
        id: "K15-H1",
        card_id: "K15",
        pola_slot: "[Destinasi] [durasi] habis [total biaya] berdua. Rinciannya:",
        contoh_asli: "Labuan Bajo 3 hari 2 malam habis 4,8 juta berdua. Rinciannya:",
        provenance: "C",
        slot_list: ["Destinasi", "durasi", "total biaya"]
      },
      {
        id: "K15-H2",
        card_id: "K15",
        pola_slot: "[N] kesalahan pertama kali ke [destinasi] yang bikin boncos:",
        contoh_asli: "5 kesalahan pertama kali ke Jogja yang bikin boncos:",
        provenance: "C",
        slot_list: ["N", "destinasi"]
      },
      {
        id: "K15-H3",
        card_id: "K15",
        pola_slot: "Alternatif [destinasi mainstream] yang lebih sepi dan [kelebihan]:",
        contoh_asli: "Alternatif Bali yang lebih sepi dan masih ramah budget:",
        provenance: "C",
        slot_list: ["destinasi mainstream", "kelebihan"]
      },
      {
        id: "K15-H4",
        card_id: "K15",
        pola_slot: "Cara dapet tiket [moda transportasi] murah tanpa [cara ribet]:",
        contoh_asli: "Cara dapet tiket pesawat murah tanpa begadang nunggu flash sale:",
        provenance: "C",
        slot_list: ["moda transportasi", "cara ribet"]
      },
      {
        id: "K15-H5",
        card_id: "K15",
        pola_slot: "Packing list [durasi] cuma pakai [jenis tas]:",
        contoh_asli: "Packing list 5 hari cuma pakai tas kabin 7 kg:",
        provenance: "C",
        slot_list: ["durasi", "jenis tas"]
      },
      {
        id: "K15-H6",
        card_id: "K15",
        pola_slot: "Ekspektasi vs realita [destinasi]: yang gak ada di foto Instagram:",
        contoh_asli: "Ekspektasi vs realita Bromo: yang gak ada di foto Instagram:",
        provenance: "C",
        slot_list: ["destinasi"]
      }
    ],
    status: "approved"
  },
  {
    id: "K16",
    niche: "Fashion & Beauty",
    mode: "umum",
    format: "Mix & match outfit, review produk jujur (dipakai sendiri), before-after dengan cahaya natural.",
    struktur: "hook masalah penampilan -> 3 opsi/solusi lintas harga -> foto -> tanya preferensi.",
    emosi: "insecure, terinspirasi, percaya diri",
    sinyal_algoritma: "save outfit; reply tipe kulit/bentuk badan",
    pola_komentar: "orang share tipe kulit/badan dan minta rekomendasi",
    pelajaran: "review jujur yang menyebut minus produk lebih dipercaya",
    guardrail: "Hindari body shaming; jangan klaim hasil skincare seperti efek medis; ungkapkan endorse/afiliasi",
    provenance: "C",
    hooks: [
      {
        id: "K16-H1",
        card_id: "K16",
        pola_slot: "[N] outfit dari [jumlah item] baju buat [kebutuhan]:",
        contoh_asli: "7 outfit dari 5 item baju buat seminggu kerja:",
        provenance: "C",
        slot_list: ["N", "jumlah item", "kebutuhan"]
      },
      {
        id: "K16-H2",
        card_id: "K16",
        pola_slot: "Skincare [kisaran harga] yang beneran gue habisin, bukan cuma coba:",
        contoh_asli: "Skincare di bawah 100 ribu yang beneran gue habisin, bukan cuma coba:",
        provenance: "C",
        slot_list: ["kisaran harga"]
      },
      {
        id: "K16-H3",
        card_id: "K16",
        pola_slot: "Kalau kulit lo [tipe kulit], hindari [kebiasaan] ini:",
        contoh_asli: "Kalau kulit lo berminyak dan gampang jerawatan, hindari kebiasaan ini sebelum tidur:",
        provenance: "C",
        slot_list: ["tipe kulit", "kebiasaan"]
      },
      {
        id: "K16-H4",
        card_id: "K16",
        pola_slot: "Barang fashion [kisaran harga] yang kelihatan [kesan]:",
        contoh_asli: "Barang fashion di bawah 150 ribu yang kelihatan mahal:",
        provenance: "C",
        slot_list: ["kisaran harga", "kesan"]
      },
      {
        id: "K16-H5",
        card_id: "K16",
        pola_slot: "Warna baju yang bikin [efek] buat kulit [warna kulit]:",
        contoh_asli: "Warna baju yang bikin wajah kelihatan lebih segar buat kulit sawo matang:",
        provenance: "C",
        slot_list: ["efek", "warna kulit"]
      },
      {
        id: "K16-H6",
        card_id: "K16",
        pola_slot: "Gue stop beli [kategori] selama [durasi]. Lemari gue sekarang:",
        contoh_asli: "Gue stop beli baju baru selama 6 bulan. Lemari gue sekarang:",
        provenance: "C",
        slot_list: ["kategori", "durasi"]
      }
    ],
    status: "approved"
  },
  {
    id: "K17",
    niche: "Relationship & Dating",
    mode: "umum",
    format: "Opini relatable soal hubungan, skenario chat, green flag/red flag, cerita anonim (dengan izin).",
    struktur: "hook pernyataan tegas -> 3 contoh situasi -> refleksi -> pertanyaan pendapat.",
    emosi: "baper, relate, debat sehat",
    sinyal_algoritma: "reply panjang + quote post diskusi",
    pola_komentar: "orang setuju/tidak setuju sambil cerita pengalaman",
    pelajaran: "pendapat yang jelas memancing diskusi; hindari menghakimi satu gender",
    guardrail: "Jangan normalisasi kekerasan atau kontrol dalam hubungan; arahkan ke layanan bantuan untuk kasus kekerasan",
    provenance: "C",
    hooks: [
      {
        id: "K17-H1",
        card_id: "K17",
        pola_slot: "Green flag [konteks] yang jarang disadari: [contoh].",
        contoh_asli: "Green flag pasangan yang jarang disadari: dia inget hal kecil yang lo ceritain sambil lalu.",
        provenance: "C",
        slot_list: ["konteks", "contoh"]
      },
      {
        id: "K17-H2",
        card_id: "K17",
        pola_slot: "Hubungan [N] tahun ngajarin gue: [pelajaran].",
        contoh_asli: "Hubungan 6 tahun ngajarin gue: cinta itu keputusan yang diulang tiap hari.",
        provenance: "C",
        slot_list: ["N", "pelajaran"]
      },
      {
        id: "K17-H3",
        card_id: "K17",
        pola_slot: "Kalau [situasi], itu bukan [tafsiran umum], itu [makna sebenarnya].",
        contoh_asli: "Kalau dia cuma chat pas butuh, itu bukan sibuk, itu soal prioritas.",
        provenance: "C",
        slot_list: ["situasi", "tafsiran umum", "makna sebenarnya"]
      },
      {
        id: "K17-H4",
        card_id: "K17",
        pola_slot: "Pertanyaan yang wajib dibahas sebelum [tahap hubungan]:",
        contoh_asli: "Pertanyaan yang wajib dibahas sebelum nikah (mulai dari soal uang):",
        provenance: "C",
        slot_list: ["tahap hubungan"]
      },
      {
        id: "K17-H5",
        card_id: "K17",
        pola_slot: "Unpopular opinion: [opini hubungan].",
        contoh_asli: "Unpopular opinion: hubungan sehat gak harus kabar-kabaran tiap jam.",
        provenance: "C",
        slot_list: ["opini hubungan"]
      },
      {
        id: "K17-H6",
        card_id: "K17",
        pola_slot: "Cara [aksi sulit] tanpa [akibat buruk]:",
        contoh_asli: "Cara minta maaf tanpa bikin pasangan makin kesel:",
        provenance: "C",
        slot_list: ["aksi sulit", "akibat buruk"]
      }
    ],
    status: "approved"
  },
  {
    id: "K18",
    niche: "Pendidikan & Mahasiswa",
    mode: "umum",
    format: "Tips kuliah/skripsi/belajar, template, cerita perjuangan mahasiswa, info beasiswa dari sumber resmi.",
    struktur: "hook masalah akademik -> langkah praktis -> tools/template -> tanya jurusan/semester.",
    emosi: "stres, lega, termotivasi",
    sinyal_algoritma: "save + share ke grup kelas",
    pola_komentar: "orang sebut jurusan/semester dan kendalanya",
    pelajaran: "menyebut tahap spesifik (semester, bab skripsi) bikin audiens merasa dituju",
    guardrail: "Jangan mendorong joki tugas/plagiarisme; info beasiswa wajib merujuk sumber resmi",
    provenance: "C",
    hooks: [
      {
        id: "K18-H1",
        card_id: "K18",
        pola_slot: "Skripsi [bab] mentok? [N] cara yang bikin gue lanjut lagi:",
        contoh_asli: "Skripsi bab 2 mentok? 4 cara yang bikin gue lanjut lagi:",
        provenance: "C",
        slot_list: ["bab", "N"]
      },
      {
        id: "K18-H2",
        card_id: "K18",
        pola_slot: "Cara belajar [mata kuliah] buat yang [kondisi]:",
        contoh_asli: "Cara belajar statistik buat yang trauma matematika:",
        provenance: "C",
        slot_list: ["mata kuliah", "kondisi"]
      },
      {
        id: "K18-H3",
        card_id: "K18",
        pola_slot: "Hal yang pengen gue tau sebelum masuk [jurusan/kampus]:",
        contoh_asli: "Hal yang pengen gue tau sebelum masuk jurusan teknik informatika:",
        provenance: "C",
        slot_list: ["jurusan/kampus"]
      },
      {
        id: "K18-H4",
        card_id: "K18",
        pola_slot: "Tools gratis buat mahasiswa yang [manfaat]:",
        contoh_asli: "Tools gratis buat mahasiswa yang bikin ngatur sitasi jurnal jauh lebih cepat:",
        provenance: "C",
        slot_list: ["manfaat"]
      },
      {
        id: "K18-H5",
        card_id: "K18",
        pola_slot: "IPK [angka] tapi [hasil], ini yang ternyata lebih dilihat [pihak]:",
        contoh_asli: "IPK pas-pasan tapi diterima kerja duluan, ini yang ternyata lebih dilihat recruiter:",
        provenance: "C",
        slot_list: ["angka", "hasil", "pihak"]
      },
      {
        id: "K18-H6",
        card_id: "K18",
        pola_slot: "Jadwal belajar [durasi] sebelum [ujian] yang realistis:",
        contoh_asli: "Jadwal belajar 7 hari sebelum UAS yang realistis:",
        provenance: "C",
        slot_list: ["durasi", "ujian"]
      }
    ],
    status: "approved"
  },
  {
    id: "K19",
    niche: "Kesehatan & Fitness",
    mode: "umum",
    format: "Progres jujur, rutinitas sederhana, mitos vs fakta dengan sumber, latihan tanpa alat.",
    struktur: "hook progres/mitos -> 3 langkah -> catatan keamanan -> tanya kebiasaan audiens.",
    emosi: "termotivasi, penasaran, dari insecure ke lega",
    sinyal_algoritma: "save rutinitas; reply progres sendiri",
    pola_komentar: "orang share target, progres, dan kendala",
    pelajaran: "progres realistis lebih dipercaya daripada transformasi ekstrem",
    guardrail: "Bukan saran medis; jangan klaim penurunan berat badan ekstrem; rujuk tenaga kesehatan untuk kondisi khusus",
    provenance: "C",
    hooks: [
      {
        id: "K19-H1",
        card_id: "K19",
        pola_slot: "Turun [angka] kg dalam [durasi] tanpa [metode ekstrem]. Yang gue ubah:",
        contoh_asli: "Turun 6 kg dalam 4 bulan tanpa diet ketat. Yang gue ubah:",
        provenance: "C",
        slot_list: ["angka", "durasi", "metode ekstrem"]
      },
      {
        id: "K19-H2",
        card_id: "K19",
        pola_slot: "Olahraga [durasi] di rumah tanpa alat buat [target]:",
        contoh_asli: "Olahraga 15 menit di rumah tanpa alat buat yang kerja duduk seharian:",
        provenance: "C",
        slot_list: ["durasi", "target"]
      },
      {
        id: "K19-H3",
        card_id: "K19",
        pola_slot: "Mitos [topik kesehatan] yang masih dipercaya: [mitos].",
        contoh_asli: "Mitos olahraga yang masih dipercaya: sit-up bisa ngilangin lemak perut.",
        provenance: "C",
        slot_list: ["topik kesehatan", "mitos"]
      },
      {
        id: "K19-H4",
        card_id: "K19",
        pola_slot: "Gue coba [kebiasaan sehat] selama [durasi]. Hasil jujurnya:",
        contoh_asli: "Gue coba jalan kaki 8.000 langkah tiap hari selama 30 hari. Hasil jujurnya:",
        provenance: "C",
        slot_list: ["kebiasaan sehat", "durasi"]
      },
      {
        id: "K19-H5",
        card_id: "K19",
        pola_slot: "Menu makan [kondisi] yang tetap [kelebihan]:",
        contoh_asli: "Menu makan sehari ala anak kos yang tetap tinggi protein:",
        provenance: "C",
        slot_list: ["kondisi", "kelebihan"]
      },
      {
        id: "K19-H6",
        card_id: "K19",
        pola_slot: "Tanda tubuh lo butuh [kebutuhan], bukan [salah kaprah]:",
        contoh_asli: "Tanda tubuh lo butuh istirahat, bukan tambah porsi latihan:",
        provenance: "C",
        slot_list: ["kebutuhan", "salah kaprah"]
      }
    ],
    status: "approved"
  },
  {
    id: "K20",
    niche: "Rumah & Home Living",
    mode: "umum",
    format: "Before-after ruangan, tips beberes, rincian biaya renovasi kecil, hack rumah kontrakan.",
    struktur: "hook transformasi + biaya -> langkah -> daftar barang -> tanya kondisi rumah audiens.",
    emosi: "puas, terinspirasi, pengen beberes",
    sinyal_algoritma: "save + share ke pasangan/keluarga",
    pola_komentar: "orang share kondisi ruangan dan minta saran",
    pelajaran: "before-after dengan budget jelas paling banyak disimpan",
    guardrail: "Jangan sarankan modifikasi listrik/struktur tanpa tenaga ahli; hormati aturan rumah sewa",
    provenance: "C",
    hooks: [
      {
        id: "K20-H1",
        card_id: "K20",
        pola_slot: "Kamar [ukuran] jadi [hasil] cuma modal [nominal]:",
        contoh_asli: "Kamar kos 3x3 jadi lega cuma modal 400 ribu:",
        provenance: "C",
        slot_list: ["ukuran", "hasil", "nominal"]
      },
      {
        id: "K20-H2",
        card_id: "K20",
        pola_slot: "Rutinitas beberes [durasi] sehari biar rumah [hasil]:",
        contoh_asli: "Rutinitas beberes 15 menit sehari biar rumah gak berantakan tiap weekend:",
        provenance: "C",
        slot_list: ["durasi", "hasil"]
      },
      {
        id: "K20-H3",
        card_id: "K20",
        pola_slot: "[N] barang di rumah yang sebaiknya lo buang sekarang:",
        contoh_asli: "7 barang di rumah yang sebaiknya lo buang sekarang:",
        provenance: "C",
        slot_list: ["N"]
      },
      {
        id: "K20-H4",
        card_id: "K20",
        pola_slot: "Hack rumah kontrakan tanpa [larangan]:",
        contoh_asli: "Hack rumah kontrakan tanpa ngebor tembok:",
        provenance: "C",
        slot_list: ["larangan"]
      },
      {
        id: "K20-H5",
        card_id: "K20",
        pola_slot: "Beli rumah pertama di umur [umur]: [N] hal yang gue sesalin:",
        contoh_asli: "Beli rumah pertama di umur 27: 4 hal yang gue sesalin:",
        provenance: "C",
        slot_list: ["umur", "N"]
      },
      {
        id: "K20-H6",
        card_id: "K20",
        pola_slot: "Tagihan listrik turun dari [angka awal] ke [angka akhir] setelah [perubahan]:",
        contoh_asli: "Tagihan listrik turun dari 700 ribu ke 450 ribu setelah ganti 3 kebiasaan ini:",
        provenance: "C",
        slot_list: ["angka awal", "angka akhir", "perubahan"]
      }
    ],
    status: "approved"
  },
  {
    id: "K21",
    niche: "Investasi Pemula",
    mode: "umum",
    format: "Edukasi dasar instrumen, simulasi hitungan, pengalaman untung/rugi yang jujur.",
    struktur: "hook kesalahan/angka -> penjelasan sederhana -> simulasi -> disclaimer -> tanya profil risiko.",
    emosi: "penasaran, takut ketinggalan, tercerahkan",
    sinyal_algoritma: "save; reply 'gue pemula mulai dari mana?'",
    pola_komentar: "orang tanya instrumen yang cocok untuk kondisinya",
    pelajaran: "pengakuan rugi lebih dipercaya daripada pamer cuan",
    guardrail: "Bukan ajakan beli/jual; wajib disclaimer; jangan janjikan imbal hasil pasti; ingatkan cek legalitas di OJK",
    provenance: "C",
    hooks: [
      {
        id: "K21-H1",
        card_id: "K21",
        pola_slot: "Gue rugi [nominal] di [instrumen] karena [kesalahan]. Biar lo gak ngulang:",
        contoh_asli: "Gue rugi 5 juta di saham gorengan karena ikut sinyal grup Telegram. Biar lo gak ngulang:",
        provenance: "C",
        slot_list: ["nominal", "instrumen", "kesalahan"]
      },
      {
        id: "K21-H2",
        card_id: "K21",
        pola_slot: "Beda [instrumen A] vs [instrumen B] buat pemula, dijelasin tanpa istilah ribet:",
        contoh_asli: "Beda reksa dana pasar uang vs deposito buat pemula, dijelasin tanpa istilah ribet:",
        provenance: "C",
        slot_list: ["instrumen A", "instrumen B"]
      },
      {
        id: "K21-H3",
        card_id: "K21",
        pola_slot: "Simulasi investasi [nominal] per bulan selama [durasi] dengan asumsi [return]:",
        contoh_asli: "Simulasi investasi 500 ribu per bulan selama 10 tahun dengan asumsi return 6% per tahun (bukan jaminan):",
        provenance: "C",
        slot_list: ["nominal", "durasi", "return"]
      },
      {
        id: "K21-H4",
        card_id: "K21",
        pola_slot: "Ciri investasi bodong yang sering nyamar jadi [kedok]:",
        contoh_asli: "Ciri investasi bodong yang sering nyamar jadi 'arisan online':",
        provenance: "C",
        slot_list: ["kedok"]
      },
      {
        id: "K21-H5",
        card_id: "K21",
        pola_slot: "Urutan sebelum mulai investasi: [langkah 1] dulu, baru [langkah 2].",
        contoh_asli: "Urutan sebelum mulai investasi: lunasi utang konsumtif dan siapkan dana darurat dulu, baru reksa dana.",
        provenance: "C",
        slot_list: ["langkah 1", "langkah 2"]
      },
      {
        id: "K21-H6",
        card_id: "K21",
        pola_slot: "Pertanyaan yang harus lo tanya sebelum beli [produk investasi]:",
        contoh_asli: "Pertanyaan yang harus lo tanya sebelum beli produk unit link:",
        provenance: "C",
        slot_list: ["produk investasi"]
      }
    ],
    status: "approved"
  },
  {
    id: "K22",
    niche: "Hub: Opini & Diskusi Hangat",
    mode: "hub",
    format: "Pertanyaan pemantik + 2 sisi argumen; polling; rangkuman diskusi mingguan.",
    struktur: "hook pertanyaan/opini -> 2 sudut pandang singkat -> posisi pribadi -> pertanyaan terbuka.",
    emosi: "terpancing mikir, debat sehat, penasaran",
    sinyal_algoritma: "reply tinggi + quote post",
    pola_komentar: "orang memilih sisi dan berargumen dengan pengalaman pribadi",
    pelajaran: "topik dengan 2 sisi yang sama-sama masuk akal memicu reply berkualitas",
    guardrail: "Hindari SARA, politik praktis yang memecah, dan rage-bait; moderasi komentar kasar",
    provenance: "C",
    hooks: [
      {
        id: "K22-H1",
        card_id: "K22",
        pola_slot: "Mana yang lebih penting di umur 20-an: [opsi A] atau [opsi B]?",
        contoh_asli: "Mana yang lebih penting di umur 20-an: gaji besar atau lingkungan kerja yang sehat?",
        provenance: "C",
        slot_list: ["opsi A", "opsi B"]
      },
      {
        id: "K22-H2",
        card_id: "K22",
        pola_slot: "Gue berubah pikiran soal [topik]. Dulu [pandangan lama], sekarang [pandangan baru].",
        contoh_asli: "Gue berubah pikiran soal kerja di startup. Dulu gue anggap keren, sekarang gue lebih milih stabil.",
        provenance: "C",
        slot_list: ["topik", "pandangan lama", "pandangan baru"]
      },
      {
        id: "K22-H3",
        card_id: "K22",
        pola_slot: "Pertanyaan serius buat [kelompok]: [pertanyaan]?",
        contoh_asli: "Pertanyaan serius buat yang udah nikah: perlu rekening bersama atau gak?",
        provenance: "C",
        slot_list: ["kelompok", "pertanyaan"]
      },
      {
        id: "K22-H4",
        card_id: "K22",
        pola_slot: "[Kebiasaan umum] itu overrated. Ini alasan gue, kalau beda pendapat gue pengen denger:",
        contoh_asli: "Hustle culture itu overrated. Ini alasan gue, kalau beda pendapat gue pengen denger:",
        provenance: "C",
        slot_list: ["Kebiasaan umum"]
      },
      {
        id: "K22-H5",
        card_id: "K22",
        pola_slot: "Rangkuman [jumlah] balasan soal [topik]: ternyata [temuan].",
        contoh_asli: "Rangkuman 300+ balasan soal WFH vs WFO: ternyata yang paling dikeluhin bukan macetnya.",
        provenance: "C",
        slot_list: ["jumlah", "topik", "temuan"]
      },
      {
        id: "K22-H6",
        card_id: "K22",
        pola_slot: "Kalau cuma boleh pilih satu [kategori] seumur hidup, apa dan kenapa?",
        contoh_asli: "Kalau cuma boleh pilih satu makanan Indonesia seumur hidup, apa dan kenapa?",
        provenance: "C",
        slot_list: ["kategori"]
      }
    ],
    status: "approved"
  },
  {
    id: "K23",
    niche: "Hub: Behind The Scenes Kreator",
    mode: "hub",
    format: "Proses kerja, angka insights pribadi, kegagalan konten, tools kreator.",
    struktur: "hook angka/insight -> proses -> pelajaran -> tanya pengalaman kreator lain.",
    emosi: "penasaran, relate (sesama kreator), termotivasi",
    sinyal_algoritma: "save + follow dari sesama kreator",
    pola_komentar: "kreator lain share angka dan strategi mereka",
    pelajaran: "transparansi angka dan proses membangun kredibilitas",
    guardrail: "Hanya bagikan angka insights asli (provenance E setelah terverifikasi); jangan pakai screenshot hasil editan",
    provenance: "C",
    hooks: [
      {
        id: "K23-H1",
        card_id: "K23",
        pola_slot: "Post gue yang paling [hasil] bulan ini ternyata [jenis konten]. Analisisnya:",
        contoh_asli: "Post gue yang paling banyak di-save bulan ini ternyata yang desainnya paling polos. Analisisnya:",
        provenance: "C",
        slot_list: ["hasil", "jenis konten"]
      },
      {
        id: "K23-H2",
        card_id: "K23",
        pola_slot: "Workflow gue bikin [jumlah] post seminggu dalam [waktu]:",
        contoh_asli: "Workflow gue bikin 14 post seminggu dalam 3 jam batching:",
        provenance: "C",
        slot_list: ["jumlah", "waktu"]
      },
      {
        id: "K23-H3",
        card_id: "K23",
        pola_slot: "[N] konten gue yang flop dan apa yang gue pelajari:",
        contoh_asli: "3 konten gue yang flop dan apa yang gue pelajari:",
        provenance: "C",
        slot_list: ["N"]
      },
      {
        id: "K23-H4",
        card_id: "K23",
        pola_slot: "Tools yang gue pakai buat [tahap kerja] (gratis semua):",
        contoh_asli: "Tools yang gue pakai buat riset ide konten (gratis semua):",
        provenance: "C",
        slot_list: ["tahap kerja"]
      },
      {
        id: "K23-H5",
        card_id: "K23",
        pola_slot: "Jujur aja, [periode] pertama di Threads gue cuma dapet [hasil kecil]:",
        contoh_asli: "Jujur aja, 2 bulan pertama di Threads gue cuma dapet 37 follower:",
        provenance: "C",
        slot_list: ["periode", "hasil kecil"]
      },
      {
        id: "K23-H6",
        card_id: "K23",
        pola_slot: "Eksperimen: gue posting [variabel] selama [durasi]. Hasilnya:",
        contoh_asli: "Eksperimen: gue posting jam 6 pagi vs jam 9 malam selama 2 minggu. Hasilnya:",
        provenance: "C",
        slot_list: ["variabel", "durasi"]
      }
    ],
    status: "approved"
  },
  {
    id: "K24",
    niche: "Hub: Kolaborasi & Komunitas",
    mode: "hub",
    format: "Ajakan kolaborasi, thread berantai, challenge mingguan, mention kreator lain secara organik.",
    struktur: "hook ajakan/tema -> aturan main singkat -> contoh dari diri sendiri -> undangan berbagi.",
    emosi: "terlibat, kebersamaan, semangat",
    sinyal_algoritma: "reply + quote post berantai; profile visit lintas akun",
    pola_komentar: "orang ikut challenge dan saling mention",
    pelajaran: "format partisipatif membangun komunitas dan follower aktif",
    guardrail: "Jangan pakai pola 'komen X nanti dikirim' (engagement bait); minta izin sebelum repost karya orang",
    provenance: "C",
    hooks: [
      {
        id: "K24-H1",
        card_id: "K24",
        pola_slot: "Challenge [durasi]: [tantangan]. Hari ini gue mulai duluan:",
        contoh_asli: "Challenge 7 hari: nulis 1 hal yang disyukuri tiap malam. Hari ini gue mulai duluan:",
        provenance: "C",
        slot_list: ["durasi", "tantangan"]
      },
      {
        id: "K24-H2",
        card_id: "K24",
        pola_slot: "Kreator [niche] yang menurut gue underrated (dan kenapa):",
        contoh_asli: "Kreator edukasi keuangan yang menurut gue underrated (dan kenapa):",
        provenance: "C",
        slot_list: ["niche"]
      },
      {
        id: "K24-H3",
        card_id: "K24",
        pola_slot: "Thread berantai: [tema]. Lanjutin pakai versi lo.",
        contoh_asli: "Thread berantai: 1 nasihat terbaik yang pernah lo terima. Lanjutin pakai versi lo.",
        provenance: "C",
        slot_list: ["tema"]
      },
      {
        id: "K24-H4",
        card_id: "K24",
        pola_slot: "Cari partner kolaborasi buat [proyek]. Kriterianya:",
        contoh_asli: "Cari partner kolaborasi buat seri thread 'kerja di daerah'. Kriterianya:",
        provenance: "C",
        slot_list: ["proyek"]
      },
      {
        id: "K24-H5",
        card_id: "K24",
        pola_slot: "Kumpulan [sumber] terbaik hasil rekomendasi kalian:",
        contoh_asli: "Kumpulan podcast berbahasa Indonesia terbaik hasil rekomendasi kalian:",
        provenance: "C",
        slot_list: ["sumber"]
      },
      {
        id: "K24-H6",
        card_id: "K24",
        pola_slot: "Hasil [kegiatan komunitas] minggu ini: [highlight].",
        contoh_asli: "Hasil challenge menulis minggu ini: 120 orang ikut, ini 5 tulisan yang paling bikin merinding.",
        provenance: "C",
        slot_list: ["kegiatan komunitas", "highlight"]
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
    title: "1 Topik Tag Saja",
    description: "Hanya gunakan 1 topik tag per post tanpa simbol pagar #. Menambahkan lebih dari 1 tag dapat diabaikan atau menurunkan relevansi.",
    confidence: "R",
    category: "resmi"
  },
  {
    id: "RULE-R05",
    title: "Batasan 500 Karakter per Post",
    description: "Setiap post dibatasi maksimal 500 karakter. Format paragraf bernapas (1-2 kalimat per blok) terbukti meningkatkan dwell time pembaca.",
    confidence: "R",
    category: "resmi"
  },
  {
    id: "RULE-P01",
    title: "Kecepatan Balas 15 Menit Pertama",
    description: "Kreator yang aktif membalas balasan penonton dalam 15-30 menit awal memicu sinyal interaksi berantai yang mendorong post ke For You feed.",
    confidence: "P",
    category: "praktisi"
  },
  {
    id: "RULE-P02",
    title: "Rasio Balasan Terhadap Suka Ideal",
    description: "Targetkan rasio reply-to-like mendekati 0.15 (15 balasan per 100 suka) sebagai tanda diskusi organik yang sehat dan disukai algoritma.",
    confidence: "P",
    category: "praktisi"
  },
  {
    id: "RULE-P03",
    title: "Pertanyaan Penutup Terbuka",
    description: "Tutup post atau utas dengan 1 pertanyaan spesifik yang memicu orang membagikan pengalaman pribadinya, bukan sekadar jawaban ya/tidak.",
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
  },
  {
    id: "RULE-R06",
    title: "Carousel hingga 20 Foto/Video",
    description: "Threads mengizinkan hingga 20 foto atau video dalam satu carousel. Cocok untuk tutorial bertahap, before-after, atau rangkuman slide tanpa perlu memecah jadi banyak post.",
    confidence: "R",
    category: "resmi"
  },
  {
    id: "RULE-R07",
    title: "Lampiran Teks hingga 10.000 Karakter",
    description: "Fitur lampiran teks (text attachment) memungkinkan tulisan panjang hingga 10.000 karakter di luar batas 500 karakter post utama. Gunakan post utama sebagai hook, taruh detail di lampiran.",
    confidence: "R",
    category: "resmi"
  },
  {
    id: "RULE-R08",
    title: "Link Tidak Sengaja Di-downrank",
    description: "Adam Mosseri menyatakan Threads tidak sengaja menurunkan post berisi link, tetapi sistem tidak banyak memberi nilai pada prediksi klik dan orang jarang like/reply post link. Melengkapi RULE-H01: taruh nilai utama di post, link di reply.",
    confidence: "R",
    category: "resmi"
  },
  {
    id: "RULE-R09",
    title: "Ghost Post Hilang Setelah 24 Jam",
    description: "Ghost post otomatis hilang dari profil setelah 24 jam. Cocok untuk opini spontan, uji ide mentah, atau pertanyaan cepat tanpa mengganggu feed profil permanen.",
    confidence: "R",
    category: "resmi"
  },
  {
    id: "RULE-R10",
    title: "Batas Publikasi via API",
    description: "Akun yang memposting lewat Threads API dibatasi kuota publikasi dalam jendela 24 jam (250 post). Jadwal otomatis harus menghormati kuota ini agar tidak gagal publish.",
    confidence: "R",
    category: "resmi"
  },
  {
    id: "RULE-P04",
    title: "Pilar Konten Konsisten",
    description: "Sebagian besar post (sekitar 70-80%) berada di 1-3 pilar topik yang sama agar audiens dan sistem rekomendasi mengenali akun sebagai rujukan niche tertentu.",
    confidence: "P",
    category: "praktisi"
  },
  {
    id: "RULE-P05",
    title: "Hook Selesai di Baris Pertama",
    description: "Baris pertama menentukan berhenti-scroll. Taruh angka, konflik, atau janji hasil di 1-2 baris awal; hindari pembuka basa-basi seperti 'Halo semua'.",
    confidence: "P",
    category: "praktisi"
  },
  {
    id: "RULE-P06",
    title: "Reply Bernilai di Akun Lebih Besar",
    description: "Balasan yang substansial (bukan 'setuju kak') di post akun lebih besar dalam niche yang sama sering mendatangkan profile visit dan follower relevan.",
    confidence: "P",
    category: "praktisi"
  },
  {
    id: "RULE-P07",
    title: "Visual Native Pendukung",
    description: "Screenshot, foto asli, atau grafik sederhana yang diunggah langsung membantu menghentikan scroll dan memperjelas klaim, terutama untuk konten angka dan before-after.",
    confidence: "P",
    category: "praktisi"
  },
  {
    id: "RULE-P08",
    title: "Frekuensi Stabil Lebih Baik dari Ledakan",
    description: "Posting 1-3 kali sehari secara konsisten lebih aman daripada 10 post sehari lalu hilang seminggu; ritme stabil menjaga follower aktif tetap melihat akun.",
    confidence: "P",
    category: "praktisi"
  },
  {
    id: "RULE-P09",
    title: "Repurpose Balasan Jadi Konten Baru",
    description: "Pertanyaan yang berulang di kolom balasan adalah bahan post berikutnya. Kutip pertanyaannya (dengan izin/anonim) lalu jawab tuntas di post baru.",
    confidence: "P",
    category: "praktisi"
  },
  {
    id: "RULE-P10",
    title: "Polling untuk Riset Audiens",
    description: "Gunakan fitur polling untuk memvalidasi topik atau produk sebelum membuat konten panjang; hasilnya bisa diolah jadi post rangkuman.",
    confidence: "P",
    category: "praktisi"
  },
  {
    id: "RULE-H04",
    title: "Hapus-Ulang Post yang Sama",
    description: "Menghapus lalu memposting ulang konten identik berkali-kali diduga dianggap pola spam dan dapat menekan distribusi.",
    confidence: "H",
    category: "penalti"
  },
  {
    id: "RULE-H05",
    title: "Aktivitas Massal Dibatasi",
    description: "Follow/unfollow massal, reply template berulang, atau mention berantai dalam waktu singkat diduga memicu pembatasan aktivitas akun.",
    confidence: "H",
    category: "penalti"
  },
  {
    id: "RULE-H06",
    title: "Engagement Pod Terdeteksi",
    description: "Grup saling like/reply terorganisir diduga mudah terdeteksi karena pola interaksinya seragam, sehingga sinyalnya tidak bernilai atau justru menurunkan kepercayaan.",
    confidence: "H",
    category: "penalti"
  },
  {
    id: "RULE-H07",
    title: "Topik Tag Relevan Memberi Dorongan Awal",
    description: "Memilih topik tag yang sedang ramai dan benar-benar relevan diduga membantu post menjangkau orang di luar follower pada jam-jam awal.",
    confidence: "H",
    category: "hipotesis"
  },
  {
    id: "RULE-H08",
    title: "Jam Posting Mengikuti Aktivitas Follower",
    description: "Waktu terbaik berbeda per akun. Uji 2-3 slot waktu selama 2 minggu dan bandingkan reply serta view pada jam pertama di insights.",
    confidence: "H",
    category: "hipotesis"
  }
];

export const PROVENANCE_LABELS: Record<string, { label: string; desc: string; badgeClass: string }> = {
  A: {
    label: "Ulasan Viral (A)",
    desc: "Klaim viral + angka likes dari ulasan Meta AI (terbukti data kuantitatif ulasan publik).",
    badgeClass: "bg-amber-500/10 text-amber-400 border border-amber-500/20"
  },
  B: {
    label: "Pola Teruji (B)",
    desc: "Klaim berhasil 'works' tanpa angka pasti dari ulasan referensi komunitas.",
    badgeClass: "bg-blue-500/10 text-blue-400 border border-blue-500/20"
  },
  C: {
    label: "Hipotetis (C)",
    desc: "Pola hipotetis terstruktur menurut pengamatan referensi.",
    badgeClass: "bg-purple-500/10 text-purple-400 border border-purple-500/20"
  },
  D: {
    label: "Pencarian Threads (D)",
    desc: "Ditemukan dari topik pencarian populer dan keyword search Threads.",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
  },
  E: {
    label: "Terbukti di Akun Sendiri (E)",
    desc: "Terbukti di akun kreator lewat data riil, insights, dan tracker metrik performa.",
    badgeClass: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
  }
};
