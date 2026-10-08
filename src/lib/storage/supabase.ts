/**
 * Supabase Storage Adapter & REST Client
 * Menyediakan sinkronisasi ke tabel PostgreSQL Supabase dengan Row Level Security
 * Jika Supabase URL & Anon Key disetel, adapter ini mengarahkan operasi data ke Supabase REST API
 * dengan fallback mulus ke IndexedDB lokal jika koneksi gagal atau offline.
 */

import {
  UserProfile,
  GenerationOutput,
  CalendarDayItem,
  MetricEntry,
  CardUserWeight,
  ReferenceCard,
  ScheduledThreadItem,
  ScheduledStatus,
} from "../../types";

const SUPABASE_URL = (import.meta.env?.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes("your-project.supabase.co") &&
  !SUPABASE_ANON_KEY.includes("your-anon-key")
);

interface SupabaseResponse<T = any> {
  data: T | null;
  error: Error | null;
}

/**
 * Lightweight Supabase PostgREST client tanpa dependensi eksternal berat
 */
async function supabaseFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<SupabaseResponse<T>> {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error("Supabase credentials not configured") };
  }

  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      return {
        data: null,
        error: new Error(`Supabase error [${res.status}]: ${errBody || res.statusText}`),
      };
    }
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await res.json();
      return { data: json, error: null };
    }
    return { data: null, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export const supabaseAdapter = {
  isConfigured(): boolean {
    return isSupabaseConfigured;
  },

  // User Profile
  async getProfile(): Promise<UserProfile | null> {
    const res = await supabaseFetch<UserProfile[]>("autothreads_profiles?select=*&limit=1");
    if (res.data && res.data.length > 0) {
      return res.data[0];
    }
    return null;
  },

  async saveProfile(profile: UserProfile): Promise<boolean> {
    const res = await supabaseFetch("autothreads_profiles", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(profile),
    });
    return !res.error;
  },

  // Generations
  async getGenerations(): Promise<GenerationOutput[]> {
    const res = await supabaseFetch<GenerationOutput[]>(
      "autothreads_generations?select=*&order=created_at.desc&limit=50"
    );
    return res.data || [];
  },

  async saveGeneration(gen: GenerationOutput): Promise<boolean> {
    const res = await supabaseFetch("autothreads_generations", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(gen),
    });
    return !res.error;
  },

  // Calendar
  async getCalendar(): Promise<CalendarDayItem[]> {
    const res = await supabaseFetch<CalendarDayItem[]>(
      "autothreads_calendar?select=*&order=day_number.asc"
    );
    return res.data || [];
  },

  async saveCalendar(items: CalendarDayItem[]): Promise<boolean> {
    const res = await supabaseFetch("autothreads_calendar", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(items),
    });
    return !res.error;
  },

  // Metrics
  async getMetrics(): Promise<MetricEntry[]> {
    const res = await supabaseFetch<MetricEntry[]>(
      "autothreads_metrics?select=*&order=published_at.desc"
    );
    return res.data || [];
  },

  async saveMetric(entry: MetricEntry): Promise<boolean> {
    const res = await supabaseFetch("autothreads_metrics", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(entry),
    });
    return !res.error;
  },

  async deleteMetric(id: string): Promise<boolean> {
    const res = await supabaseFetch(`autothreads_metrics?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return !res.error;
  },

  // Scheduled Queue
  async getScheduledQueue(): Promise<ScheduledThreadItem[]> {
    const res = await supabaseFetch<ScheduledThreadItem[]>(
      "autothreads_queue?select=*&order=scheduled_time.asc"
    );
    return res.data || [];
  },

  async saveScheduledThread(item: ScheduledThreadItem): Promise<boolean> {
    const res = await supabaseFetch("autothreads_queue", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(item),
    });
    return !res.error;
  },

  async removeScheduledThread(id: string): Promise<boolean> {
    const res = await supabaseFetch(`autothreads_queue?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return !res.error;
  },

  async updateScheduledStatus(
    id: string,
    status: ScheduledStatus,
    updates?: Partial<ScheduledThreadItem>
  ): Promise<boolean> {
    const payload = { status, ...(updates || {}) };
    const res = await supabaseFetch(`autothreads_queue?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return !res.error;
  },

  // Custom Cards
  async getCustomCards(): Promise<ReferenceCard[]> {
    const res = await supabaseFetch<ReferenceCard[]>("autothreads_custom_cards?select=*");
    return res.data || [];
  },

  async saveCustomCard(card: ReferenceCard): Promise<boolean> {
    const res = await supabaseFetch("autothreads_custom_cards", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(card),
    });
    return !res.error;
  },

  // Card Weights
  async getCardWeights(): Promise<Record<string, CardUserWeight>> {
    const res = await supabaseFetch<{ card_id: string; weight_data: CardUserWeight }[]>(
      "autothreads_card_weights?select=*"
    );
    if (!res.data) return {};
    const result: Record<string, CardUserWeight> = {};
    for (const row of res.data) {
      if (row.card_id && row.weight_data) {
        result[row.card_id] = row.weight_data;
      }
    }
    return result;
  },

  async saveCardWeight(weight: CardUserWeight): Promise<boolean> {
    const res = await supabaseFetch("autothreads_card_weights", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({ card_id: weight.cardId, weight_data: weight }),
    });
    return !res.error;
  },
};
