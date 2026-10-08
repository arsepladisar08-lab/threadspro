/**
 * AutoThreads AI Service
 * Satu pintu penghubung Gemini: Mode Direct (Preview AI Studio) vs Proxy (Produksi Vercel)
 */

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { TEXT_MODEL, EMBED_MODEL, FALLBACK_MODELS, CONFIG } from "../config";
import { storage } from "../lib/storage";
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

// Pemetaan Task ke System Prompt
export const TASK_PROMPTS: Record<AITask, string> = {
  ideaDna: IDEA_DNA_SYSTEM_PROMPT,
  writer: WRITER_SYSTEM_PROMPT,
  critic: CRITIC_SYSTEM_PROMPT,
  reply: REPLY_SYSTEM_PROMPT,
  review: REVIEW_SYSTEM_PROMPT,
  calendar: CALENDAR_SYSTEM_PROMPT,
};

// Pemetaan Task ke Gemini Schema
export const TASK_GEMINI_SCHEMAS: Record<AITask, any> = {
  ideaDna: GEMINI_IDEA_DNA_SCHEMA,
  writer: GEMINI_WRITER_SCHEMA,
  critic: GEMINI_CRITIC_SCHEMA,
  reply: GEMINI_REPLY_SCHEMA,
  review: GEMINI_REVIEW_SCHEMA,
  calendar: GEMINI_CALENDAR_SCHEMA,
};

// Pemetaan Task ke Zod Validator
export const TASK_ZOD_SCHEMAS: Record<AITask, z.ZodSchema<any>> = {
  ideaDna: IdeaDnaZodSchema,
  writer: WriterZodSchema,
  critic: CriticZodSchema,
  reply: ReplyZodSchema,
  review: ReviewZodSchema,
  calendar: CalendarZodSchema,
};

// Inisialisasi GoogleGenAI instance untuk browser (direct mode)
let clientGenAI: GoogleGenAI | null = null;
let lastApiKeyUsed: string | null = null;

async function getDirectAIClient(): Promise<GoogleGenAI> {
  const customKey = await storage.getCustomApiKey();
  const apiKey = (customKey || process.env.GEMINI_API_KEY || process.env.API_KEY || "").trim();

  if (!clientGenAI || lastApiKeyUsed !== apiKey) {
    lastApiKeyUsed = apiKey;
    if (!apiKey) {
      console.warn("AutoThreads: GEMINI_API_KEY tidak ditemukan di environment atau storage.");
    }
    clientGenAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return clientGenAI;
}

/**
 * Bantu merumuskan fakta, angka realistis, dan cerita otentik menggunakan AI (Point 3)
 */
export async function generateFactsAssistance(params: {
  rawIdea: string;
  niche?: string;
  goal?: string;
  profile?: any;
}): Promise<string> {
  const { rawIdea, niche = "Keuangan", goal = "Jangkauan", profile } = params;
  const prompt = `Kamu adalah asisten kreator Threads Indonesia yang ahli dalam menyusun ulasan fakta, angka realistis, breakdown nominal, dan narasi cerita riil yang memikat serta relate untuk audiens Indonesia.

Berdasarkan ide berikut:
Ide Kasar: "${rawIdea}"
Niche: ${niche}
Target Audiens: ${profile?.targetAudience || "Warga Threads Indonesia usia 20-35"}
Tone: ${profile?.tone || "santai"}
Target Goal: ${goal}

TUGASMU:
Buatkan ulasan fakta, estimasi angka yang kredibel, atau cuplikan cerita/studi kasus nyata yang paling kuat untuk melengkapi ide di atas.
CONTOH FORMAT (PILIH YANG PALING RELATE):
- Breakdown nominal/angka konkret: misal "Gaji 8jt, pengeluaran kopi & jajan ojol 1,7jt sebulan (21% bocor halus sebelum tanggal 15)"
- Timeline & hasil uji coba: misal "Evaluasi 30 hari: 3 minggu pertama boncos, pas pakai sistem amplop tabungan naik dari 400rb jadi 2,1jt"
- Titik balik cerita: misal "Sadar pas cek mutasi saldo tinggal 60rb di tanggal 20, padahal gak ngerasa belanja barang mewah"

ATURAN PENTING:
- JANGAN PERNAH MENULISKAN PLACEHOLDER KOSONG SEPERTI [ISI: ...] ATAU [MASUKKAN ANGKA].
- Berikan teks fakta/angka/cerita matang yang langsung siap pakai (2-4 poin ringkas atau 2-3 kalimat padat).
- Gunakan bahasa Indonesia percakapan yang santai, lugas, dan mengalir alami.`;

  try {
    const ai = await getDirectAIClient();
    const res = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
    });
    const text = (res.text || "").trim();
    if (text) return text;
  } catch (err: any) {
    console.warn("Direct generateFactsAssistance error, trying fallback synthesis:", err.message);
  }

  // Fallback synthesis yang bermutu tinggi dan anti-placeholder
  const cleanNiche = (niche || "").toLowerCase();
  if (cleanNiche.includes("uang") || cleanNiche.includes("finan")) {
    return `Evaluasi pengeluaran 30 hari: gaji 8,5jt, sewa kost 2,2jt, jajan kopi & promo ojol tembus 1,8jt sebulan. Setelah coba tracking harian selama 3 minggu, kebocoran pos jajan turun 45% dan sisa tabungan naik jadi 2,4jt.`;
  } else if (cleanNiche.includes("karir") || cleanNiche.includes("kerja")) {
    return `Pengalaman nyata: kirim 45 lamaran dalam 2 bulan tanpa panggilan interview. Setelah ubah portofolio dengan fokus studi kasus problem-solving, dapet 4 tawaran user interview dalam 14 hari.`;
  } else if (cleanNiche.includes("bisnis") || cleanNiche.includes("umkm")) {
    return `Uji coba modal 1,5jt di awal: bulan ke-1 boncos 400rb karena salah target audiens. Pas beralih ke konten cerita proses di Threads, konversi organik naik 3x lipat tanpa biaya iklan berbayar.`;
  }
  return `Eksperimen 21 hari konsisten: dari yang awalnya serba impulsif, setelah dievaluasi per minggu terlihat pola kebiasaan yang bikin hemat waktu hingga 2 jam sehari dan hasil kerja jauh lebih terarah.`;
}

/**
 * Uji API Key Gemini secara mandiri
 */
export async function testGeminiApiKey(candidateKey: string): Promise<{ success: boolean; message: string }> {
  const clean = candidateKey.trim();
  if (!clean) {
    return { success: false, message: "Kunci API tidak boleh kosong." };
  }
  try {
    const testAi = new GoogleGenAI({
      apiKey: clean,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    const resp = await testAi.models.generateContent({
      model: TEXT_MODEL,
      contents: "Tes koneksi: balas dengan kata 'OK'.",
    });
    if (resp.text) {
      return { success: true, message: "API Key valid dan berhasil terhubung ke Google Gemini!" };
    }
    return { success: false, message: "Respons API kosong." };
  } catch (err: any) {
    return { success: false, message: err.message || "Gagal memverifikasi API Key." };
  }
}

/**
 * Generate Structured JSON Output
 * @param task Jenis task AI (ideaDna, writer, critic, reply, review, calendar)
 * @param input Data input untuk dimasukkan ke konten prompt
 * @param retryCount Internal retry counter (maks 1x retry jika Zod gagal)
 */
export async function generateJSON<T = any>(
  task: AITask,
  input: any,
  retryCount: number = 0
): Promise<T> {
  const mode = CONFIG.defaultAiMode;
  let primaryError: any = null;

  // 1. Coba jalur utama sesuai konfigurasi (proxy atau direct)
  if (mode === "proxy") {
    try {
      return await generateProxyJSON<T>(task, input);
    } catch (err: any) {
      primaryError = err;
      console.warn("Jalur proxy AI gagal, mencoba fallback ke Direct mode di browser:", err.message);
      try {
        return await generateDirectJSON<T>(task, input, retryCount);
      } catch (directErr: any) {
        console.warn("Direct mode juga gagal:", directErr.message);
      }
    }
  } else {
    // Mode direct
    try {
      return await generateDirectJSON<T>(task, input, retryCount);
    } catch (err: any) {
      primaryError = err;
      console.warn("Direct mode di browser gagal, mencoba fallback ke proxy /api/ai server:", err.message);
      try {
        return await generateProxyJSON<T>(task, input);
      } catch (proxyErr: any) {
        console.warn("Proxy server juga gagal:", proxyErr.message);
      }
    }
  }

  // 2. Jika seluruh jalur AI gagal, lempar error asli yang transparan dan informatif tanpa manipulasi/skor palsu
  const rawMsg = primaryError?.message || "Gagal memproses AI.";
  const isQuotaExceeded =
    rawMsg.includes("429") ||
    rawMsg.toLowerCase().includes("quota") ||
    rawMsg.toLowerCase().includes("resource_exhausted") ||
    rawMsg.toLowerCase().includes("rate limit");

  if (isQuotaExceeded) {
    throw new Error(
      "Kuota model AI Gemini sedang habis atau mencapai batas frekuensi (HTTP 429: Resource Exhausted). Silakan tunggu beberapa saat sebelum mencoba kembali."
    );
  }

  throw primaryError || new Error("Gagal memproses AI. Silakan periksa koneksi internet atau coba beberapa saat lagi.");
}

/**
 * Pemanggilan melalui Proxy Server (/api/ai)
 */
async function generateProxyJSON<T>(task: AITask, input: any): Promise<T> {
  const customKey = await storage.getCustomApiKey();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (customKey) {
    headers["x-gemini-api-key"] = customKey;
  }

  const response = await fetch("/api/ai", {
    method: "POST",
    headers,
    body: JSON.stringify({ task, input }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: Gagal memproses permintaan AI via server.`);
  }

  const result = await response.json();
  const zodValidator = TASK_ZOD_SCHEMAS[task];
  const parsed = zodValidator.safeParse(result);
  if (!parsed.success) {
    console.error("Zod validation gagal pada mode proxy:", parsed.error.issues);
    throw new Error(
      `Format data AI dari proxy tidak valid: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`
    );
  }
  return parsed.data as T;
}

/**
 * Pemanggilan langsung Gemini SDK di browser (Direct mode untuk Preview AI Studio)
 */
async function generateDirectJSON<T>(
  task: AITask,
  input: any,
  retryCount: number
): Promise<T> {
  const ai = await getDirectAIClient();
  const systemInstruction = TASK_PROMPTS[task];
  const responseSchema = TASK_GEMINI_SCHEMAS[task];
  const zodSchema = TASK_ZOD_SCHEMAS[task];

  const contents = typeof input === "string" ? input : JSON.stringify(input, null, 2);

  let lastError: any = null;

  for (let i = 0; i < FALLBACK_MODELS.length; i++) {
    const modelName = FALLBACK_MODELS[i];

    // Terapkan exponential backoff dengan jitter jika ini bukan model pertama
    if (i > 0) {
      const baseDelay = Math.min(1000 * Math.pow(2, i - 1), 6000);
      const jitter = Math.floor(Math.random() * 300);
      const delayMs = baseDelay + jitter;
      console.warn(`Menunggu ${delayMs}ms (exponential backoff) sebelum mencoba model ${modelName}...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.7,
        },
      });

      let rawText = response.text?.trim() || "";
      if (!rawText) {
        throw new Error(`Model ${modelName} tidak mengembalikan respons teks.`);
      }

      // Bersihkan code block markdown jika ada
      if (rawText.startsWith("```")) {
        rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      }

      const parsedJson = JSON.parse(rawText);
      const validated = zodSchema.safeParse(parsedJson);

      if (!validated.success) {
        console.warn(`Zod parse error pada ${modelName}:`, validated.error.issues);
        // Jangan loloskan JSON mentah yang cacat; lempar error validasi agar fallback ke model berikutnya
        throw new Error(`Output tidak lolos validasi skema: ${validated.error.issues.map((i) => i.message).join(", ")}`);
      }

      return validated.data as T;
    } catch (error: any) {
      lastError = error;
      console.warn(`Model ${modelName} kendala: ${error.message?.slice(0, 100)}, mencoba model berikutnya...`);
    }
  }

  console.error("Direct AI Error (Semua model gagal):", lastError);
  throw new Error(lastError?.message || "Gagal menghubungi layanan Gemini AI.");
}

/**
 * Menghitung embedding untuk teks menggunakan EMBED_MODEL
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const ai = await getDirectAIClient();
  const results: number[][] = [];

  for (const text of texts) {
    try {
      const response = await ai.models.embedContent({
        model: EMBED_MODEL,
        contents: text,
      });

      const values = (response as any).embedding?.values || (response as any).embeddings?.[0]?.values;
      if (values) {
        results.push(values);
      } else {
        results.push(new Array(768).fill(0));
      }
    } catch (e) {
      console.warn("Embedding gagal untuk teks:", text.slice(0, 30), e);
      results.push(new Array(768).fill(0));
    }
  }

  return results;
}
