import React, { useState, useEffect } from "react";
import { Database, Download, Search, CheckCircle2, Clock, Filter, Sparkles, Plus, AlertCircle, ArrowUpRight } from "lucide-react";
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
    const updated = customCards.filter((c) => c.id !== cardId);
    // Simpan ulang tanpa kartu tersebut
    try {
      const list = await storage.getCustomCards();
      const filtered = list.filter((c) => c.id !== cardId);
      // save update
      localStorage.setItem("autothreads_custom_cards", JSON.stringify(filtered));
      await loadCards();
    } catch (e) {
      console.error(e);
    }
  };

  // Ekspor BANK_REFERENSI_THREADS.md
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

  // Filter cards
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
    <div className="max-w-5xl mx-auto px-3 sm:px-5 md:px-6 py-6 sm:py-8 pb-24 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Database className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">Bank Referensi Utas</h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Repositori pola teruji, hook ber-slot, dan kaidah algoritma Threads Indonesia.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportMarkdown}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-neutral-900 border border-neutral-800 text-neutral-200 hover:text-white hover:border-neutral-700 transition cursor-pointer"
          title="Ekspor format markdown untuk Custom GPTs / Claude Projects"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          <span>Ekspor BANK_REFERENSI.md</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("cards")}
          className={`pb-2.5 px-3 border-b-2 transition ${
            activeTab === "cards" ? "border-indigo-500 text-white" : "border-transparent text-neutral-400"
          }`}
        >
          Koleksi Kartu Pola ({cards.length})
        </button>
        <button
          onClick={() => setActiveTab("rules")}
          className={`pb-2.5 px-3 border-b-2 transition ${
            activeTab === "rules" ? "border-indigo-500 text-white" : "border-transparent text-neutral-400"
          }`}
        >
          Aturan Algoritma ({ALGORITHM_RULES.length})
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "pending" ? "border-indigo-500 text-white" : "border-transparent text-neutral-400"
          }`}
        >
          <span>Antrean Pending</span>
          {pendingList.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center">
              {pendingList.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab: Cards */}
      {activeTab === "cards" && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari niche, format, emosi, atau pola hook..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value as any)}
                className="w-full p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300"
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
                className="w-full p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300"
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
                className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3 shadow-xs hover:border-neutral-700 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                      {card.id}
                    </span>
                    <h3 className="text-sm font-bold text-white">{card.niche}</h3>
                  </div>
                  <ProvenanceBadge provenance={card.provenance} />
                </div>

                <div className="space-y-1 text-xs">
                  <p className="text-neutral-300">
                    <strong className="text-neutral-400">Format:</strong> {card.format}
                  </p>
                  <p className="text-neutral-300">
                    <strong className="text-neutral-400">Struktur:</strong> {card.struktur}
                  </p>
                  <p className="text-neutral-300">
                    <strong className="text-neutral-400">Emosi:</strong> {card.emosi}
                  </p>
                  <p className="text-neutral-300">
                    <strong className="text-neutral-400">Sinyal Algoritma:</strong> {card.sinyal_algoritma}
                  </p>
                </div>

                {/* Hooks List */}
                <div className="space-y-1.5 pt-2 border-t border-neutral-800/80">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Pola Hook & Slot ({card.hooks.length}):
                  </span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {card.hooks.map((h, hIdx) => (
                      <div
                        key={`${h.id}_${hIdx}`}
                        className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 text-[11px] space-y-1"
                      >
                        <div className="flex items-center justify-between text-neutral-400">
                          <span className="font-semibold text-indigo-400">{h.id}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-900 text-neutral-400">
                            Prov: {h.provenance}
                          </span>
                        </div>
                        <p className="text-neutral-300 font-mono text-[10px]">{h.pola_slot}</p>
                        <p className="text-neutral-500 italic text-[10px]">Contoh: "{h.contoh_asli}"</p>
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
          <p className="text-xs text-neutral-400 mb-2">
            Kaidah algoritma Threads yang dirangkum dari pengumuman resmi Mosseri (R), observasi praktisi (P), dan hipotesis pengujian (H).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ALGORITHM_RULES.map((rule, idx) => (
              <div
                key={`${rule.id}_${idx}`}
                className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white">{rule.title}</h4>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                      rule.confidence === "R"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : rule.confidence === "P"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    Tingkat {rule.confidence}
                  </span>
                </div>
                <p className="text-neutral-400 leading-relaxed text-[11px]">{rule.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Pending Queue */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          <p className="text-xs text-neutral-400">
            Draf kartu hasil ulasan utas viral atau kurasi manual yang membutuhkan persetujuan sebelum aktif digunakan dalam Idea Fusion.
          </p>

          {pendingList.length === 0 ? (
            <div className="p-8 rounded-2xl border-2 border-dashed border-neutral-800 text-center text-neutral-500 text-xs">
              Tidak ada kartu pending. Analisis utas viral di halaman Ulas Utas untuk menambahkan draf baru.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingList.map((card, idx) => (
                <div
                  key={`${card.id}_${idx}`}
                  className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-amber-400 font-bold uppercase block">Pending Review</span>
                      <h4 className="text-sm font-bold text-white">{card.niche}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRejectPending(card.id)}
                        className="px-3 py-1.5 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white"
                      >
                        Tolak
                      </button>
                      <button
                        onClick={() => handleApprovePending(card.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500"
                      >
                        Setujui Kartu
                      </button>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-950 text-neutral-300 text-[11px] space-y-1">
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
