import React from "react";
import { X, Sparkles } from "lucide-react";
import { GeminiKeySettings } from "./GeminiKeySettings";

interface GeminiApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeminiApiKeyModal: React.FC<GeminiApiKeyModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-lg bg-zinc-950 border border-zinc-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-900 bg-zinc-900/30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100">
              <Sparkles className="w-4 h-4 text-zinc-200" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Pengaturan Kunci API Gemini
              </h2>
              <p className="text-[11px] text-zinc-400">
                Atur atau perbarui API Key Google Gemini pribadi Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[85vh] overflow-y-auto">
          <GeminiKeySettings
            onSaved={() => {
              // auto close after brief delay or keep open for confirmation
            }}
          />
        </div>
      </div>
    </div>
  );
};
