/**
 * AutoThreads Semantic Retrieval & Diversity Selection Engine
 * Cosine similarity + Provenance weighting + Niche/Goal filtering + Cross-niche diversity
 */

import { REFERENCE_CARDS } from "../data/bank";
import { ReferenceCard, ReferenceHook, GoalType, NicheType } from "../types";
import { CONFIG } from "../config";
import { storage } from "./storage";

export interface RankedPattern {
  card: ReferenceCard;
  hook: ReferenceHook;
  score: number;
  isCrossNiche: boolean;
  matchQuality: "exact" | "close" | "cross";
}

/**
 * Hitung Cosine Similarity antara dua vektor
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Heuristik kemiripan teks berbasis irisan token & semantik dasar (fallback instan)
 */
function textOverlapScore(query: string, target: string): number {
  const qWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const tWords = new Set(target.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  if (qWords.length === 0) return 0.1;

  let matches = 0;
  for (const w of qWords) {
    if (tWords.has(w)) matches++;
  }

  return Math.min(1.0, 0.2 + (matches / qWords.length) * 0.8);
}

/**
 * Ambil daftar kartu termasuk kartu yang sudah diapprove dari custom storage
 */
export async function getAllApprovedCards(): Promise<ReferenceCard[]> {
  const customCards = await storage.getCustomCards();
  const approvedCustom = customCards.filter(c => c.status === "approved");
  return [...REFERENCE_CARDS, ...approvedCustom];
}

/**
 * Retrieve top patterns dengan bobot provenance & bobot user
 * Memilih 3 varian: 2 dari niche terkait/tujuan, minimal 1 dari niche lain (cross-niche)
 */
export async function retrieveTopPatterns(
  query: string,
  userNiche: NicheType,
  goal: GoalType,
  allCards?: ReferenceCard[]
): Promise<RankedPattern[]> {
  const cards = allCards || (await getAllApprovedCards());
  const userWeights = await storage.getCardWeights();

  const candidates: {
    card: ReferenceCard;
    hook: ReferenceHook;
    rawSimilarity: number;
    weightedScore: number;
    isNicheMatch: boolean;
  }[] = [];

  for (const card of cards) {
    const isNicheMatch = card.niche.toLowerCase().includes(userNiche.toLowerCase()) || 
                         userNiche.toLowerCase().includes(card.niche.toLowerCase());
    const cardWeight = userWeights[card.id]?.weight ?? 1.0;

    for (const hook of card.hooks) {
      const combinedText = `${card.niche} ${card.format} ${card.emosi} ${hook.pola_slot} ${hook.contoh_asli}`;
      const sim = textOverlapScore(query, combinedText);

      // Hitung skor berbobot
      const provWeight = CONFIG.provenanceWeights[hook.provenance] ?? 0.3;
      const nicheBoost = isNicheMatch ? 1.3 : 0.9;
      const weightedScore = sim * provWeight * cardWeight * nicheBoost;

      candidates.push({
        card,
        hook,
        rawSimilarity: sim,
        weightedScore,
        isNicheMatch,
      });
    }
  }

  // Urutkan kandidat berdasarkan weightedScore tertinggi
  candidates.sort((a, b) => b.weightedScore - a.weightedScore);

  // Ambil 3 pola beragam: 2 dari niche/terbaik, 1 wajib dari niche lain (cross-niche)
  const selected: RankedPattern[] = [];
  const chosenCardIds = new Set<string>();

  // 1. Ambil 2 pola terbaik dari niche terkait
  for (const item of candidates) {
    if (selected.length >= 2) break;
    if (item.isNicheMatch && !chosenCardIds.has(item.card.id)) {
      selected.push({
        card: item.card,
        hook: item.hook,
        score: Number(item.weightedScore.toFixed(3)),
        isCrossNiche: false,
        matchQuality: item.rawSimilarity > 0.4 ? "exact" : "close",
      });
      chosenCardIds.add(item.card.id);
    }
  }

  // 2. Jika niche match kurang dari 2, ambil yang terbaik non-niche yang belum terpilih
  if (selected.length < 2) {
    for (const item of candidates) {
      if (selected.length >= 2) break;
      if (!chosenCardIds.has(item.card.id)) {
        selected.push({
          card: item.card,
          hook: item.hook,
          score: Number(item.weightedScore.toFixed(3)),
          isCrossNiche: !item.isNicheMatch,
          matchQuality: "close",
        });
        chosenCardIds.add(item.card.id);
      }
    }
  }

  // 3. Wajib ambil 1 pola cross-niche (dari niche lain untuk memperkaya perspektif)
  const crossNicheCandidate = candidates.find(
    item => !item.isNicheMatch && !chosenCardIds.has(item.card.id)
  );

  if (crossNicheCandidate) {
    selected.push({
      card: crossNicheCandidate.card,
      hook: crossNicheCandidate.hook,
      score: Number(crossNicheCandidate.weightedScore.toFixed(3)),
      isCrossNiche: true,
      matchQuality: "cross",
    });
  } else {
    // Fallback jika semua dari niche yang sama
    const fallback = candidates.find(item => !chosenCardIds.has(item.card.id));
    if (fallback) {
      selected.push({
        card: fallback.card,
        hook: fallback.hook,
        score: Number(fallback.weightedScore.toFixed(3)),
        isCrossNiche: true,
        matchQuality: "close",
      });
    }
  }

  return selected;
}
