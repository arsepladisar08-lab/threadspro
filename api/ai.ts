import type { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { TASK_PROMPTS, TASK_GEMINI_SCHEMAS, TASK_ZOD_SCHEMAS, AITask } from "../src/services/ai";
import { TEXT_MODEL, FALLBACK_MODELS } from "../src/config";

// In-memory rate limiting map: ip -> { count, resetTime }
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 menit
const MAX_REQUESTS_PER_MINUTE = 20;

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Hanya metode POST yang diizinkan." });
  }

  // Rate Limiting per IP
  const clientIp = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").toString();
  const now = Date.now();
  const clientLimit = rateLimitMap.get(clientIp);

  if (clientLimit && now < clientLimit.resetTime) {
    if (clientLimit.count >= MAX_REQUESTS_PER_MINUTE) {
      return res.status(429).json({ error: "Terlalu banyak permintaan. Silakan tunggu 1 menit." });
    }
    clientLimit.count++;
  } else {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  }

  const { task, input } = req.body || {};

  if (!task || !input) {
    return res.status(400).json({ error: "Payload wajib menyertakan 'task' dan 'input'." });
  }

  const systemInstruction = TASK_PROMPTS[task as AITask];
  const responseSchema = TASK_GEMINI_SCHEMAS[task as AITask];
  const zodSchema = TASK_ZOD_SCHEMAS[task as AITask];

  if (!systemInstruction || !responseSchema) {
    return res.status(400).json({ error: `Task '${task}' tidak dikenali oleh sistem.` });
  }

  const customHeaderKey = (req.headers["x-gemini-api-key"] || "").toString().trim();
  const apiKey = (customHeaderKey || process.env.GEMINI_API_KEY || process.env.API_KEY || "").trim();
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY belum dikonfigurasi di server atau input mandiri." });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const contents = typeof input === "string" ? input : JSON.stringify(input);

    let lastError: any = null;
    let validatedData: any = null;

    for (const modelName of FALLBACK_MODELS) {
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
        if (!rawText) continue;

        // Bersihkan markdown code fences jika ada ```json ... ```
        if (rawText.startsWith("```")) {
          rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        }

        const parsedJson = JSON.parse(rawText);
        const validated = zodSchema.safeParse(parsedJson);

        if (!validated.success) {
          console.warn(`Server Zod Warning on ${modelName}:`, validated.error.issues);
          // Jika output berupa objek JSON yang valid, selamatkan datanya alih-alih dibuang
          if (parsedJson && typeof parsedJson === "object") {
            validatedData = parsedJson;
            break;
          }
          continue;
        }

        validatedData = validated.data;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} gagal: ${err.message?.slice(0, 80)}, mencoba fallback...`);
      }
    }

    if (!validatedData) {
      const errStr = lastError?.message || "";
      const isQuota =
        errStr.includes("429") ||
        errStr.toLowerCase().includes("quota") ||
        errStr.toLowerCase().includes("resource_exhausted") ||
        errStr.toLowerCase().includes("rate limit");

      const statusCode = isQuota ? 429 : 502;
      const userMessage = isQuota
        ? "Kuota model AI Gemini habis atau mencapai batas limit (HTTP 429 Resource Exhausted). Silakan tunggu beberapa saat atau masukkan Gemini API Key mandiri."
        : errStr || "Semua model AI sedang sibuk. Silakan coba kembali sesaat lagi.";

      return res.status(statusCode).json({
        error: userMessage,
        details: errStr,
      });
    }

    return res.status(200).json(validatedData);
  } catch (err: any) {
    console.error("AI Proxy Error:", err);
    return res.status(500).json({ error: err.message || "Kegagalan internal pada proxy AI." });
  }
}
