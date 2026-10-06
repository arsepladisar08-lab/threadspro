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
export function auditVariant(variant: VariantOutput, rawIdea: string = ""): CheckerResult {
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
export function autoFixVariant(variant: VariantOutput): VariantOutput {
  const newVariant = JSON.parse(JSON.stringify(variant)) as VariantOutput;

  // 1. Hapus hashtag (#) dari seluruh post
  newVariant.posts = newVariant.posts.map(post => {
    let text = post.text.replace(/#([\w\u00C0-\u1FFF]+)/g, "$1").replace(/#/g, "");
    
    // 2. Jika ada URL di post 1, pindahkan ke reply_2
    const urlMatch = text.match(URL_REGEX);
    if (urlMatch && post.order === 1) {
      const foundUrl = urlMatch[0];
      text = text.replace(foundUrl, "").trim();
      if (!newVariant.reply_2.text.includes(foundUrl)) {
        newVariant.reply_2.text = `${newVariant.reply_2.text}\n\nLink selengkapnya: ${foundUrl}`.trim();
        newVariant.reply_2.contains_link = true;
      }
    }

    // 3. Hapus engagement bait klise
    text = text
      .replace(/komen\s+mau\s+nanti\s+(gue|aku)\s+dm/gi, "drop pertanyaan lo di bawah")
      .replace(/like\s+kalau\s+setuju/gi, "gimana menurut pengalaman lo?")
      .replace(/rt\s+kalau\s+relate/gi, "pernah ngalamin hal serupa?");

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

  return newVariant;
}
