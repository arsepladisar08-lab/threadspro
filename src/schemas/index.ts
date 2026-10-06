/**
 * Gemini responseSchema & Zod validation schemas
 */

import { Type } from "@google/genai";
import { z } from "zod";

// ==================== ZOD SCHEMAS ====================

export const IdeaDnaZodSchema = z.object({
  topik_inti: z.string(),
  sudut: z.string(),
  fakta_asli: z.array(z.string()).default([]),
  emosi_target: z.string(),
  tujuan: z.string(),
  placeholder_dibutuhkan: z.array(z.string()).default([]),
});

export const ThreadPostItemZodSchema = z.object({
  order: z.number(),
  text: z.string(),
  char_count: z.number().optional().default(0),
  media_suggestion: z.string().optional().default(""),
});

export const VariantZodSchema = z.object({
  template: z.string(),
  goal: z.string(),
  fusion_trace: z.object({
    card_id: z.string().default("K01"),
    hook_id: z.string().default("H1"),
    pola_dipinjam: z.string(),
    perubahan_dari_ide_kasar: z.string(),
  }),
  hooks: z.array(z.string()).min(1),
  posts: z.array(ThreadPostItemZodSchema).min(1),
  reply_2: z.object({
    text: z.string().default(""),
    contains_link: z.boolean().default(false),
  }),
  topic_tag: z.string(),
  closing_question: z.string(),
  best_time_wib: z.string(),
  first_30_min_plan: z.array(z.string()).default([]),
  algorithm_signal: z.string(),
  signal_confidence: z.enum(["R", "P", "H"]).default("P"),
  placeholders_to_fill: z.array(z.string()).default([]),
});

export const QualityIssueZodSchema = z.object({
  type: z.string(),
  description: z.string(),
  severity: z.enum(["critical", "warning", "suggestion"]).default("warning"),
  fix: z.string(),
});

export const CriticZodSchema = z.object({
  score: z.number().min(0).max(100),
  issues: z.array(QualityIssueZodSchema).default([]),
  passed: z.boolean().default(true),
});

export const WriterZodSchema = z.object({
  variants: z.array(VariantZodSchema).min(1),
  recommended_variant: z.number().default(1),
  recommendation_reason: z.string(),
  checker: z.object({
    score: z.number().default(85),
    issues: z.array(QualityIssueZodSchema).default([]),
  }).optional(),
});

export const ReplyZodSchema = z.object({
  replies: z.array(
    z.object({
      id: z.string(),
      strategy: z.string(),
      replyText: z.string(),
      replyDepthGoal: z.string(),
    })
  ).min(1),
});

export const ReviewZodSchema = z.object({
  niche: z.string(),
  hookAnalysis: z.object({
    hookText: z.string(),
    whyEffective: z.string(),
  }),
  structure: z.object({
    postCount: z.number().default(3),
    visualUsed: z.boolean().default(false),
    flowDescription: z.string(),
  }),
  emotionalTrigger: z.string(),
  algorithmSignal: z.string(),
  commentPattern: z.string(),
  frameworkLesson: z.string(),
  draftCard: z.object({
    niche: z.string(),
    mode: z.enum(["umum", "hub"]).default("umum"),
    format: z.string(),
    struktur: z.string(),
    emosi: z.string(),
    sinyal_algoritma: z.string(),
    pola_komentar: z.string(),
    pelajaran: z.string(),
    guardrail: z.string(),
    pola_hook: z.string(),
    contoh_hook: z.string(),
    provenance: z.enum(["A", "B", "C", "D", "E"]).default("B"),
  }),
});

export const CalendarDayZodSchema = z.object({
  dayNumber: z.number(),
  dayName: z.string(),
  goal: z.string(),
  pillar: z.string(),
  ideaPrompt: z.string(),
  cardId: z.string(),
  hookPattern: z.string(),
  format: z.string(),
  topicTag: z.string(),
  timeWIB: z.string(),
  replyActionGoal: z.string(),
});

export const CalendarZodSchema = z.object({
  days: z.array(CalendarDayZodSchema).min(1),
  weeklyTheme: z.string(),
  summaryRationale: z.string(),
});

// ==================== GEMINI RESPONSE SCHEMAS ====================

export const GEMINI_IDEA_DNA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    topik_inti: { type: Type.STRING },
    sudut: { type: Type.STRING },
    fakta_asli: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    emosi_target: { type: Type.STRING },
    tujuan: { type: Type.STRING },
    placeholder_dibutuhkan: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ["topik_inti", "sudut", "fakta_asli", "emosi_target", "tujuan", "placeholder_dibutuhkan"],
};

export const GEMINI_WRITER_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    variants: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          template: { type: Type.STRING },
          goal: { type: Type.STRING },
          fusion_trace: {
            type: Type.OBJECT,
            properties: {
              card_id: { type: Type.STRING },
              hook_id: { type: Type.STRING },
              pola_dipinjam: { type: Type.STRING },
              perubahan_dari_ide_kasar: { type: Type.STRING },
            },
            required: ["card_id", "hook_id", "pola_dipinjam", "perubahan_dari_ide_kasar"],
          },
          hooks: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          posts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                order: { type: Type.INTEGER },
                text: { type: Type.STRING },
                char_count: { type: Type.INTEGER },
                media_suggestion: { type: Type.STRING },
              },
              required: ["order", "text"],
            },
          },
          reply_2: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              contains_link: { type: Type.BOOLEAN },
            },
            required: ["text", "contains_link"],
          },
          topic_tag: { type: Type.STRING },
          closing_question: { type: Type.STRING },
          best_time_wib: { type: Type.STRING },
          first_30_min_plan: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          algorithm_signal: { type: Type.STRING },
          signal_confidence: { type: Type.STRING },
          placeholders_to_fill: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: [
          "template",
          "goal",
          "fusion_trace",
          "hooks",
          "posts",
          "reply_2",
          "topic_tag",
          "closing_question",
          "best_time_wib",
          "algorithm_signal",
          "signal_confidence",
        ],
      },
    },
    recommended_variant: { type: Type.INTEGER },
    recommendation_reason: { type: Type.STRING },
    checker: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        issues: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              description: { type: Type.STRING },
              severity: { type: Type.STRING },
              fix: { type: Type.STRING },
            },
            required: ["type", "description", "fix"],
          },
        },
      },
      required: ["score", "issues"],
    },
  },
  required: ["variants", "recommended_variant", "recommendation_reason"],
};

export const GEMINI_CRITIC_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.INTEGER },
    issues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          description: { type: Type.STRING },
          severity: { type: Type.STRING },
          fix: { type: Type.STRING },
        },
        required: ["type", "description", "fix"],
      },
    },
    passed: { type: Type.BOOLEAN },
  },
  required: ["score", "issues", "passed"],
};

export const GEMINI_REPLY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    replies: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          strategy: { type: Type.STRING },
          replyText: { type: Type.STRING },
          replyDepthGoal: { type: Type.STRING },
        },
        required: ["id", "strategy", "replyText", "replyDepthGoal"],
      },
    },
  },
  required: ["replies"],
};

export const GEMINI_REVIEW_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    niche: { type: Type.STRING },
    hookAnalysis: {
      type: Type.OBJECT,
      properties: {
        hookText: { type: Type.STRING },
        whyEffective: { type: Type.STRING },
      },
      required: ["hookText", "whyEffective"],
    },
    structure: {
      type: Type.OBJECT,
      properties: {
        postCount: { type: Type.INTEGER },
        visualUsed: { type: Type.BOOLEAN },
        flowDescription: { type: Type.STRING },
      },
      required: ["postCount", "visualUsed", "flowDescription"],
    },
    emotionalTrigger: { type: Type.STRING },
    algorithmSignal: { type: Type.STRING },
    commentPattern: { type: Type.STRING },
    frameworkLesson: { type: Type.STRING },
    draftCard: {
      type: Type.OBJECT,
      properties: {
        niche: { type: Type.STRING },
        mode: { type: Type.STRING },
        format: { type: Type.STRING },
        struktur: { type: Type.STRING },
        emosi: { type: Type.STRING },
        sinyal_algoritma: { type: Type.STRING },
        pola_komentar: { type: Type.STRING },
        pelajaran: { type: Type.STRING },
        guardrail: { type: Type.STRING },
        pola_hook: { type: Type.STRING },
        contoh_hook: { type: Type.STRING },
        provenance: { type: Type.STRING },
      },
      required: [
        "niche",
        "format",
        "struktur",
        "emosi",
        "sinyal_algoritma",
        "pola_komentar",
        "pelajaran",
        "guardrail",
        "pola_hook",
        "contoh_hook",
      ],
    },
  },
  required: [
    "niche",
    "hookAnalysis",
    "structure",
    "emotionalTrigger",
    "algorithmSignal",
    "commentPattern",
    "frameworkLesson",
    "draftCard",
  ],
};

export const GEMINI_CALENDAR_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    days: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          dayNumber: { type: Type.INTEGER },
          dayName: { type: Type.STRING },
          goal: { type: Type.STRING },
          pillar: { type: Type.STRING },
          ideaPrompt: { type: Type.STRING },
          cardId: { type: Type.STRING },
          hookPattern: { type: Type.STRING },
          format: { type: Type.STRING },
          topicTag: { type: Type.STRING },
          timeWIB: { type: Type.STRING },
          replyActionGoal: { type: Type.STRING },
        },
        required: [
          "dayNumber",
          "dayName",
          "goal",
          "pillar",
          "ideaPrompt",
          "cardId",
          "hookPattern",
          "format",
          "topicTag",
          "timeWIB",
          "replyActionGoal",
        ],
      },
    },
    weeklyTheme: { type: Type.STRING },
    summaryRationale: { type: Type.STRING },
  },
  required: ["days", "weeklyTheme", "summaryRationale"],
};
