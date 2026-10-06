/**
 * AutoThreads Pure Metrics Engine
 * Perhitungan metrik algoritma dengan pembagian aman (zero-division safe)
 */

import { MetricEntry, CardUserWeight } from "../types";

/**
 * Pembagian aman untuk menghindari NaN atau Infinity
 */
export function safeDivide(numerator: number, denominator: number): number | null {
  if (denominator === 0 || !isFinite(denominator) || isNaN(denominator) || isNaN(numerator)) {
    return null;
  }
  return numerator / denominator;
}

/**
 * Hitung Reply-to-Like Ratio (patokan > 0.15)
 */
export function calculateReplyToLike(replies: number, likes: number): number | null {
  return safeDivide(replies, likes);
}

/**
 * Hitung Engagement Rate terhadap Views
 */
export function calculateEngagementRate(
  likes: number,
  replies: number,
  replyDepth: number,
  views: number
): number | null {
  if (views <= 0) return null;
  const totalInteractions = likes + replies + replyDepth;
  return safeDivide(totalInteractions, views);
}

/**
 * Hitung Velocity menit awal (interaksi per menit di 60 menit pertama)
 */
export function calculateVelocity60(interactions60: number): number {
  return interactions60 / 60;
}

/**
 * Hitung nilai median dari sekumpulan angka
 */
export function calculateMedian(numbers: number[]): number | null {
  if (!numbers || numbers.length === 0) return null;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Hitung rentang interkuartil p25 dan p75
 */
export function calculateP25P75(numbers: number[]): { p25: number; p75: number } | null {
  if (!numbers || numbers.length < 4) return null;
  const sorted = [...numbers].sort((a, b) => a - b);
  const p25Index = Math.floor(sorted.length * 0.25);
  const p75Index = Math.floor(sorted.length * 0.75);
  return {
    p25: sorted[p25Index],
    p75: sorted[p75Index],
  };
}

/**
 * Hitung penyesuaian bobot E (Proven in Account) berdasarkan performa riil
 * Rumus: clamp(0.5, 2.0, 1 + 0.5 * (median_rtl_kartu - median_rtl_akun) / max(median_rtl_akun, 0.05))
 * Berlaku hanya jika n >= 5 data post
 */
export function calculateCardUserWeight(
  cardEntries: MetricEntry[],
  allAccountEntries: MetricEntry[]
): CardUserWeight {
  const cardRtls = cardEntries
    .map(e => e.replyToLike)
    .filter((v): v is number => v !== null && !isNaN(v));

  const allRtls = allAccountEntries
    .map(e => e.replyToLike)
    .filter((v): v is number => v !== null && !isNaN(v));

  const postCount = cardEntries.length;
  const cardId = cardEntries[0]?.cardId || "unknown";
  const medianRtlKartu = calculateMedian(cardRtls);
  const medianRtlAkun = calculateMedian(allRtls) ?? 0.15;

  if (postCount < 5 || medianRtlKartu === null) {
    return {
      cardId,
      weight: 1.0,
      postCount,
      medianRtl: medianRtlKartu,
      lastUpdated: Date.now(),
    };
  }

  const denominator = Math.max(medianRtlAkun, 0.05);
  const rawWeight = 1 + 0.5 * ((medianRtlKartu - medianRtlAkun) / denominator);
  const clampedWeight = Math.min(2.0, Math.max(0.5, rawWeight));

  return {
    cardId,
    weight: Number(clampedWeight.toFixed(2)),
    postCount,
    medianRtl: Number(medianRtlKartu.toFixed(3)),
    lastUpdated: Date.now(),
  };
}
