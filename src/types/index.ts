/**
 * AutoThreads Type Definitions
 */

export type Provenance = "A" | "B" | "C" | "D" | "E";

export type Confidence = "R" | "P" | "H"; // R: Resmi, P: Praktisi, H: Hipotesis

export type NicheType =
  | "Keuangan"
  | "Self-Improvement"
  | "Humor/Relatable"
  | "Curhat/Storytelling"
  | "Bisnis & UMKM"
  | "Teknologi"
  | "Kesehatan Mental"
  | "Parenting"
  | "Hub: Ilmu Praktis"
  | "Hub: Peluang"
  | "Hub: Panggung Warga"
  | "Hub: Soft-selling Produk Digital"
  | "Karier & Dunia Kerja"
  | "Kuliner & Resep"
  | "Travel Hemat"
  | "Fashion & Beauty"
  | "Relationship & Dating"
  | "Pendidikan & Mahasiswa"
  | "Kesehatan & Fitness"
  | "Rumah & Home Living"
  | "Investasi Pemula"
  | "Hub: Opini & Diskusi Hangat"
  | "Hub: Behind The Scenes Kreator"
  | "Hub: Kolaborasi & Komunitas";

export type GoalType = 
  | "Jangkauan" 
  | "Kedekatan" 
  | "Konversi" 
  | "Panggung Warga" 
  | "Soft-selling";

export type ToneType = "santai" | "jujur" | "lucu" | "edukatif";

export interface UserProfile {
  id: string;
  niche: NicheType;
  targetAudience: string;
  tone: ToneType;
  productsServices?: string;
  pastPostSamples?: string[];
  forbiddenTopics?: string[];
  modePreference?: "umum" | "hub";
  createdAt: number;
  updatedAt: number;
}

export interface ReferenceHook {
  id: string;
  card_id: string;
  pola_slot: string;
  contoh_asli: string;
  provenance: Provenance;
  slot_list: string[];
}

export interface ReferenceCard {
  id: string;
  niche: NicheType;
  mode: "umum" | "hub";
  format: string;
  struktur: string;
  emosi: string;
  sinyal_algoritma: string;
  pola_komentar: string;
  pelajaran: string;
  guardrail: string;
  provenance: Provenance;
  hooks: ReferenceHook[];
  status?: "approved" | "pending";
}

export interface AlgorithmRule {
  id: string;
  title: string;
  description: string;
  confidence: Confidence;
  category: "resmi" | "praktisi" | "hipotesis" | "penalti";
}

export interface FusionTrace {
  card_id: string;
  hook_id: string;
  pola_dipinjam: string;
  perubahan_dari_ide_kasar: string;
}

export interface ThreadPostItem {
  order: number;
  text: string;
  char_count: number;
  media_suggestion?: string;
}

export interface VariantOutput {
  id?: string;
  template: string;
  goal: string;
  fusion_trace: FusionTrace;
  hooks: string[];
  posts: ThreadPostItem[];
  reply_2: {
    text: string;
    contains_link: boolean;
  };
  topic_tag: string;
  closing_question: string;
  best_time_wib: string;
  first_30_min_plan: string[];
  algorithm_signal: string;
  signal_confidence: Confidence;
  placeholders_to_fill: string[];
  visual_slides?: string[];
  visual_theme?: "dark" | "paper" | "terminal" | "gradient";
  visual_aspect_ratio?: "1:1" | "4:5";
}

export interface QualityIssue {
  type: string;
  description: string;
  severity: "critical" | "warning" | "suggestion";
  fix: string;
}

export interface CheckerResult {
  score: number;
  issues: QualityIssue[];
  passed: boolean;
}

export interface GenerationOutput {
  idea_dna?: {
    topik_inti: string;
    sudut: string;
    fakta_asli: string[];
    emosi_target: string;
    tujuan: string;
    placeholder_dibutuhkan: string[];
  };
  variants: VariantOutput[];
  recommended_variant: number;
  recommendation_reason: string;
  checker?: CheckerResult;
  timestamp?: number;
}

export interface CalendarDayItem {
  id: string;
  dayNumber: number;
  dayName: string;
  dateStr?: string;
  goal: GoalType;
  pillar: string;
  ideaPrompt: string;
  cardId: string;
  hookPattern: string;
  format: string;
  topicTag: string;
  timeWIB: string;
  replyActionGoal: string; // e.g. "Balas 10-15 akun sejenis"
  status?: "planned" | "drafted" | "posted";
}

export interface CommentReplyVariant {
  id: string;
  strategy: string;
  replyText: string;
  replyDepthGoal: string; // Kenapa ini memancing obrolan lanjut
}

export interface ViralThreadReview {
  niche: string;
  hookAnalysis: {
    hookText: string;
    whyEffective: string;
  };
  structure: {
    postCount: number;
    visualUsed: boolean;
    flowDescription: string;
  };
  emotionalTrigger: string;
  algorithmSignal: string;
  commentPattern: string;
  frameworkLesson: string;
  draftCard: {
    niche: NicheType;
    mode: "umum" | "hub";
    format: string;
    struktur: string;
    emosi: string;
    sinyal_algoritma: string;
    pola_komentar: string;
    pelajaran: string;
    guardrail: string;
    pola_hook: string;
    contoh_hook: string;
    provenance: Provenance;
  };
}

export interface MetricEntry {
  id: string;
  date: string;
  variantId?: string;
  topicTag: string;
  hookType: string;
  timeWIB: string;
  views: number;
  likes: number;
  replies: number;
  replyDepth: number;
  profileVisits: number;
  follows: number;
  first60MinInteractions: number;
  // Computed values:
  replyToLike: number | null;
  velocity60: number;
  engagementRate: number | null;
  cardId?: string;
  notes?: string;
  // Metadata Utas Asli
  postText?: string;
  permalink?: string;
  mediaType?: string;
}

export interface CardUserWeight {
  cardId: string;
  weight: number;
  postCount: number;
  medianRtl: number | null;
  lastUpdated: number;
}

export type TimeSlotType = "pagi" | "siang" | "malam" | "custom";
export type ScheduledStatus = "queued" | "publishing" | "published" | "failed" | "cancelled";

export interface ScheduledThreadItem {
  id: string;
  variant: VariantOutput;
  scheduledTimeISO: string; // Target waktu eksekusi ISO (WIB UTC+7)
  timeSlot: TimeSlotType;
  status: ScheduledStatus;
  publishedAt?: number;
  permalink?: string;
  errorMessage?: string;
  retryCount: number; // Maksimal 3x percobaan
  createdAt?: number;
}
