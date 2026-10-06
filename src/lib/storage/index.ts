/**
 * AutoThreads Storage Adapter
 * IndexedDB (via idb-keyval) dengan fallback aman & fitur ekspor/impor JSON
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
};

// ==================== STORAGE IMPLEMENTATION ====================

export const storage = {
  // Profil User
  async getProfile(): Promise<UserProfile | null> {
    try {
      return (await get(STORAGE_KEYS.PROFILE)) || null;
    } catch {
      const local = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return local ? JSON.parse(local) : null;
    }
  },

  async saveProfile(profile: UserProfile): Promise<void> {
    try {
      await set(STORAGE_KEYS.PROFILE, profile);
    } catch {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    }
  },

  // Generasi Utas (Riwayat)
  async getGenerations(): Promise<GenerationOutput[]> {
    try {
      return (await get(STORAGE_KEYS.GENERATIONS)) || [];
    } catch {
      const local = localStorage.getItem(STORAGE_KEYS.GENERATIONS);
      return local ? JSON.parse(local) : [];
    }
  },

  async saveGeneration(gen: GenerationOutput): Promise<void> {
    const list = await this.getGenerations();
    const updated = [gen, ...list.slice(0, 49)]; // Simpan 50 generasi terakhir
    try {
      await set(STORAGE_KEYS.GENERATIONS, updated);
    } catch {
      localStorage.setItem(STORAGE_KEYS.GENERATIONS, JSON.stringify(updated));
    }
  },

  // Kalender
  async getCalendar(): Promise<CalendarDayItem[]> {
    try {
      return (await get(STORAGE_KEYS.CALENDAR)) || [];
    } catch {
      const local = localStorage.getItem(STORAGE_KEYS.CALENDAR);
      return local ? JSON.parse(local) : [];
    }
  },

  async saveCalendar(items: CalendarDayItem[]): Promise<void> {
    try {
      await set(STORAGE_KEYS.CALENDAR, items);
    } catch {
      localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(items));
    }
  },

  // Metrik Manual
  async getMetrics(): Promise<MetricEntry[]> {
    try {
      return (await get(STORAGE_KEYS.METRICS)) || [];
    } catch {
      const local = localStorage.getItem(STORAGE_KEYS.METRICS);
      return local ? JSON.parse(local) : [];
    }
  },

  async saveMetric(entry: MetricEntry): Promise<void> {
    const list = await this.getMetrics();
    const updated = [entry, ...list];
    try {
      await set(STORAGE_KEYS.METRICS, updated);
    } catch {
      localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(updated));
    }
  },

  // Bobot Kartu E
  async getCardWeights(): Promise<Record<string, CardUserWeight>> {
    try {
      return (await get(STORAGE_KEYS.CARD_WEIGHTS)) || {};
    } catch {
      const local = localStorage.getItem(STORAGE_KEYS.CARD_WEIGHTS);
      return local ? JSON.parse(local) : {};
    }
  },

  async saveCardWeight(weight: CardUserWeight): Promise<void> {
    const weights = await this.getCardWeights();
    weights[weight.cardId] = weight;
    try {
      await set(STORAGE_KEYS.CARD_WEIGHTS, weights);
    } catch {
      localStorage.setItem(STORAGE_KEYS.CARD_WEIGHTS, JSON.stringify(weights));
    }
  },

  // Kartu Kustom / Pending Queue
  async getCustomCards(): Promise<ReferenceCard[]> {
    try {
      return (await get(STORAGE_KEYS.CUSTOM_CARDS)) || [];
    } catch {
      const local = localStorage.getItem(STORAGE_KEYS.CUSTOM_CARDS);
      return local ? JSON.parse(local) : [];
    }
  },

  async saveCustomCard(card: ReferenceCard): Promise<void> {
    const list = await this.getCustomCards();
    const updated = [card, ...list.filter(c => c.id !== card.id)];
    try {
      await set(STORAGE_KEYS.CUSTOM_CARDS, updated);
    } catch {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_CARDS, JSON.stringify(updated));
    }
  },

  // Threads Mock Account
  async getThreadsAccount(): Promise<any | null> {
    try {
      return (await get(STORAGE_KEYS.THREADS_ACCOUNT)) || null;
    } catch {
      const local = localStorage.getItem(STORAGE_KEYS.THREADS_ACCOUNT);
      return local ? JSON.parse(local) : null;
    }
  },

  async saveThreadsAccount(account: any): Promise<void> {
    try {
      await set(STORAGE_KEYS.THREADS_ACCOUNT, account);
    } catch {
      localStorage.setItem(STORAGE_KEYS.THREADS_ACCOUNT, JSON.stringify(account));
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
