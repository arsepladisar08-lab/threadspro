import type { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { TASK_PROMPTS, TASK_GEMINI_SCHEMAS, TASK_ZOD_SCHEMAS, AITask } from "../src/services/ai";
import { TEXT_MODEL } from "../src/config";

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

  const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || "").trim();
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY belum dikonfigurasi di server." });
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
      return res.status(502).json({ error: "Model AI tidak mengembalikan teks jawaban." });
    }

    const parsedJson = JSON.parse(rawText);
    const validated = zodSchema.safeParse(parsedJson);

    if (!validated.success) {
      console.error("Server Zod Error:", validated.error);
      return res.status(502).json({
        error: "Respons AI tidak sesuai skema validasi server.",
        details: validated.error.issues,
      });
    }

    return res.status(200).json(validated.data);
  } catch (err: any) {
    console.error("AI Proxy Error:", err);
    return res.status(500).json({ error: err.message || "Kegagalan internal pada proxy AI." });
  }
}
