/**
 * AutoThreads Configuration
 * Model, environment, and system constants
 */

export const TEXT_MODEL = "gemini-3.1-flash-lite";
export const EMBED_MODEL = "gemini-embedding-2-preview";
export const FALLBACK_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
  "gemini-flash-latest",
  "gemini-3.8-flash",
];

export const CONFIG = {
  appName: "AutoThreads",
  version: "1.0.0",
  textModel: TEXT_MODEL,
  embedModel: EMBED_MODEL,
  defaultAiMode: (import.meta.env?.VITE_AI_MODE || "direct") as "direct" | "proxy",
  storageAdapter: (import.meta.env?.VITE_STORAGE || "local") as "local" | "supabase",
  threadsMock: import.meta.env?.VITE_THREADS_MOCK === "true", // default false (non-mock mode)
  provenanceWeights: {
    E: 1.0, // Terbukti di akun sendiri
    D: 0.7, // Threads keyword search
    A: 0.5, // Klaim viral dengan angka dari ulasan Meta AI
    B: 0.4, // Klaim works tanpa angka
    C: 0.2, // Pola hipotetis
  },
  limits: {
    maxPostChars: 500,
    idealReplyToLike: 0.15,
    maxTopicTags: 1,
    minCriticPassScore: 70,
  },
  peakHoursWIB: [
    { label: "Pagi", range: "07.30 - 09.00 WIB", desc: "Cocok untuk pertanyaan ringan, relatable, & pembuka hari" },
    { label: "Siang", range: "12.00 - 13.30 WIB", desc: "Cocok untuk tips singkat, observasi, & diskusi istirahat" },
    { label: "Malam", range: "19.30 - 22.30 WIB", desc: "Prime time untuk storytelling, curhat mendalam, & ilmu praktis" },
  ],
};
