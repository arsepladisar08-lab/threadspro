/**
 * AutoThreads AI Service
 * Satu pintu penghubung Gemini: Mode Direct (Preview AI Studio) vs Proxy (Produksi Vercel)
 */

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { TEXT_MODEL, EMBED_MODEL, CONFIG } from "../config";
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

function getDirectAIClient(): GoogleGenAI {
  if (!clientGenAI) {
    const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || "").trim();
    if (!apiKey) {
      console.warn("AutoThreads: GEMINI_API_KEY tidak ditemukan di environment.");
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

  // 1. Mode PROXY (Vercel Production)
  if (mode === "proxy") {
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, input }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Gagal memproses permintaan AI.`);
      }

      const result = await response.json();
      const zodValidator = TASK_ZOD_SCHEMAS[task];
      const parsed = zodValidator.safeParse(result);
      if (!parsed.success) {
        if (retryCount < 1) {
          console.warn("Zod validation gagal pada mode proxy, mencoba ulang 1x...", parsed.error);
          return generateJSON<T>(task, input, retryCount + 1);
        }
        throw new Error("Format respons AI tidak sesuai skema terverifikasi.");
      }
      return parsed.data as T;
    } catch (err: any) {
      // Jika mode proxy gagal dan di dev/preview, fallback ke direct
      if (import.meta.env.DEV) {
        console.warn("Proxy gagal, beralih sementara ke Direct mode:", err.message);
        return generateDirectJSON<T>(task, input, retryCount);
      }
      throw err;
    }
  }

  // 2. Mode DIRECT (Preview AI Studio)
  return generateDirectJSON<T>(task, input, retryCount);
}

/**
 * Pemanggilan langsung Gemini SDK di browser (Direct mode untuk Preview AI Studio)
 */
async function generateDirectJSON<T>(
  task: AITask,
  input: any,
  retryCount: number
): Promise<T> {
  const ai = getDirectAIClient();
  const systemInstruction = TASK_PROMPTS[task];
  const responseSchema = TASK_GEMINI_SCHEMAS[task];
  const zodSchema = TASK_ZOD_SCHEMAS[task];

  const contents = typeof input === "string" ? input : JSON.stringify(input, null, 2);

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.7,
      },
    });

    const rawText = response.text?.trim() || "";
    if (!rawText) {
      throw new Error("Model Gemini tidak mengembalikan respons teks.");
    }

    const parsedJson = JSON.parse(rawText);
    const validated = zodSchema.safeParse(parsedJson);

    if (!validated.success) {
      console.warn("Zod parse gagal:", validated.error);
      if (retryCount < 1) {
        console.log("Mencoba retry 1x dengan penegasan format...");
        return generateDirectJSON<T>(task, { ...input, _retryNote: "Pastikan valid JSON murni sesuai schema." }, retryCount + 1);
      }
      throw new Error(`Data AI tidak lolos validasi Zod: ${validated.error.issues[0]?.message}`);
    }

    return validated.data as T;
  } catch (error: any) {
    console.error("Direct AI Error:", error);
    if (retryCount < 1) {
      return generateDirectJSON<T>(task, input, retryCount + 1);
    }
    throw new Error(error.message || "Gagal menghubungi layanan Gemini AI.");
  }
}

/**
 * Menghitung embedding untuk teks menggunakan EMBED_MODEL
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const ai = getDirectAIClient();
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
