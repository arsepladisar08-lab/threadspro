import React, { useState, useEffect } from "react";
import { Database, Download, Search, CheckCircle2, Clock, Filter, Sparkles, Plus, AlertCircle } from "lucide-react";
import { REFERENCE_CARDS, ALGORITHM_RULES } from "../data/bank";
import { ReferenceCard, Provenance } from "../types";
import { ProvenanceBadge } from "../components/ProvenanceBadge";
import { storage } from "../lib/storage";

export const BankPage: React.FC = () => {
  const [cards, setCards] = useState<ReferenceCard[]>([]);
  const [customCards, setCustomCards] = useState<ReferenceCard[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMode, setSelectedMode] = useState<"all" | "umum" | "hub">("all");
  const [selectedProvenance, setSelectedProvenance] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"cards" | "rules" | "pending">("cards");

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    const custom = await storage.getCustomCards();
    setCustomCards(custom);
    const approvedCustom = custom.filter((c) => c.status === "approved");
    setCards([...REFERENCE_CARDS, ...approvedCustom]);
  };

  const handleApprovePending = async (cardId: string) => {
    const target = customCards.find((c) => c.id === cardId);
    if (!target) return;
    const updated: ReferenceCard = { ...target, status: "approved" };
    await storage.saveCustomCard(updated);
    await loadCards();
  };

  const handleRejectPending = async (cardId: string) => {
    try {
      const list = await storage.getCustomCards();
      const filtered = list.filter((c) => c.id !== cardId);
      localStorage.setItem("autothreads_custom_cards", JSON.stringify(filtered));
      await loadCards();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportMarkdown = () => {
    let md = "# BANK REFERENSI UTAS THREADS INDONESIA\n";
    md += `Diekspor dari AutoThreads pada ${new Date().toISOString().split("T")[0]}\n\n`;
    md += "## CARA PAKAI\n1. Bank ini berisi POLA (hook, struktur, emosi, sinyal), bukan teks untuk disalin.\n2. Label Provenance: A (Ulasan Viral), B (Klaim Teruji), C (Hipotetis), D (Pencarian Threads), E (Terbukti di Akun User).\n\n";
    md += "---\n# KARTU REFERENSI TERVERIFIKASI\n\n";

    cards.forEach((card) => {
      md += `## ${card.id} ${card.niche.toUpperCase()} [Mode: ${card.mode}]\n`;
      md += `- Format: ${card.format}\n`;
      md += `- Struktur: ${card.struktur}\n`;
      md += `- Emosi: ${card.emosi}\n`;
      md += `- Sinyal Algoritma: ${card.sinyal_algoritma}\n`;
      md += `- Pola Komentar: ${card.pola_komentar}\n`;
      md += `- Pelajaran: ${card.pelajaran}\n`;
      md += `- Guardrail: ${card.guardrail}\n`;
      md += `- Provenance: [${card.provenance}]\n`;
      md += "- Hooks:\n";
      card.hooks.forEach((hook) => {
        md += `  - ${hook.id} [${hook.provenance}] pola: "${hook.pola_slot}" | Contoh: "${hook.contoh_asli}"\n`;
      });
      md += "\n";
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "BANK_REFERENSI_THREADS.md";
    a.click();
  };

  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.niche.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.format.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.emosi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.hooks.some((h) => h.pola_slot.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMode = selectedMode === "all" || card.mode === selectedMode;
    const matchesProv = selectedProvenance === "all" || card.provenance === selectedProvenance;

    return matchesSearch && matchesMode && matchesProv;
  });

  const pendingList = customCards.filter((c) => c.status === "pending");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-28 space-y-6">
      {/* Calm Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
            Bank Referensi Utas
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Repositori pola hook ber-slot, kerangka emosi, dan kaidah algoritma Threads teruji.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportMarkdown}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 transition cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-zinc-400" />
          <span>Ekspor Markdown (.md)</span>
        </button>
      </div>

      {/* Calm Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-850 text-xs w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("cards")}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
            activeTab === "cards" ? "bg-zinc-800 text-zinc-100 font-semibold" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Koleksi Pola ({cards.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("rules")}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
            activeTab === "rules" ? "bg-zinc-800 text-zinc-100 font-semibold" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Aturan Algoritma ({ALGORITHM_RULES.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === "pending" ? "bg-zinc-800 text-zinc-100 font-semibold" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <span>Antrean Pending</span>
          {pendingList.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-zinc-700 text-zinc-200 text-[10px] flex items-center justify-center font-bold">
              {pendingList.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab: Cards */}
      {activeTab === "cards" && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari niche, format, emosi, atau pola hook..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-zinc-600"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value as any)}
                className="w-full py-2 px-3 rounded-xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-300 focus:outline-hidden"
              >
                <option value="all">Semua Mode</option>
                <option value="umum">Mode Umum</option>
                <option value="hub">Mode Hub Kreator</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedProvenance}
                onChange={(e) => setSelectedProvenance(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-300 focus:outline-hidden"
              >
                <option value="all">Semua Provenance</option>
                <option value="A">Label A (Ulasan Viral)</option>
                <option value="B">Label B (Klaim Teruji)</option>
                <option value="C">Label C (Hipotetis)</option>
                <option value="D">Label D (Pencarian Threads)</option>
                <option value="E">Label E (Akun Sendiri)</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCards.map((card, idx) => (
              <div
                key={`${card.id}_${idx}`}
                className="p-5 rounded-2xl border border-zinc-900 bg-zinc-900/20 hover:border-zinc-800 transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold">
                      {card.id}
                    </span>
                    <h3 className="text-sm font-semibold text-zinc-100">{card.niche}</h3>
                  </div>
                  <ProvenanceBadge provenance={card.provenance} />
                </div>

                <div className="space-y-1 text-xs text-zinc-300">
                  <p>
                    <strong className="text-zinc-500 font-normal">Format:</strong> {card.format}
                  </p>
                  <p>
                    <strong className="text-zinc-500 font-normal">Struktur:</strong> {card.struktur}
                  </p>
                  <p>
                    <strong className="text-zinc-500 font-normal">Emosi:</strong> {card.emosi}
                  </p>
                  <p>
                    <strong className="text-zinc-500 font-normal">Sinyal:</strong> {card.sinyal_algoritma}
                  </p>
                </div>

                {/* Hooks List */}
                <div className="space-y-1.5 pt-2 border-t border-zinc-900">
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">
                    Pola Hook & Slot ({card.hooks.length}):
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {card.hooks.map((h, hIdx) => (
                      <div
                        key={`${h.id}_${hIdx}`}
                        className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-850/80 text-[11px] space-y-1"
                      >
                        <div className="flex items-center justify-between text-zinc-400">
                          <span className="font-mono text-zinc-300 font-medium">{h.id}</span>
                          <span className="text-[9px] px-1 rounded bg-zinc-900 text-zinc-400">
                            Prov: {h.provenance}
                          </span>
                        </div>
                        <p className="text-zinc-300 font-mono text-[10px]">{h.pola_slot}</p>
                        <p className="text-zinc-500 italic text-[10px]">Contoh: "{h.contoh_asli}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Rules */}
      {activeTab === "rules" && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-400 mb-2">
            Kaidah algoritma Threads yang dirangkum dari pengumuman resmi Mosseri (R), observasi praktisi (P), dan hipotesis pengujian (H).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ALGORITHM_RULES.map((rule, idx) => (
              <div
                key={`${rule.id}_${idx}`}
                className="p-4 rounded-2xl border border-zinc-900 bg-zinc-900/20 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-zinc-100">{rule.title}</h4>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-300">
                    Tingkat {rule.confidence}
                  </span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">{rule.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Pending Queue */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          <p className="text-xs text-zinc-400">
            Draf kartu hasil ulasan utas viral atau kurasi manual yang membutuhkan persetujuan sebelum aktif digunakan dalam Idea Fusion.
          </p>

          {pendingList.length === 0 ? (
            <div className="p-8 rounded-2xl border border-zinc-900 bg-zinc-950/40 text-center text-zinc-500 text-xs">
              Tidak ada kartu pending. Analisis utas viral di halaman Ulas Utas untuk menambahkan draf baru.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingList.map((card, idx) => (
                <div
                  key={`${card.id}_${idx}`}
                  className="p-4 rounded-2xl border border-zinc-900 bg-zinc-900/20 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block font-mono">Pending Review</span>
                      <h4 className="text-sm font-semibold text-zinc-100">{card.niche}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRejectPending(card.id)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white text-xs cursor-pointer"
                      >
                        Tolak
                      </button>
                      <button
                        onClick={() => handleApprovePending(card.id)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-950 font-semibold hover:bg-white text-xs cursor-pointer"
                      >
                        Setujui Kartu
                      </button>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 text-zinc-300 text-[11px] space-y-1">
                    <p><strong>Format:</strong> {card.format}</p>
                    <p><strong>Pola Hook:</strong> {card.hooks[0]?.pola_slot}</p>
                    <p><strong>Pelajaran:</strong> {card.pelajaran}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
