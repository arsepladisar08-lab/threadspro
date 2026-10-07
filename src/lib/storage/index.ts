/**
 * AutoThreads Storage Adapter
 * IndexedDB (via idb-keyval) dengan fallback aman & fitur ekspor/impor JSON
 * Kompatibel dengan Browser dan Server Node runtime tanpa ReferenceError
 */

import { get, set, del, keys } from "idb-keyval";
import { UserProfile, GenerationOutput, CalendarDayItem, MetricEntry, CardUserWeight, ReferenceCard, ScheduledThreadItem, ScheduledStatus } from "../../types";

const STORAGE_KEYS = {
  PROFILE: "autothreads_profile",
  GENERATIONS: "autothreads_generations",
  CALENDAR: "autothreads_calendar",
  METRICS: "autothreads_metrics",
  CARD_WEIGHTS: "autothreads_card_weights",
  CUSTOM_CARDS: "autothreads_custom_cards",
  EMBED_CACHE: "autothreads_embed_cache",
  THREADS_ACCOUNT: "autothreads_account",
  THREADS_POSTS: "autothreads_posts",
  THREADS_TOKEN: "autothreads_token",
  CUSTOM_API_KEY: "autothreads_custom_gemini_api_key",
  THREADS_APP_CREDS: "autothreads_threads_app_creds",
  API_PROFILES: "autothreads_api_profiles",
  ONBOARDING_COMPLETED: "autothreads_onboarding_completed",
  SCHEDULED_QUEUE: "autothreads_scheduled_queue",
};

export interface ApiProfile {
  token: string;
  threads_user_id: string;
  username?: string;
  updatedAt?: number;
}

function safeGetLocal(key: string): string | null {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    try {
      return localStorage.getItem(key);
    } catch {}
  }
  return null;
}

function safeSetLocal(key: string, val: string): void {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(key, val);
    } catch {}
  }
}

function safeRemoveLocal(key: string): void {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
}

// ==================== STORAGE IMPLEMENTATION ====================

export const storage = {
  // Profil User
  async getProfile(): Promise<UserProfile | null> {
    try {
      return (await get(STORAGE_KEYS.PROFILE)) || null;
    } catch {
      const local = safeGetLocal(STORAGE_KEYS.PROFILE);
      return local ? JSON.parse(local) : null;
    }
  },

  async saveProfile(profile: UserProfile): Promise<void> {
    try {
      await set(STORAGE_KEYS.PROFILE, profile);
    } catch {
      safeSetLocal(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    }
  },

  // Generasi Utas (Riwayat)
  async getGenerations(): Promise<GenerationOutput[]> {
    try {
      return (await get(STORAGE_KEYS.GENERATIONS)) || [];
    } catch {
      const local = safeGetLocal(STORAGE_KEYS.GENERATIONS);
      return local ? JSON.parse(local) : [];
    }
  },

  async saveGeneration(gen: GenerationOutput): Promise<void> {
    const list = await this.getGenerations();
    const updated = [gen, ...list.slice(0, 49)]; // Simpan 50 generasi terakhir
    try {
      await set(STORAGE_KEYS.GENERATIONS, updated);
    } catch {
      safeSetLocal(STORAGE_KEYS.GENERATIONS, JSON.stringify(updated));
    }
  },

  // Kalender
  async getCalendar(): Promise<CalendarDayItem[]> {
    try {
      return (await get(STORAGE_KEYS.CALENDAR)) || [];
    } catch {
      const local = safeGetLocal(STORAGE_KEYS.CALENDAR);
      return local ? JSON.parse(local) : [];
    }
  },

  async saveCalendar(items: CalendarDayItem[]): Promise<void> {
    try {
      await set(STORAGE_KEYS.CALENDAR, items);
    } catch {
      safeSetLocal(STORAGE_KEYS.CALENDAR, JSON.stringify(items));
    }
  },

  // Metrik Manual
  async getMetrics(): Promise<MetricEntry[]> {
    let rawList: MetricEntry[] = [];
    try {
      rawList = (await get(STORAGE_KEYS.METRICS)) || [];
    } catch {
      const local = safeGetLocal(STORAGE_KEYS.METRICS);
      rawList = local ? JSON.parse(local) : [];
    }
    // Deduplicate by ID to guarantee unique elements & saring repost_facade
    const seen = new Set<string>();
    const deduplicated: MetricEntry[] = [];
    for (const item of rawList) {
      if (!item) continue;
      // Abaikan dan buang postingan repost_facade
      const mType = (item.mediaType || "").toUpperCase();
      const topic = (item.topicTag || "").toUpperCase();
      if (mType === "REPOST_FACADE" || mType.includes("REPOST_FACADE") || topic.includes("REPOST_FACADE")) {
        continue;
      }
      if (item.id) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          deduplicated.push(item);
        }
      } else {
        deduplicated.push(item);
      }
    }
    return deduplicated;
  },

  async saveMetric(entry: MetricEntry): Promise<void> {
    // Jangan simpan repost_facade
    const mType = (entry.mediaType || "").toUpperCase();
    if (mType === "REPOST_FACADE" || mType.includes("REPOST_FACADE")) return;

    const list = await this.getMetrics();
    const filtered = list.filter((item) => item.id !== entry.id);
    const updated = [entry, ...filtered];
    try {
      await set(STORAGE_KEYS.METRICS, updated);
    } catch {
      safeSetLocal(STORAGE_KEYS.METRICS, JSON.stringify(updated));
    }
  },

  async setMetrics(entries: MetricEntry[]): Promise<void> {
    const seen = new Set<string>();
    const deduplicated: MetricEntry[] = [];
    for (const item of entries) {
      if (!item) continue;
      const mType = (item.mediaType || "").toUpperCase();
      const topic = (item.topicTag || "").toUpperCase();
      if (mType === "REPOST_FACADE" || mType.includes("REPOST_FACADE") || topic.includes("REPOST_FACADE")) {
        continue;
      }
      if (item.id) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          deduplicated.push(item);
        }
      } else {
        deduplicated.push(item);
      }
    }
    try {
      await set(STORAGE_KEYS.METRICS, deduplicated);
    } catch {
      safeSetLocal(STORAGE_KEYS.METRICS, JSON.stringify(deduplicated));
    }
  },

  async deleteMetric(id: string): Promise<void> {
    const list = await this.getMetrics();
    const updated = list.filter((item) => item.id !== id);
    await this.setMetrics(updated);
    // Hapus juga dari cache postingan threads jika berasal dari import
    await this.deleteThreadsPost(id);
  },

  async clearMetrics(): Promise<void> {
    try {
      await del(STORAGE_KEYS.METRICS);
    } catch {
      safeRemoveLocal(STORAGE_KEYS.METRICS);
    }
    await this.clearThreadsPosts();
  },

  // Bobot Kartu E
  async getCardWeights(): Promise<Record<string, CardUserWeight>> {
    try {
      return (await get(STORAGE_KEYS.CARD_WEIGHTS)) || {};
    } catch {
      const local = safeGetLocal(STORAGE_KEYS.CARD_WEIGHTS);
      return local ? JSON.parse(local) : {};
    }
  },

  async saveCardWeight(weight: CardUserWeight): Promise<void> {
    const weights = await this.getCardWeights();
    weights[weight.cardId] = weight;
    try {
      await set(STORAGE_KEYS.CARD_WEIGHTS, weights);
    } catch {
      safeSetLocal(STORAGE_KEYS.CARD_WEIGHTS, JSON.stringify(weights));
    }
  },

  // Kartu Kustom / Pending Queue
  async getCustomCards(): Promise<ReferenceCard[]> {
    try {
      return (await get(STORAGE_KEYS.CUSTOM_CARDS)) || [];
    } catch {
      const local = safeGetLocal(STORAGE_KEYS.CUSTOM_CARDS);
      return local ? JSON.parse(local) : [];
    }
  },

  async saveCustomCard(card: ReferenceCard): Promise<void> {
    const list = await this.getCustomCards();
    const updated = [card, ...list.filter((c) => c.id !== card.id)];
    try {
      await set(STORAGE_KEYS.CUSTOM_CARDS, updated);
    } catch {
      safeSetLocal(STORAGE_KEYS.CUSTOM_CARDS, JSON.stringify(updated));
    }
  },

  // Threads Account & Token
  async getThreadsAccount(): Promise<any | null> {
    try {
      return (await get(STORAGE_KEYS.THREADS_ACCOUNT)) || null;
    } catch {
      const local = safeGetLocal(STORAGE_KEYS.THREADS_ACCOUNT);
      return local ? JSON.parse(local) : null;
    }
  },

  async saveThreadsAccount(account: any): Promise<void> {
    try {
      await set(STORAGE_KEYS.THREADS_ACCOUNT, account);
    } catch {
      safeSetLocal(STORAGE_KEYS.THREADS_ACCOUNT, JSON.stringify(account));
    }
  },

  async clearThreadsAccount(): Promise<void> {
    try {
      await del(STORAGE_KEYS.THREADS_ACCOUNT);
      await del(STORAGE_KEYS.THREADS_TOKEN);
      await del(STORAGE_KEYS.THREADS_POSTS);
      await del(STORAGE_KEYS.API_PROFILES);
      await del(STORAGE_KEYS.ONBOARDING_COMPLETED);
    } catch {
      safeRemoveLocal(STORAGE_KEYS.THREADS_ACCOUNT);
      safeRemoveLocal(STORAGE_KEYS.THREADS_TOKEN);
      safeRemoveLocal(STORAGE_KEYS.THREADS_POSTS);
      safeRemoveLocal(STORAGE_KEYS.API_PROFILES);
      safeRemoveLocal(STORAGE_KEYS.ONBOARDING_COMPLETED);
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("autothreads_onboarding_changed"));
    }
  },

  // Onboarding Flag
  async isOnboardingCompleted(): Promise<boolean> {
    try {
      const val = await get(STORAGE_KEYS.ONBOARDING_COMPLETED);
      if (val !== undefined && val !== null) return Boolean(val);
    } catch {}
    const local = safeGetLocal(STORAGE_KEYS.ONBOARDING_COMPLETED);
    if (local !== null) return local === "true";
    return false;
  },

  async setOnboardingCompleted(completed: boolean): Promise<void> {
    try {
      await set(STORAGE_KEYS.ONBOARDING_COMPLETED, completed);
    } catch {}
    safeSetLocal(STORAGE_KEYS.ONBOARDING_COMPLETED, String(completed));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("autothreads_onboarding_changed"));
    }
  },

  async getThreadsToken(): Promise<string | null> {
    try {
      return (await get(STORAGE_KEYS.THREADS_TOKEN)) || null;
    } catch {
      return safeGetLocal(STORAGE_KEYS.THREADS_TOKEN);
    }
  },

  async saveThreadsToken(token: string): Promise<void> {
    try {
      await set(STORAGE_KEYS.THREADS_TOKEN, token);
    } catch {
      safeSetLocal(STORAGE_KEYS.THREADS_TOKEN, token);
    }
  },

  // API Profile (Token & Threads User ID)
  async getApiProfile(): Promise<ApiProfile | null> {
    try {
      const data = await get(STORAGE_KEYS.API_PROFILES);
      if (data && data.token) return data;
    } catch {
      const local = safeGetLocal(STORAGE_KEYS.API_PROFILES);
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (parsed && parsed.token) return parsed;
        } catch {}
      }
    }

    // Fallback: cek THREADS_TOKEN & THREADS_ACCOUNT
    const token = await this.getThreadsToken();
    const account = await this.getThreadsAccount();
    if (token) {
      return {
        token,
        threads_user_id: account?.id || "",
        username: account?.username || "",
        updatedAt: account?.connectedAt || Date.now(),
      };
    }
    return null;
  },

  async saveApiProfile(profile: ApiProfile): Promise<void> {
    try {
      await set(STORAGE_KEYS.API_PROFILES, profile);
    } catch {
      safeSetLocal(STORAGE_KEYS.API_PROFILES, JSON.stringify(profile));
    }
    // Sinkronkan juga ke THREADS_TOKEN
    if (profile.token) {
      await this.saveThreadsToken(profile.token);
    }
  },

  // ==================== ANTRIAN JADWAL (AUTO-SCHEDULER) ====================
  async getScheduledQueue(): Promise<ScheduledThreadItem[]> {
    let list: ScheduledThreadItem[] = [];
    try {
      list = (await get(STORAGE_KEYS.SCHEDULED_QUEUE)) || [];
    } catch {
      const local = safeGetLocal(STORAGE_KEYS.SCHEDULED_QUEUE);
      if (local) {
        try {
          list = JSON.parse(local);
        } catch {}
      }
    }
    return Array.isArray(list) ? list : [];
  },

  async saveScheduledThread(item: ScheduledThreadItem): Promise<void> {
    const current = await this.getScheduledQueue();
    const existingIdx = current.findIndex((q) => q.id === item.id);
    let updated: ScheduledThreadItem[];
    if (existingIdx >= 0) {
      updated = [...current];
      updated[existingIdx] = { ...updated[existingIdx], ...item };
    } else {
      updated = [item, ...current];
    }

    try {
      await set(STORAGE_KEYS.SCHEDULED_QUEUE, updated);
    } catch {
      safeSetLocal(STORAGE_KEYS.SCHEDULED_QUEUE, JSON.stringify(updated));
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("autothreads_queue_updated", { detail: updated }));
    }
  },

  async cancelScheduledThread(id: string): Promise<void> {
    await this.updateScheduledStatus(id, "cancelled");
  },

  async removeScheduledThread(id: string): Promise<void> {
    const current = await this.getScheduledQueue();
    const updated = current.filter((q) => q.id !== id);
    try {
      await set(STORAGE_KEYS.SCHEDULED_QUEUE, updated);
    } catch {
      safeSetLocal(STORAGE_KEYS.SCHEDULED_QUEUE, JSON.stringify(updated));
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("autothreads_queue_updated", { detail: updated }));
    }
  },

  async updateScheduledStatus(
    id: string,
    status: ScheduledStatus,
    updates?: Partial<ScheduledThreadItem>
  ): Promise<void> {
    const current = await this.getScheduledQueue();
    const updated = current.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          status,
          ...(updates || {}),
        };
      }
      return item;
    });

    try {
      await set(STORAGE_KEYS.SCHEDULED_QUEUE, updated);
    } catch {
      safeSetLocal(STORAGE_KEYS.SCHEDULED_QUEUE, JSON.stringify(updated));
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("autothreads_queue_updated", { detail: updated }));
    }
  },

  async getThreadsPosts(): Promise<any[]> {
    let list: any[] = [];
    try {
      list = (await get(STORAGE_KEYS.THREADS_POSTS)) || [];
    } catch {
      const local = safeGetLocal(STORAGE_KEYS.THREADS_POSTS);
      list = local ? JSON.parse(local) : [];
    }
    const seen = new Set<string>();
    const deduplicated: any[] = [];
    for (const p of list) {
      if (!p) continue;
      // Abaikan dan buang postingan repost_facade
      const mType = (p.media_type || p.mediaType || "").toUpperCase();
      const pType = (p.media_product_type || "").toUpperCase();
      if (mType === "REPOST_FACADE" || pType === "REPOST_FACADE" || mType.includes("REPOST_FACADE")) {
        continue;
      }
      if (p.id) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          deduplicated.push(p);
        }
      } else {
        deduplicated.push(p);
      }
    }
    return deduplicated;
  },

  async saveThreadsPosts(posts: any[]): Promise<void> {
    const seen = new Set<string>();
    const deduplicated: any[] = [];
    for (const p of posts) {
      if (!p) continue;
      // Abaikan dan jangan simpan postingan repost_facade
      const mType = (p.media_type || p.mediaType || "").toUpperCase();
      const pType = (p.media_product_type || "").toUpperCase();
      if (mType === "REPOST_FACADE" || pType === "REPOST_FACADE" || mType.includes("REPOST_FACADE")) {
        continue;
      }
      if (p.id) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          deduplicated.push(p);
        }
      } else {
        deduplicated.push(p);
      }
    }
    try {
      await set(STORAGE_KEYS.THREADS_POSTS, deduplicated);
    } catch {
      safeSetLocal(STORAGE_KEYS.THREADS_POSTS, JSON.stringify(deduplicated));
    }
  },

  async deleteThreadsPost(id: string): Promise<void> {
    const cleanId = id.replace(/^th_/, "");
    const list = await this.getThreadsPosts();
    const filtered = list.filter((p) => p && p.id !== id && p.id !== cleanId && `th_${p.id}` !== id);
    try {
      await set(STORAGE_KEYS.THREADS_POSTS, filtered);
    } catch {
      safeSetLocal(STORAGE_KEYS.THREADS_POSTS, JSON.stringify(filtered));
    }
  },

  async clearThreadsPosts(): Promise<void> {
    try {
      await del(STORAGE_KEYS.THREADS_POSTS);
    } catch {
      safeRemoveLocal(STORAGE_KEYS.THREADS_POSTS);
    }
  },

  // Kunci API Mandiri Pengguna (Gemini API Key)
  async getCustomApiKey(): Promise<string | null> {
    try {
      return (await get(STORAGE_KEYS.CUSTOM_API_KEY)) || null;
    } catch {
      return safeGetLocal(STORAGE_KEYS.CUSTOM_API_KEY);
    }
  },

  async saveCustomApiKey(key: string): Promise<void> {
    const clean = key.trim();
    try {
      await set(STORAGE_KEYS.CUSTOM_API_KEY, clean);
    } catch {
      safeSetLocal(STORAGE_KEYS.CUSTOM_API_KEY, clean);
    }
  },

  async clearCustomApiKey(): Promise<void> {
    try {
      await del(STORAGE_KEYS.CUSTOM_API_KEY);
    } catch {
      safeRemoveLocal(STORAGE_KEYS.CUSTOM_API_KEY);
    }
  },

  // Kredensial Meta Threads App (App ID & Secret)
  async getThreadsAppCreds(): Promise<{ appId?: string; appSecret?: string } | null> {
    try {
      return (await get(STORAGE_KEYS.THREADS_APP_CREDS)) || null;
    } catch {
      const local = safeGetLocal(STORAGE_KEYS.THREADS_APP_CREDS);
      return local ? JSON.parse(local) : null;
    }
  },

  async saveThreadsAppCreds(creds: { appId?: string; appSecret?: string }): Promise<void> {
    try {
      await set(STORAGE_KEYS.THREADS_APP_CREDS, creds);
    } catch {
      safeSetLocal(STORAGE_KEYS.THREADS_APP_CREDS, JSON.stringify(creds));
    }
  },

  // Ekspor Semua Data ke JSON
  async exportAllData(): Promise<string> {
    const profile = await this.getProfile();
    const generations = await this.getGenerations();
    const calendar = await this.getCalendar();
    const metrics = await this.getMetrics();
    const weights = await this.getCardWeights();
    const customCards = await this.getCustomCards();
    const scheduledQueue = await this.getScheduledQueue();

    return JSON.stringify(
      {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        profile,
        generations,
        calendar,
        metrics,
        weights,
        customCards,
        scheduledQueue,
      },
      null,
      2
    );
  },

  // Impor Data dari JSON
  async importAllData(jsonString: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.profile) await this.saveProfile(parsed.profile);
      if (parsed.generations) await set(STORAGE_KEYS.GENERATIONS, parsed.generations);
      if (parsed.calendar) await this.saveCalendar(parsed.calendar);
      if (parsed.metrics) await set(STORAGE_KEYS.METRICS, parsed.metrics);
      if (parsed.weights) await set(STORAGE_KEYS.CARD_WEIGHTS, parsed.weights);
      if (parsed.customCards) await set(STORAGE_KEYS.CUSTOM_CARDS, parsed.customCards);
      if (parsed.scheduledQueue) await set(STORAGE_KEYS.SCHEDULED_QUEUE, parsed.scheduledQueue);
      return true;
    } catch (e) {
      console.error("Gagal mengimpor data:", e);
      return false;
    }
  },
};
