import React, { useRef, useState } from "react";
import { Paperclip, Plus, X, Film, AlertCircle } from "lucide-react";
import {
  AttachedMedia,
  ACCEPT_ATTR,
  MEDIA_LIMITS,
  addAttachments,
  revokeAttachment,
  formatBytes,
} from "../services/mediaUpload";

interface Props {
  items: AttachedMedia[];
  onChange: (next: AttachedMedia[]) => void;
  disabled?: boolean;
}

/**
 * Kartu lampiran media (gambar/video). Berlaku untuk semua varian utas:
 * lampiran akan disertakan di Post #1 saat varian apa pun dipublikasikan.
 */
export const MediaAttachments: React.FC<Props> = ({ items, onChange, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // izinkan memilih file yang sama lagi
    if (files.length === 0) return;
    const { items: next, errors: errs } = addAttachments(items, files);
    setErrors(errs);
    onChange(next);
  };

  const handleRemove = (id: string) => {
    const target = items.find((i) => i.id === id);
    if (target) revokeAttachment(target);
    setErrors([]);
    onChange(items.filter((i) => i.id !== id));
  };

  const imageCount = items.filter((i) => i.kind === "image").length;
  const videoCount = items.length - imageCount;
  const isFull = items.length >= MEDIA_LIMITS.maxItems;

  return (
    <div className="p-3.5 rounded-xl bg-zinc-100/60 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-850 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <Paperclip className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Lampiran Media</span>
            <span className="font-normal text-zinc-500 dark:text-zinc-400">
              ({items.length}/{MEDIA_LIMITS.maxItems})
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            Berlaku untuk semua varian dan disertakan di Post #1.
            {items.length > 1 && " Lebih dari satu file diterbitkan sebagai carousel."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isFull}
          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Tambah</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          onChange={handleFiles}
          className="hidden"
        />
      </div>

      {items.length > 0 && (
        <>
          <ul className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {items.map((item, idx) => (
              <li
                key={item.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800"
              >
                {item.kind === "image" ? (
                  <img src={item.previewUrl} alt={item.file.name} className="w-full h-full object-cover" />
                ) : (
                  <video src={item.previewUrl} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                )}

                <span className="absolute left-1 bottom-1 px-1 rounded bg-black/60 text-[10px] text-white leading-4">
                  {item.kind === "video" ? (
                    <span className="inline-flex items-center gap-0.5">
                      <Film className="w-2.5 h-2.5" aria-hidden="true" />
                      {formatBytes(item.file.size)}
                    </span>
                  ) : (
                    idx + 1
                  )}
                </span>

                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  disabled={disabled}
                  aria-label={`Hapus ${item.file.name}`}
                  className="absolute right-1 top-1 w-5 h-5 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {imageCount > 0 && `${imageCount} gambar`}
            {imageCount > 0 && videoCount > 0 && " · "}
            {videoCount > 0 && `${videoCount} video`}
          </p>
        </>
      )}

      {items.length === 0 && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Gambar JPG/PNG maks {formatBytes(MEDIA_LIMITS.imageMaxBytes)}, video MP4/MOV maks 1 GB (durasi hingga 5 menit).
        </p>
      )}

      {errors.length > 0 && (
        <div role="alert" className="flex gap-1.5 text-[11px] text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" aria-hidden="true" />
          <ul className="space-y-0.5">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
