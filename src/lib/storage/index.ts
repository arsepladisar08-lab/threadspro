/**
 * AutoThreads Storage Adapter
 * IndexedDB (via idb-keyval) dengan fallback aman & fitur ekspor/impor JSON
 * Kompatibel dengan Browser dan Server Node runtime tanpa ReferenceError
 */

import { get, set, del, keys } from "idb-keyval";
import { UserProfile, GenerationOutput, CalendarDayItem, MetricEntry, CardUserWeight, ReferenceCard } from "../../types";

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
};

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
    try {
      return (await get(STORAGE_KEYS.METRICS)) || [];
    } catch {
      const local = safeGetLocal(STORAGE_KEYS.METRICS);
      return local ? JSON.parse(local) : [];
    }
  },

  async saveMetric(entry: MetricEntry): Promise<void> {
    const list = await this.getMetrics();
    const updated = [entry, ...list];
    try {
      await set(STORAGE_KEYS.METRICS, updated);
    } catch {
      safeSetLocal(STORAGE_KEYS.METRICS, JSON.stringify(updated));
    }
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
    } catch {
      safeRemoveLocal(STORAGE_KEYS.THREADS_ACCOUNT);
      safeRemoveLocal(STORAGE_KEYS.THREADS_TOKEN);
      safeRemoveLocal(STORAGE_KEYS.THREADS_POSTS);
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

  async getThreadsPosts(): Promise<any[]> {
    try {
      return (await get(STORAGE_KEYS.THREADS_POSTS)) || [];
    } catch {
      const local = safeGetLocal(STORAGE_KEYS.THREADS_POSTS);
      return local ? JSON.parse(local) : [];
    }
  },

  async saveThreadsPosts(posts: any[]): Promise<void> {
    try {
      await set(STORAGE_KEYS.THREADS_POSTS, posts);
    } catch {
      safeSetLocal(STORAGE_KEYS.THREADS_POSTS, JSON.stringify(posts));
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
      return true;
    } catch (e) {
      console.error("Gagal mengimpor data:", e);
      return false;
    }
  },
};
