/**
 * AutoThreads Guard & Algorithm-Safe Quality Checker
 * Pure code validation (bukan LLM) untuk proteksi anti-copy & algoritma
 */

import { REFERENCE_CARDS } from "../data/bank";
import { QualityIssue, CheckerResult, VariantOutput } from "../types";

/**
 * Normalisasi teks untuk pemrosesan n-gram
 */
function cleanText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

/**
 * Buat himpunan n-gram dari array kata
 */
function extractNgrams(words: string[], n: number): Set<string> {
  const ngrams = new Set<string>();
  if (words.length < n) return ngrams;
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.add(words.slice(i, i + n).join(" "));
  }
  return ngrams;
}

/**
 * Periksa overlap n-gram >= 6 kata dengan contoh_asli Bank
 */
export function checkBankOverlap(text: string): { hasOverlap: boolean; matchedSnippet?: string } {
  const words = cleanText(text);
  if (words.length < 6) return { hasOverlap: false };
  const targetNgrams = extractNgrams(words, 6);

  for (const card of REFERENCE_CARDS) {
    for (const hook of card.hooks) {
      const hookWords = cleanText(hook.contoh_asli);
      if (hookWords.length < 6) continue;
      const hookNgrams = extractNgrams(hookWords, 6);

      for (const ngram of targetNgrams) {
        if (hookNgrams.has(ngram)) {
          return { hasOverlap: true, matchedSnippet: ngram };
        }
      }
    }
  }

  return { hasOverlap: false };
}

/**
 * Periksa overlap >= 8 kata berurutan dengan ide kasar user
 */
export function checkRawIdeaOverlap(generatedText: string, rawIdea: string): { hasOverlap: boolean; matchedSnippet?: string } {
  const genWords = cleanText(generatedText);
  const ideaWords = cleanText(rawIdea);
  if (genWords.length < 8 || ideaWords.length < 8) return { hasOverlap: false };

  const genNgrams = extractNgrams(genWords, 8);
  const ideaNgrams = extractNgrams(ideaWords, 8);

  for (const ngram of genNgrams) {
    if (ideaNgrams.has(ngram)) {
      return { hasOverlap: true, matchedSnippet: ngram };
    }
  }

  return { hasOverlap: false };
}

/**
 * Pola-pola engagement bait yang dilarang keras oleh Threads Meta
 */
const ENGAGEMENT_BAIT_PATTERNS = [
  /komen\s+(mau|link|ya|dm|aku|info|ebook|pdf|katalog)/i,
  /ketik\s+(mau|link|ya|dm|1|info)/i,
  /nanti\s+(gue|saya|aku)\s+(dm|kirim|japri)/i,
  /like\s+kalau\s+setuju/i,
  /rt\s+kalau\s+relate/i,
  /repost\s+jika\s+bermanfaat/i,
  /share\s+ke\s+(teman|story|grup)/i,
  /save\s+dulu\s+biar\s+gak\s+lupa/i,
  /drop\s+(email|wa|nomor)/i,
];

/**
 * Deteksi tautan web
 */
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|bit\.ly\/[^\s]+|linktr\.ee\/[^\s]+)/i;

/**
 * Validasi mendalam untuk varian utas tunggal
 */
export function auditVariant(variant: VariantOutput, rawIdea: string = "", targetGoal?: string): CheckerResult {
  const issues: QualityIssue[] = [];
  let score = 100;

  // 1. Cek Karakter per Post (Maks 500 chars)
  variant.posts.forEach((post, idx) => {
    const actualLength = post.text.length;
    if (actualLength > 500) {
      score -= 20;
      issues.push({
        type: "char_limit_exceeded",
        description: `Post #${idx + 1} melebihi batas 500 karakter (saat ini ${actualLength} karakter).`,
        severity: "critical",
        fix: `Potong kalimat pendukung di post #${idx + 1} agar panjangnya di bawah 450 karakter.`
      });
    }
  });

  // 2. Cek Anti-Copy Overlap Bank (>= 6-gram)
  const fullText = variant.posts.map(p => p.text).join(" ");
  const bankCheck = checkBankOverlap(fullText);
  if (bankCheck.hasOverlap) {
    score -= 25;
    issues.push({
      type: "bank_copy_detected",
      description: `Terdeteksi 6+ kata berurutan yang meniru contoh referensi: "${bankCheck.matchedSnippet}".`,
      severity: "critical",
      fix: "Parafrase kalimat tersebut menjadi fakta asli atau sudut pandang barumu."
    });
  }

  // 3. Cek Overlap Ide Kasar (>= 8-gram)
  if (rawIdea && rawIdea.length > 20) {
    const rawCheck = checkRawIdeaOverlap(fullText, rawIdea);
    if (rawCheck.hasOverlap) {
      score -= 15;
      issues.push({
        type: "raw_idea_unfused",
        description: `Ide mentah disalin langsung tanpa dipoles pola (8 kata berurutan: "${rawCheck.matchedSnippet}").`,
        severity: "warning",
        fix: "Poles kalimat agar lebih tajam dan pas dengan ritme percakapan Threads."
      });
    }
  }

  // 4. Cek Engagement Bait
  for (const pattern of ENGAGEMENT_BAIT_PATTERNS) {
    if (pattern.test(fullText)) {
      score -= 30;
      issues.push({
        type: "engagement_bait",
        description: "Terdeteksi engagement bait ('komen MAU', 'like kalau setuju') yang memicu downrank algoritma.",
        severity: "critical",
        fix: "Ganti dengan pertanyaan pilihan natural, misal: 'Lo lebih condong tim A atau B?'"
      });
      break;
    }
  }

  // 5. Cek Hashtag (#) dan Topic Tag
  if (fullText.includes("#")) {
    score -= 15;
    issues.push({
      type: "hashtag_forbidden",
      description: "Terdeteksi simbol hashtag (#). Threads menggunakan Topic Tag spesifik, bukan tanda pagar.",
      severity: "critical",
      fix: "Hapus semua tanda # dari teks dan gunakan Topic Tag resmi yang disediakan."
    });
  }

  // 6. Cek Link di Post Utama (Post #1)
  const post1 = variant.posts[0]?.text || "";
  if (URL_REGEX.test(post1)) {
    score -= 25;
    issues.push({
      type: "link_in_post_1",
      description: "Tautan URL terdeteksi di Post #1. Ini menekan jangkauan algoritma.",
      severity: "critical",
      fix: "Pindahkan tautan tersebut ke Reply ke-2 yang sudah disiapkan sistem."
    });
  }

  // 7. Cek Hard-sell di Post #1
  const hardsellTerms = [/promo\s+spesial/i, /beli\s+sekarang/i, /diskon\s+\d+%/i, /order\s+di\s+sini/i];
  for (const term of hardsellTerms) {
    if (term.test(post1)) {
      score -= 20;
      issues.push({
        type: "hard_sell_post_1",
        description: "Post pertama langsung jualan (hard-sell). Ini membuat audiens kabur sebelum membaca value.",
        severity: "warning",
        fix: "Awali dengan cerita masalah, hasil uji coba, atau tips bermanfaat sebelum menyinggung produk."
      });
      break;
    }
  }

  // 8. Cek Pertanyaan Penutup (Closing Question)
  if (!variant.closing_question || variant.closing_question.length < 5) {
    score -= 10;
    issues.push({
      type: "missing_closing_question",
      description: "Tidak ada pertanyaan pemancing diskusi di akhir utas.",
      severity: "suggestion",
      fix: "Tambahkan pertanyaan yang menggali pengalaman audiens di bagian penutup."
    });
  }

  // 9. Cek Placeholder Kosong seperti [ISI: ...]
  const placeholderRegex = /\[ISI:\s*[^\]]+\]|\[MASUKKAN\s*[^\]]+\]/i;
  if (placeholderRegex.test(fullText)) {
    score -= 25;
    issues.push({
      type: "placeholder_remaining",
      description: "Terdeteksi teks placeholder seperti [ISI: ...]. Utas harus 100% siap posting tanpa kurung kosong.",
      severity: "warning",
      fix: "Gunakan ulasan bantuan AI atau isi dengan estimasi angka/fakta riil langsung."
    });
  }

  // 10. Cek Reply Konversi pada Sasaran Non-Konversi (Jangkauan & Kedekatan)
  const effectiveGoal = targetGoal || variant.goal || "Jangkauan";
  const isNonConversionGoal = effectiveGoal.toLowerCase() !== "konversi";
  const CONVERSION_TERMS = [
    /link\s+di\s+(bio|profil)/i,
    /cek\s+(bio|profil)/i,
    /klik\s+link/i,
    /dm\s+(gue|aku|saya|kami|kita|admin|min)/i,
    /kirim\s+dm/i,
    /japri/i,
    /beli\s+(sekarang|di)/i,
    /order\s+(di|sekarang)/i,
    /katalog/i,
    /checkout/i,
    /daftar\s+(webinar|kelas|kursus|workshop|ecourse)/i,
    /konsultasi\s+(gratis|berbayar|dm)/i,
    /jasa\s+(kami|gue|aku)/i,
    /produk\s+(kami|gue|aku)/i,
    /etalase/i,
    /promo\s+terbatas/i,
    /diskon/i,
    /shopee|tokopedia|tiktok\s+shop/i,
    /keranjang\s+kuning/i,
    /affiliate/i,
    /tautan\s+(pembelian|produk)/i,
  ];

  if (isNonConversionGoal) {
    const replyText = variant.reply_2?.text || "";
    const hasConversionTerm = CONVERSION_TERMS.some((p) => p.test(replyText));
    const hasUrl = URL_REGEX.test(replyText);
    if (hasConversionTerm || variant.reply_2?.contains_link || hasUrl) {
      score -= 25;
      issues.push({
        type: "unwanted_conversion_reply",
        description: `Sasaran utas adalah '${effectiveGoal}', tetapi Reply ke-4 terdeteksi memuat promosi/konversi atau link keluar.`,
        severity: "critical",
        fix: "Ganti Reply ke-4 dengan pemantik diskusi atau refleksi komunitas tanpa ajakan jualan/promosi."
      });
    }
  }

  const finalScore = Math.max(0, Math.min(100, score));
  return {
    score: finalScore,
    issues,
    passed: finalScore >= 70,
  };
}

/**
 * Perbaiki otomatis (Auto-fix) masalah yang bisa ditangani secara deterministik
 */
export function autoFixVariant(variant: VariantOutput, targetGoal?: string): VariantOutput {
  const newVariant = JSON.parse(JSON.stringify(variant)) as VariantOutput;
  const effectiveGoal = targetGoal || newVariant.goal || "Jangkauan";
  const isNonConversion = effectiveGoal.toLowerCase() !== "konversi";

  if (isNonConversion) {
    newVariant.goal = effectiveGoal;
  }

  const CONVERSION_TERMS = [
    /link\s+di\s+(bio|profil)/i,
    /cek\s+(bio|profil)/i,
    /klik\s+link/i,
    /dm\s+(gue|aku|saya|kami|kita|admin|min)/i,
    /kirim\s+dm/i,
    /japri/i,
    /beli\s+(sekarang|di)/i,
    /order\s+(di|sekarang)/i,
    /katalog/i,
    /checkout/i,
    /daftar\s+(webinar|kelas|kursus|workshop|ecourse)/i,
    /konsultasi\s+(gratis|berbayar|dm)/i,
    /jasa\s+(kami|gue|aku)/i,
    /produk\s+(kami|gue|aku)/i,
    /etalase/i,
    /promo\s+terbatas/i,
    /diskon/i,
    /shopee|tokopedia|tiktok\s+shop/i,
    /keranjang\s+kuning/i,
    /affiliate/i,
    /tautan\s+(pembelian|produk)/i,
  ];

  // 1. Hapus hashtag (#) dari seluruh post
  newVariant.posts = newVariant.posts.map(post => {
    let text = post.text.replace(/#([\w\u00C0-\u1FFF]+)/g, "$1").replace(/#/g, "");
    
    // 2. Jika ada URL di post 1, hanya pindahkan ke reply_2 jika sasaran adalah Konversi
    const urlMatch = text.match(URL_REGEX);
    if (urlMatch && post.order === 1) {
      const foundUrl = urlMatch[0];
      text = text.replace(foundUrl, "").trim();
      if (!isNonConversion) {
        if (!newVariant.reply_2.text.includes(foundUrl)) {
          newVariant.reply_2.text = `${newVariant.reply_2.text}\n\nLink selengkapnya: ${foundUrl}`.trim();
          newVariant.reply_2.contains_link = true;
        }
      }
    }

    // 3. Hapus engagement bait klise
    text = text
      .replace(/komen\s+mau\s+nanti\s+(gue|aku)\s+dm/gi, "drop pertanyaan lo di bawah")
      .replace(/like\s+kalau\s+setuju/gi, "gimana menurut pengalaman lo?")
      .replace(/rt\s+kalau\s+relate/gi, "pernah ngalamin hal serupa?");

    // 4. Bersihkan placeholder kurung siku menjadi angka & fakta realistis siap posting
    text = text
      .replace(/\[ISI:\s*nominal[^\]]*\]/gi, "1,5jt")
      .replace(/\[ISI:\s*angka[^\]]*\]/gi, "3x lipat")
      .replace(/\[ISI:\s*persen[^\]]*\]/gi, "35%")
      .replace(/\[ISI:\s*waktu[^\]]*\]/gi, "3 minggu")
      .replace(/\[ISI:\s*biaya[^\]]*\]/gi, "850rb")
      .replace(/\[ISI:[^\]]*\]/gi, "pengalaman nyata")
      .replace(/\[MASUKKAN[^\]]*\]/gi, "fakta konkret");

    return {
      ...post,
      text,
      char_count: text.length,
    };
  });

  // 4. Pastikan Topic Tag bersih dari #
  if (newVariant.topic_tag) {
    newVariant.topic_tag = newVariant.topic_tag.replace(/#/g, "").trim();
  }

  // 5. Bersihkan reply_2 dari konversi / promosi jika sasaran bukan Konversi (Jangkauan & Kedekatan)
  if (isNonConversion && newVariant.reply_2) {
    const hasConversionTerm = CONVERSION_TERMS.some((p) => p.test(newVariant.reply_2.text || ""));
    const hasUrl = URL_REGEX.test(newVariant.reply_2.text || "");
    if (hasConversionTerm || newVariant.reply_2.contains_link || hasUrl) {
      const isKedekatan = effectiveGoal.toLowerCase() === "kedekatan";
      newVariant.reply_2.text = isKedekatan
        ? "Jujur, nulis utas ini bikin gue refleksi lagi. Menurut kalian gimana? Cerita santai di bawah yuk, siapa tahu bisa saling menguatkan."
        : "Dari poin-poin di atas, mana yang menurut kalian paling relate atau justru bikin punya pandangan beda? Drop pendapat kalian di bawah buat bahan diskusi.";
      newVariant.reply_2.contains_link = false;
    }

    // Koreksi template lapak / softsell jika sasaran non-konversi
    if (newVariant.template === "lapak" || newVariant.template === "softsell_cerita") {
      newVariant.template = effectiveGoal.toLowerCase() === "kedekatan" ? "validasi" : "kontra_narasi";
    }
  }

  return newVariant;
}
