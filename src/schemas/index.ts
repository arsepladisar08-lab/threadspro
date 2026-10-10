/**
 * Gemini responseSchema & Zod validation schemas
 */

import { Type } from "@google/genai";
import { z } from "zod";

// ==================== ZOD SCHEMAS ====================

export const IdeaDnaZodSchema = z.object({
  topik_inti: z.preprocess((v) => String(v || "Topik Utama"), z.string()).default("Topik Utama"),
  sudut: z.preprocess((v) => String(v || "Sudut Pandang Relatable"), z.string()).default("Sudut Pandang Relatable"),
  fakta_asli: z.preprocess((v) => (Array.isArray(v) ? v.map(String) : typeof v === "string" ? [v] : []), z.array(z.string())).default([]),
  emosi_target: z.preprocess((v) => String(v || "Relatable"), z.string()).default("Relatable"),
  tujuan: z.preprocess((v) => String(v || "Jangkauan"), z.string()).default("Jangkauan"),
  placeholder_dibutuhkan: z.preprocess((v) => (Array.isArray(v) ? v.map(String) : []), z.array(z.string())).default([]),
});

export const ThreadPostItemZodSchema = z.preprocess(
  (v: any) => {
    if (typeof v === "string") {
      return { order: 1, text: v, char_count: v.length, media_suggestion: "" };
    }
    return {
      order: Number(v?.order) || 1,
      text: String(v?.text || ""),
      char_count: Number(v?.char_count) || (v?.text ? String(v.text).length : 0),
      media_suggestion: String(v?.media_suggestion || ""),
    };
  },
  z.object({
    order: z.number().default(1),
    text: z.string().default(""),
    char_count: z.number().default(0),
    media_suggestion: z.string().default(""),
  })
);

export const VariantZodSchema = z.object({
  template: z.preprocess((v) => String(v || "hook_angka"), z.string()).default("hook_angka"),
  goal: z.preprocess((v) => String(v || "Jangkauan"), z.string()).default("Jangkauan"),
  fusion_trace: z.preprocess(
    (v: any) => ({
      card_id: String(v?.card_id || "K01"),
      hook_id: String(v?.hook_id || "H1"),
      pola_dipinjam: String(v?.pola_dipinjam || "Pola Hook & Alur Emosi"),
      perubahan_dari_ide_kasar: String(v?.perubahan_dari_ide_kasar || "Fusi fakta & pola"),
    }),
    z.object({
      card_id: z.string().default("K01"),
      hook_id: z.string().default("H1"),
      pola_dipinjam: z.string().default("Pola Hook"),
      perubahan_dari_ide_kasar: z.string().default("Transformasi ide"),
    })
  ).default({ card_id: "K01", hook_id: "H1", pola_dipinjam: "Pola", perubahan_dari_ide_kasar: "Fusi" }),
  hooks: z.preprocess(
    (v) => (Array.isArray(v) && v.length > 0 ? v.map(String) : ["Hook pembuka utama"]),
    z.array(z.string()).min(1)
  ).default(["Hook pembuka"]),
  posts: z.preprocess(
    (v) => (Array.isArray(v) && v.length > 0 ? v : [v || ""]),
    z.array(ThreadPostItemZodSchema).min(1)
  ),
  reply_2: z.preprocess(
    (v: any) => ({
      text: String(v?.text || ""),
      contains_link: Boolean(v?.contains_link),
    }),
    z.object({
      text: z.string().default(""),
      contains_link: z.boolean().default(false),
    })
  ).default({ text: "", contains_link: false }),
  topic_tag: z.preprocess((v) => String(v || "Diskusi").replace(/#/g, "").trim(), z.string()).default("Diskusi"),
  closing_question: z.preprocess((v) => String(v || ""), z.string()).default(""),
  best_time_wib: z.preprocess((v) => String(v || "19.30 - 22.30 WIB"), z.string()).default("19.30 - 22.30 WIB"),
  first_30_min_plan: z.preprocess((v) => (Array.isArray(v) ? v.map(String) : []), z.array(z.string())).default([]),
  algorithm_signal: z.preprocess((v) => String(v || "Reply Velocity"), z.string()).default("Reply Velocity"),
  signal_confidence: z.preprocess((val) => {
    if (typeof val !== "string") return "P";
    const s = val.trim().toUpperCase();
    if (s.startsWith("R")) return "R";
    if (s.startsWith("H")) return "H";
    return "P";
  }, z.enum(["R", "P", "H"])).default("P"),
  placeholders_to_fill: z.preprocess((v) => (Array.isArray(v) ? v.map(String) : []), z.array(z.string())).default([]),
});

export const QualityIssueZodSchema = z.preprocess(
  (v: any) => {
    if (typeof v === "string") {
      return { type: "compliance", description: v, severity: "warning", fix: "Perbaiki format" };
    }
    return {
      type: String(v?.type || "compliance"),
      description: String(v?.description || ""),
      severity: v?.severity,
      fix: String(v?.fix || ""),
    };
  },
  z.object({
    type: z.preprocess((v) => String(v || "compliance"), z.string()).default("compliance"),
    description: z.preprocess((v) => String(v || ""), z.string()).default(""),
    severity: z.preprocess((val) => {
      if (typeof val !== "string") return "warning";
      const s = val.toLowerCase().trim();
      if (s.includes("crit") || s.includes("high") || s.includes("fatal") || s.includes("berat") || s.includes("danger") || s.includes("kritis")) {
        return "critical";
      }
      if (s.includes("sug") || s.includes("saran") || s.includes("low") || s.includes("info") || s.includes("minor") || s.includes("tip")) {
        return "suggestion";
      }
      return "warning";
    }, z.enum(["critical", "warning", "suggestion"])).default("warning"),
    fix: z.preprocess((v) => String(v || ""), z.string()).default(""),
  })
);

export const CriticZodSchema = z.preprocess(
  (v: any) => ({
    score: Number(v?.score) || 85,
    issues: Array.isArray(v?.issues) ? v.issues : [],
    passed: v?.passed !== undefined ? Boolean(v.passed) : true,
  }),
  z.object({
    score: z.number().default(85),
    issues: z.array(QualityIssueZodSchema).default([]),
    passed: z.boolean().default(true),
  })
);

export const WriterZodSchema = z.preprocess(
  (v: any) => {
    if (Array.isArray(v)) {
      return { variants: v, recommended_variant: 1, recommendation_reason: "Varian rekomendasi utama" };
    }
    if (v && typeof v === "object") {
      const rawVars = Array.isArray(v.variants)
        ? v.variants
        : v.variant
        ? Array.isArray(v.variant)
          ? v.variant
          : [v.variant]
        : [];
      return {
        ...v,
        variants: rawVars.length > 0 ? rawVars : [{ template: "hook_angka", goal: "Jangkauan", posts: [{ order: 1, text: "Draf utas..." }] }],
      };
    }
    return { variants: [] };
  },
  z.object({
    variants: z.array(VariantZodSchema).min(1),
    recommended_variant: z.preprocess((v) => Number(v) || 1, z.number()).default(1),
    recommendation_reason: z.preprocess((v) => String(v || "Varian paling terstruktur"), z.string()).default("Varian paling terstruktur"),
    checker: z.preprocess(
      (v: any) =>
        v
          ? {
              score: Number(v.score) || 85,
              issues: Array.isArray(v.issues) ? v.issues : [],
            }
          : undefined,
      z.object({
        score: z.number().default(85),
        issues: z.array(QualityIssueZodSchema).default([]),
      }).optional()
    ),
  })
);

export const ReplyZodSchema = z.preprocess(
  (v: any) => {
    if (Array.isArray(v)) {
      return { replies: v };
    }
    return v;
  },
  z.object({
    replies: z.array(
      z.preprocess(
        (v: any) => {
          if (typeof v === "string") {
            return { id: `r_${Date.now()}`, strategy: "Empathy", replyText: v, replyDepthGoal: "Memicu diskusi" };
          }
          return {
            id: String(v?.id || `r_${Date.now()}`),
            strategy: String(v?.strategy || "Empathy"),
            replyText: String(v?.replyText || v?.text || ""),
            replyDepthGoal: String(v?.replyDepthGoal || "Memicu balasan dua arah"),
          };
        },
        z.object({
          id: z.string().default("r_1"),
          strategy: z.string().default("Empathy"),
          replyText: z.string().default(""),
          replyDepthGoal: z.string().default("Memicu balasan dua arah"),
        })
      )
    ).min(1),
  })
);

export const ReviewZodSchema = z.preprocess(
  (v: any) => {
    const rawDraft = v?.draftCard || {};
    return {
      niche: String(v?.niche || rawDraft.niche || "Keuangan"),
      hookAnalysis: {
        hookText: String(v?.hookAnalysis?.hookText || ""),
        whyEffective: String(v?.hookAnalysis?.whyEffective || ""),
      },
      structure: {
        postCount: Number(v?.structure?.postCount) || 3,
        visualUsed: Boolean(v?.structure?.visualUsed),
        flowDescription: String(v?.structure?.flowDescription || ""),
      },
      emotionalTrigger: String(v?.emotionalTrigger || ""),
      algorithmSignal: String(v?.algorithmSignal || ""),
      commentPattern: String(v?.commentPattern || ""),
      frameworkLesson: String(v?.frameworkLesson || ""),
      draftCard: {
        niche: String(rawDraft.niche || "Keuangan"),
        mode: String(rawDraft.mode || "umum").toLowerCase().includes("hub") ? "hub" : "umum",
        format: String(rawDraft.format || "Storytelling"),
        struktur: String(rawDraft.struktur || "Refleksi"),
        emosi: String(rawDraft.emosi || "Relatable"),
        sinyal_algoritma: String(rawDraft.sinyal_algoritma || "Conversation"),
        pola_komentar: String(rawDraft.pola_komentar || "Diskusi"),
        pelajaran: String(rawDraft.pelajaran || "Pelajaran"),
        guardrail: String(rawDraft.guardrail || "Aman"),
        pola_hook: String(rawDraft.pola_hook || "Pola"),
        contoh_hook: String(rawDraft.contoh_hook || "Contoh"),
        provenance: ["A", "B", "C", "D", "E"].includes(String(rawDraft.provenance || "").toUpperCase().trim())
          ? String(rawDraft.provenance).toUpperCase().trim()
          : "B",
      },
    };
  },
  z.object({
    niche: z.string().default("Keuangan"),
    hookAnalysis: z.object({
      hookText: z.string().default(""),
      whyEffective: z.string().default(""),
    }),
    structure: z.object({
      postCount: z.number().default(3),
      visualUsed: z.boolean().default(false),
      flowDescription: z.string().default(""),
    }),
    emotionalTrigger: z.string().default(""),
    algorithmSignal: z.string().default(""),
    commentPattern: z.string().default(""),
    frameworkLesson: z.string().default(""),
    draftCard: z.object({
      niche: z.string().default("Keuangan"),
      mode: z.enum(["umum", "hub"]).default("umum"),
      format: z.string().default("Storytelling"),
      struktur: z.string().default("Refleksi"),
      emosi: z.string().default("Relatable"),
      sinyal_algoritma: z.string().default("Conversation"),
      pola_komentar: z.string().default("Diskusi"),
      pelajaran: z.string().default("Pelajaran"),
      guardrail: z.string().default("Aman"),
      pola_hook: z.string().default("Pola"),
      contoh_hook: z.string().default("Contoh"),
      provenance: z.enum(["A", "B", "C", "D", "E"]).default("B"),
    }),
  })
);

export const CalendarDayZodSchema = z.preprocess(
  (v: any) => ({
    dayNumber: Number(v?.dayNumber) || 1,
    dayName: String(v?.dayName || "Hari 1"),
    goal: String(v?.goal || "Jangkauan"),
    pillar: String(v?.pillar || "Topik"),
    ideaPrompt: String(v?.ideaPrompt || "Ide"),
    cardId: String(v?.cardId || "K01"),
    hookPattern: String(v?.hookPattern || "Hook"),
    format: String(v?.format || "Format"),
    topicTag: String(v?.topicTag || "Diskusi").replace(/#/g, ""),
    timeWIB: String(v?.timeWIB || "19.30 - 22.30 WIB"),
    replyActionGoal: String(v?.replyActionGoal || "Balas komentar awal"),
  }),
  z.object({
    dayNumber: z.number().default(1),
    dayName: z.string().default("Hari 1"),
    goal: z.string().default("Jangkauan"),
    pillar: z.string().default("Topik"),
    ideaPrompt: z.string().default("Ide"),
    cardId: z.string().default("K01"),
    hookPattern: z.string().default("Hook"),
    format: z.string().default("Format"),
    topicTag: z.string().default("Diskusi"),
    timeWIB: z.string().default("19.30 - 22.30 WIB"),
    replyActionGoal: z.string().default("Balas komentar awal"),
  })
);

export const CalendarZodSchema = z.preprocess(
  (v: any) => {
    if (Array.isArray(v)) {
      return { days: v, weeklyTheme: "Tema Mingguan", summaryRationale: "Strategi konten" };
    }
    return {
      days: Array.isArray(v?.days) ? v.days : [],
      weeklyTheme: String(v?.weeklyTheme || "Tema Mingguan"),
      summaryRationale: String(v?.summaryRationale || "Alasan dan strategi"),
    };
  },
  z.object({
    days: z.array(CalendarDayZodSchema).min(1),
    weeklyTheme: z.string().default("Tema Mingguan"),
    summaryRationale: z.string().default("Alasan dan strategi"),
  })
);

export const YoutubeAngleItemZodSchema = z.preprocess(
  (v: any) => ({
    id: Number(v?.id) || 1,
    angle_title: String(v?.angle_title || "Angle Utas"),
    hook_preview: String(v?.hook_preview || ""),
    summary: String(v?.summary || ""),
    key_takeaways: Array.isArray(v?.key_takeaways) ? v.key_takeaways.map(String) : [],
    suggested_goal: String(v?.suggested_goal || "Jangkauan"),
  }),
  z.object({
    id: z.number().default(1),
    angle_title: z.string().default("Angle Utas"),
    hook_preview: z.string().default(""),
    summary: z.string().default(""),
    key_takeaways: z.array(z.string()).default([]),
    suggested_goal: z.string().default("Jangkauan"),
  })
);

export const YoutubeAnglesOutputZodSchema = z.preprocess(
  (v: any) => ({
    video_title: String(v?.video_title || "Video YouTube"),
    creator_name: String(v?.creator_name || "Kreator YouTube"),
    video_summary: String(v?.video_summary || ""),
    angles: Array.isArray(v?.angles) ? v.angles : [],
  }),
  z.object({
    video_title: z.string().default("Video YouTube"),
    creator_name: z.string().default("Kreator YouTube"),
    video_summary: z.string().default(""),
    angles: z.array(YoutubeAngleItemZodSchema).min(1).default([]),
  })
);

export const AffiliateProductZodSchema = z.preprocess(
  (v: any) => ({
    product_name: String(v?.product_name || "Produk Affiliate"),
    price: String(v?.price || "Rp99.000"),
    features:
      Array.isArray(v?.features) && v.features.length > 0
        ? v.features.map(String)
        : [
            "Bahan berkualitas dan tahan lama",
            "Membantu menghemat waktu dan tenaga",
            "Harga terjangkau dengan nilai guna tinggi",
          ],
    target_audience: String(v?.target_audience || "Pengguna yang mencari solusi praktis"),
    niche_category: String(v?.niche_category || "Produk Bermanfaat"),
  }),
  z.object({
    product_name: z.string().default("Produk Affiliate"),
    price: z.string().default("Rp99.000"),
    features: z.array(z.string()).default([]),
    target_audience: z.string().default("Pengguna yang mencari solusi praktis"),
    niche_category: z.string().default("Produk Bermanfaat"),
  })
);

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
          signal_confidence: {
            type: Type.STRING,
            enum: ["R", "P", "H"],
          },
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
              severity: {
                type: Type.STRING,
                enum: ["critical", "warning", "suggestion"],
              },
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
          severity: {
            type: Type.STRING,
            enum: ["critical", "warning", "suggestion"],
          },
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

export const GEMINI_YOUTUBE_ANGLES_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    video_title: { type: Type.STRING },
    creator_name: { type: Type.STRING },
    video_summary: { type: Type.STRING },
    angles: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          angle_title: { type: Type.STRING },
          hook_preview: { type: Type.STRING },
          summary: { type: Type.STRING },
          key_takeaways: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          suggested_goal: { type: Type.STRING },
        },
        required: ["id", "angle_title", "hook_preview", "summary", "key_takeaways", "suggested_goal"],
      },
    },
  },
  required: ["video_title", "creator_name", "video_summary", "angles"],
};

export const GEMINI_AFFILIATE_PRODUCT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    product_name: { type: Type.STRING },
    price: { type: Type.STRING },
    features: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    target_audience: { type: Type.STRING },
    niche_category: { type: Type.STRING },
  },
  required: ["product_name", "price", "features", "target_audience", "niche_category"],
};
