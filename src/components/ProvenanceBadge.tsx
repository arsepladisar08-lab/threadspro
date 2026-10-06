import React, { useState } from "react";
import { Provenance } from "../types";
import { PROVENANCE_LABELS } from "../data/bank";
import { Info, X } from "lucide-react";

interface Props {
  provenance: Provenance;
  className?: string;
  showTooltip?: boolean;
}

export const ProvenanceBadge: React.FC<Props> = ({ provenance, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const info = PROVENANCE_LABELS[provenance] || PROVENANCE_LABELS["B"];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-all hover:scale-105 active:scale-95 ${info.badgeClass} ${className}`}
        title="Klik untuk detail sumber referensi"
      >
        <span>{info.label}</span>
        <Info className="w-3 h-3 opacity-80" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm p-5 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl text-left">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${info.badgeClass}`}>
                Label {provenance}
              </span>
              <h4 className="text-sm font-semibold text-white">Transparansi Sumber</h4>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed mt-2">{info.desc}</p>
            <div className="mt-4 pt-3 border-t border-neutral-800 text-[11px] text-neutral-400">
              AutoThreads tidak menjanjikan klaim viralitas otomatis. Selalu uji dengan audiens Anda sendiri.
            </div>
          </div>
        </div>
      )}
    </>
  );
};
