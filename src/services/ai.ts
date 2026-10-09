/**
 * AutoThreads AI Service
 * Satu pintu penghubung Gemini: Mode Direct (Preview AI Studio) vs Proxy (Produksi Vercel).
 *
 * Perubahan utama dibanding versi sebelumnya:
 * - generateFactsAssistance tidak lagi mengarang "fakta nyata": hasilnya ditandai jelas sebagai
 *   estimasi/ilustrasi + pertanyaan ke user (selaras CORE_CONTENT_RULES A2–A4).
 * - Retry 1x saat output gagal validasi Zod, dengan umpan balik error ke model (retryCount kini benar-benar dipakai).
 * - Error non-retryable (API key salah, permintaan tidak valid) tidak lagi memicu fallback model + backoff yang sia-sia.
 * - Timeout untuk proxy & direct, parsing JSON lebih tahan banting, temperature per task.
 * - Embedding dibatch dan dimensi vektor cadangan mengikuti hasil asli.
 */

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { TEXT_MODEL, EMBED_MODEL, FALLBACK_MODELS, CONFIG } from "../config";
import { storage } from "../lib/storage";
import { CORE_CONTENT_RULES } from "../prompts/commonRules";
import {
  IDEA_DNA_SYSTEM_PROMPT,
  WRITER_SYSTEM_PROMPT,
  CRITIC_SYSTEM_PROMPT,
  REPLY_SYSTEM_PROMPT,
  REVIEW_SYSTEM_PROMPT,
  CALENDAR_SYSTEM_PROMPT,
} from "../prompts";
import {
  GEMINI_IDEA_DNA_SCHEMA,
  GEMINI_WRITER_SCHEMA,
  GEMINI_CRITIC_SCHEMA,
  GEMINI_REPLY_SCHEMA,
  GEMINI_REVIEW_SCHEMA,
  GEMINI_CALENDAR_SCHEMA,
  IdeaDnaZodSchema,
  WriterZodSchema,
  CriticZodSchema,
  ReplyZodSchema,
  ReviewZodSchema,
  CalendarZodSchema,
} from "../schemas";

export type AITask = "ideaDna" | "writer" | "critic" | "reply" | "review" | "calendar";

// ─── Konfigurasi per task ────────────────────────────────────────────────────

export const TASK_PROMPTS: Record<AITask, string> = {
  ideaDna: IDEA_DNA_SYSTEM_PROMPT,
  writer: WRITER_SYSTEM_PROMPT,
  critic: CRITIC_SYSTEM_PROMPT,
  reply: REPLY_SYSTEM_PROMPT,
  review: REVIEW_SYSTEM_PROMPT,
  calendar: CALENDAR_SYSTEM_PROMPT,
};

export const TASK_GEMINI_SCHEMAS: Record<AITask, unknown> = {
  ideaDna: GEMINI_IDEA_DNA_SCHEMA,
  writer: GEMINI_WRITER_SCHEMA,
  critic: GEMINI_CRITIC_SCHEMA,
  reply: GEMINI_REPLY_SCHEMA,
  review: GEMINI_REVIEW_SCHEMA,
  calendar: GEMINI_CALENDAR_SCHEMA,
};

export const TASK_ZOD_SCHEMAS: Record<AITask, z.ZodTypeAny> = {
  ideaDna: IdeaDnaZodSchema,
  writer: WriterZodSchema,
  critic: CriticZodSchema,
  reply: ReplyZodSchema,
  review: ReviewZodSchema,
  calendar: CalendarZodSchema,
};

/** Task analitis butuh konsistensi; task kreatif butuh variasi. */
export const TASK_TEMPERATURE: Record<AITask, number> = {
  ideaDna: 0.6,
  writer: 0.85,
  critic: 0.2,
  reply: 0.8,
  review: 0.4,
  calendar: 0.6,
};

const MAX_VALIDATION_RETRIES = 1;
const DIRECT_TIMEOUT_MS = 60_000;
const PROXY_TIMEOUT_MS = 90_000;
const EMBED_BATCH_SIZE = 100;
const DEFAULT_EMBED_DIM = 768;

/** Urutan model unik: model utama dulu, lalu fallback. */
const MODEL_CHAIN: string[] = Array.from(new Set([TEXT_MODEL, ...(FALLBACK_MODELS || [])].filter(Boolean)));

// ─── Error helpers ───────────────────────────────────────────────────────────

class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly kind: "auth" | "quota" | "validation" | "network" | "bad_request" | "unknown",
    public readonly retryable: boolean
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

function classifyError(err: unknown): AIServiceError {
  if (err instanceof AIServiceError) return err;
  const msg = (err as any)?.message ? String((err as any).message) : String(err ?? "");
  const low = msg.toLowerCase();

  if (/\b(401|403)\b/.test(msg) || low.includes("api key not valid") || low.includes("api_key_invalid") || low.includes("permission_denied")) {
    return new AIServiceError("API Key Gemini tidak valid atau tidak punya akses ke model ini. Periksa kembali kunci di Pengaturan.", "auth", false);
  }
  if (msg.includes("429") || low.includes("quota") || low.includes("resource_exhausted") || low.includes("rate limit")) {
    return new AIServiceError(
      "Kuota model AI Gemini sedang habis atau mencapai batas frekuensi (HTTP 429). Tunggu beberapa saat lalu coba lagi.",
      "quota",
      true
    );
  }
  if (/\b400\b/.test(msg) || low.includes("invalid_argument")) {
    return new AIServiceError(`Permintaan ke Gemini tidak valid: ${msg}`, "bad_request", false);
  }
  if (low.includes("abort") || low.includes("timeout") || low.includes("failed to fetch") || low.includes("network") || /\b(500|502|503|504)\b/.test(msg)) {
    return new AIServiceError(`Koneksi ke layanan AI bermasalah: ${msg}`, "network", true);
  }
  return new AIServiceError(msg || "Gagal memproses AI.", "unknown", true);
}

function formatZodIssues(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelay(attempt: number): number {
  const base = Math.min(1000 * Math.pow(2, attempt - 1), 6000);
  return base + Math.floor(Math.random() * 300);
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout: ${label} melebihi ${Math.round(ms / 1000)} detik`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Ambil objek JSON dari teks model, termasuk jika terbungkus code fence atau ada teks tambahan. */
function extractJson(raw: string): unknown {
  let text = raw.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();
  try {
    return JSON.parse(text);
  } catch {
    const start = text.search(/[\[{]/);
    const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
    if (start !== -1 && end > start) return JSON.parse(text.slice(start, end + 1));
    throw new AIServiceError("Model tidak mengembalikan JSON yang bisa dibaca.", "validation", true);
  }
}

// ─── Client ──────────────────────────────────────────────────────────────────

let clientGenAI: GoogleGenAI | null = null;
let lastApiKeyUsed: string | null = null;

async function resolveApiKey(): Promise<string> {
  const customKey = await storage.getCustomApiKey();
  return (customKey || process.env.GEMINI_API_KEY || process.env.API_KEY || "").trim();
}

function createClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });
}

async function getDirectAIClient(): Promise<GoogleGenAI> {
  const apiKey = await resolveApiKey();
  if (!apiKey) {
    throw new AIServiceError(
      "GEMINI_API_KEY belum diatur. Masukkan API Key di Pengaturan atau set variabel environment.",
      "auth",
      false
    );
  }
  if (!clientGenAI || lastApiKeyUsed !== apiKey) {
    lastApiKeyUsed = apiKey;
    clientGenAI = createClient(apiKey);
  }
  return clientGenAI;
}

// ─── Bantuan fakta (jujur, anti-karangan) ────────────────────────────────────

/**
 * Bantu user melengkapi fakta untuk ide kasarnya.
 * Hasilnya BUKAN fakta pengalaman user: berisi estimasi berlabel, ilustrasi berlabel,
 * dan pertanyaan agar user mengisi data aslinya. Ini menjaga Writer tetap lolos aturan A2–A4.
 */
export async function generateFactsAssistance(params: {
  rawIdea: string;
  niche?: string;
  goal?: string;
  profile?: any;
}): Promise<string> {
  const { rawIdea, niche = "Keuangan", goal = "Jangkauan", profile } = params;

  const systemInstruction = `Kamu adalah asisten riset untuk kreator Threads Indonesia.
Tugasmu membantu kreator melengkapi bahan utas dengan JUJUR: kamu tidak tahu pengalaman pribadi kreator, jadi jangan pernah menulis cerita, hasil, atau angka seolah-olah itu pengalaman nyatanya.

${CORE_CONTENT_RULES}

FORMAT JAWABAN (teks biasa, tanpa markdown tebal, tanpa #):
Estimasi umum:
- 2–3 poin kisaran angka yang wajar untuk konteks Indonesia, selalu diawali penanda jujur ("kisaran", "kurang lebih", "tergantung kota/skala") + dasar logikanya singkat.
Contoh ilustrasi:
- 1 skenario yang diawali "Misal" atau "Bayangin", jelas bukan pengalaman pribadi.
Biar makin kuat, isi pakai data aslimu:
- 2–3 pertanyaan singkat yang memancing angka, momen titik balik, atau hasil nyata milik kreator.

Bahasa percakapan santai, padat, tanpa placeholder seperti [ISI: ...].`;

  const userContent = JSON.stringify(
    {
      ide_kasar: rawIdea,
      niche,
      target_audiens: profile?.targetAudience || "Warga Threads Indonesia usia 20–35",
      tone: profile?.tone || "santai",
      goal,
    },
    null,
    2
  );

  try {
    const ai = await getDirectAIClient();
    const res = await withTimeout(
      ai.models.generateContent({
        model: TEXT_MODEL,
        contents: userContent,
        config: { systemInstruction, temperature: 0.5 },
      }),
      DIRECT_TIMEOUT_MS,
      "bantuan fakta"
    );
    const text = (res.text || "").trim();
    if (text) return text;
  } catch (err) {
    console.warn("generateFactsAssistance gagal, memakai panduan cadangan:", classifyError(err).message);
  }

  return buildFactsFallback(niche);
}

/** Cadangan offline: panduan jujur, bukan data palsu. */
function buildFactsFallback(niche: string): string {
  const n = (niche || "").toLowerCase();
  const questions = [
    "Angka asli apa yang kamu punya? (nominal, durasi, jumlah percobaan)",
    "Kapan momen kamu sadar ada yang salah atau berubah?",
    "Apa hasil nyatanya setelah itu, sekecil apa pun?",
  ];

  let estimate: string;
  let illustration: string;
  if (n.includes("uang") || n.includes("finan") || n.includes("keuangan")) {
    estimate = "- Pengeluaran kecil harian (kopi, ongkir, jajan) kurang lebih bisa jadi 10–25% pengeluaran bulanan, tergantung kota dan kebiasaan.";
    illustration = "- Misal gaji habis sebelum tanggal 20 padahal nggak merasa belanja besar — biasanya bocornya ada di transaksi kecil yang berulang.";
  } else if (n.includes("karir") || n.includes("karier") || n.includes("kerja")) {
    estimate = "- Untuk posisi entry-level, rasio lamaran ke panggilan interview kisarannya kecil dan sangat tergantung bidang serta kualitas CV/portofolio.";
    illustration = "- Bayangin kirim puluhan lamaran tanpa kabar, lalu sadar CV-mu cuma daftar tugas, bukan hasil kerja.";
  } else if (n.includes("bisnis") || n.includes("umkm") || n.includes("jualan")) {
    estimate = "- Bulan-bulan awal usaha kecil umumnya masih tahap uji pasar; untung-rugi kisarannya sangat tergantung modal, produk, dan saluran jualan.";
    illustration = "- Misal produk sudah bagus tapi yang beli cuma teman sendiri — sering masalahnya di target pembeli, bukan produknya.";
  } else {
    estimate = "- Perubahan kebiasaan biasanya baru terasa setelah beberapa minggu konsisten; durasinya beda-beda tiap orang.";
    illustration = "- Bayangin kamu coba satu kebiasaan baru selama 3 minggu dan mencatat apa yang berubah tiap minggunya.";
  }

  return [
    "Estimasi umum:",
    estimate,
    "Contoh ilustrasi:",
    illustration,
    "Biar makin kuat, isi pakai data aslimu:",
    ...questions.map((q) => `- ${q}`),
  ].join("\n");
}

// ─── Tes API Key ─────────────────────────────────────────────────────────────

export async function testGeminiApiKey(candidateKey: string): Promise<{ success: boolean; message: string }> {
  const clean = candidateKey.trim();
  if (!clean) return { success: false, message: "Kunci API tidak boleh kosong." };

  try {
    const resp = await withTimeout(
      createClient(clean).models.generateContent({
        model: TEXT_MODEL,
        contents: "Tes koneksi: balas dengan kata 'OK'.",
        config: { temperature: 0, maxOutputTokens: 5 },
      }),
      20_000,
      "tes API key"
    );
    return resp.text
      ? { success: true, message: "API Key valid dan berhasil terhubung ke Google Gemini!" }
      : { success: false, message: "Terhubung, tetapi respons API kosong. Coba lagi." };
  } catch (err) {
    return { success: false, message: classifyError(err).message };
  }
}

// ─── Generate JSON terstruktur ───────────────────────────────────────────────

/**
 * Generate Structured JSON Output.
 * @param task Jenis task AI
 * @param input Data input (string atau objek, akan di-serialize)
 * @param retryCount Dipertahankan untuk kompatibilitas; retry validasi kini ditangani internal.
 */
export async function generateJSON<T = any>(task: AITask, input: any, retryCount: number = 0): Promise<T> {
  const primary = CONFIG.defaultAiMode === "proxy" ? "proxy" : "direct";
  const run = (mode: "proxy" | "direct") =>
    mode === "proxy" ? generateProxyJSON<T>(task, input) : generateDirectJSON<T>(task, input, retryCount);

  let primaryError: AIServiceError;
  try {
    return await run(primary);
  } catch (err) {
    primaryError = classifyError(err);
    console.warn(`Jalur ${primary} gagal (${primaryError.kind}):`, primaryError.message);
  }

  // Key salah di jalur direct tidak berarti proxy (yang punya key server) ikut gagal, jadi tetap coba fallback.
  const fallback = primary === "proxy" ? "direct" : "proxy";
  try {
    return await run(fallback);
  } catch (err) {
    const fallbackError = classifyError(err);
    console.warn(`Jalur ${fallback} juga gagal (${fallbackError.kind}):`, fallbackError.message);
    // Tampilkan error paling informatif: kuota > auth > primer.
    if (fallbackError.kind === "quota" && primaryError.kind !== "quota") throw fallbackError;
  }

  throw primaryError;
}

async function generateProxyJSON<T>(task: AITask, input: any): Promise<T> {
  const customKey = await storage.getCustomApiKey();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (customKey) headers["x-gemini-api-key"] = customKey;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch("/api/ai", {
      method: "POST",
      headers,
      body: JSON.stringify({ task, input }),
      signal: controller.signal,
    });
  } catch (err: any) {
    throw classifyError(err?.name === "AbortError" ? new Error("timeout: proxy /api/ai") : err);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({} as any));
    throw classifyError(new Error(`HTTP ${response.status}: ${errorData.error || "Gagal memproses permintaan AI via server."}`));
  }

  const result = await response.json();
  const parsed = TASK_ZOD_SCHEMAS[task].safeParse(result);
  if (!parsed.success) {
    console.error("Zod validation gagal pada mode proxy:", parsed.error.issues);
    throw new AIServiceError(`Format data AI dari proxy tidak valid: ${formatZodIssues(parsed.error)}`, "validation", true);
  }
  return parsed.data as T;
}

async function generateDirectJSON<T>(task: AITask, input: any, _retryCount: number): Promise<T> {
  const ai = await getDirectAIClient();
  const systemInstruction = TASK_PROMPTS[task];
  const responseSchema = TASK_GEMINI_SCHEMAS[task] as any;
  const zodSchema = TASK_ZOD_SCHEMAS[task];
  const baseContents = typeof input === "string" ? input : JSON.stringify(input, null, 2);

  let lastError: AIServiceError | null = null;
  let attempt = 0;

  for (const modelName of MODEL_CHAIN) {
    let contents = baseContents;

    // Per model: 1 percobaan awal + MAX_VALIDATION_RETRIES perbaikan jika output gagal validasi.
    for (let v = 0; v <= MAX_VALIDATION_RETRIES; v++) {
      if (attempt > 0) await sleep(backoffDelay(attempt));
      attempt++;

      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema,
              temperature: TASK_TEMPERATURE[task],
            },
          }),
          DIRECT_TIMEOUT_MS,
          `model ${modelName}`
        );

        const rawText = response.text?.trim() || "";
        if (!rawText) throw new AIServiceError(`Model ${modelName} tidak mengembalikan respons.`, "validation", true);

        const parsedJson = extractJson(rawText);
        const validated = zodSchema.safeParse(parsedJson);
        if (validated.success) return validated.data as T;

        const issues = formatZodIssues(validated.error);
        console.warn(`Zod parse error pada ${modelName}:`, validated.error.issues);
        lastError = new AIServiceError(`Output tidak lolos validasi skema: ${issues}`, "validation", true);
        // Beri umpan balik spesifik agar percobaan berikutnya memperbaiki field yang salah.
        contents = `${baseContents}\n\n---\nOUTPUT SEBELUMNYA TIDAK VALID. Perbaiki masalah berikut dan kembalikan ulang JSON lengkap sesuai responseSchema:\n${issues}`;
      } catch (err) {
        lastError = classifyError(err);
        console.warn(`Model ${modelName} kendala (${lastError.kind}): ${lastError.message.slice(0, 120)}`);
        if (!lastError.retryable) throw lastError; // key salah / request invalid: jangan buang waktu ke model lain
        break; // error jaringan/kuota: langsung pindah ke model berikutnya
      }
    }
  }

  console.error("Direct AI Error (semua model gagal):", lastError);
  throw lastError || new AIServiceError("Gagal menghubungi layanan Gemini AI.", "unknown", true);
}

// ─── Embedding ───────────────────────────────────────────────────────────────

/**
 * Hitung embedding untuk banyak teks sekaligus (dibatch).
 * Teks yang gagal diberi vektor nol berdimensi sama dengan hasil asli — pemanggil sebaiknya
 * melewati vektor nol saat menghitung cosine similarity (norma 0 menghasilkan NaN).
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const ai = await getDirectAIClient();
  const results: (number[] | null)[] = new Array(texts.length).fill(null);

  const readValues = (e: any): number[] | null => (Array.isArray(e?.values) && e.values.length ? e.values : null);

  for (let start = 0; start < texts.length; start += EMBED_BATCH_SIZE) {
    const batch = texts.slice(start, start + EMBED_BATCH_SIZE);
    try {
      const response: any = await ai.models.embedContent({ model: EMBED_MODEL, contents: batch });
      const embeddings: any[] = response.embeddings || (response.embedding ? [response.embedding] : []);
      if (embeddings.length !== batch.length) throw new Error(`jumlah embedding ${embeddings.length} ≠ ${batch.length}`);
      embeddings.forEach((e, i) => (results[start + i] = readValues(e)));
    } catch (batchErr) {
      console.warn("Embedding batch gagal, mencoba per teks:", classifyError(batchErr).message);
      for (let i = 0; i < batch.length; i++) {
        try {
          const response: any = await ai.models.embedContent({ model: EMBED_MODEL, contents: batch[i] });
          results[start + i] = readValues(response.embeddings?.[0] ?? response.embedding);
        } catch (e) {
          console.warn("Embedding gagal untuk teks:", batch[i].slice(0, 30), classifyError(e).message);
        }
      }
    }
  }

  const dim = results.find((r) => r)?.length ?? DEFAULT_EMBED_DIM;
  return results.map((r) => r ?? new Array(dim).fill(0));
}
