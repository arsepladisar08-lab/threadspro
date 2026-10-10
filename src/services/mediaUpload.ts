/**
 * Lampiran media (gambar/video) untuk publikasi Threads.
 *
 * Lampiran bersifat global: dipilih sekali di halaman Generator dan dipakai
 * oleh semua varian utas. File diunggah ke URL publik saat tombol publikasi
 * ditekan, karena Threads API hanya menerima media lewat URL publik.
 *
 * Batas mengikuti dokumentasi Threads API:
 *  - Gambar: JPEG/PNG, maks 8 MB
 *  - Video : MP4/MOV, maks 1 GB, maks 5 menit
 *  - Carousel: 2-20 item (aplikasi ini membatasi 10 agar konsisten dengan fitur visual)
 */
import { threadsClient } from "./threadsClient";

export type MediaKind = "image" | "video";

export interface AttachedMedia {
  id: string;
  file: File;
  kind: MediaKind;
  /** Object URL untuk pratinjau lokal; lepaskan dengan revokeAttachment() */
  previewUrl: string;
}

export interface UploadedMedia {
  url: string;
  type: "IMAGE" | "VIDEO";
}

const IMAGE_TYPES: string[] = ["image/jpeg", "image/png"];
const VIDEO_TYPES: string[] = ["video/mp4", "video/quicktime"];

export const MEDIA_LIMITS = {
  maxItems: 10,
  imageMaxBytes: 8 * 1024 * 1024,
  videoMaxBytes: 1024 * 1024 * 1024,
};

/** Nilai untuk atribut accept pada <input type="file"> */
export const ACCEPT_ATTR = [...IMAGE_TYPES, ...VIDEO_TYPES].join(",");

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Validasi dan tambahkan file baru ke daftar lampiran.
 * File yang tidak lolos tidak ditambahkan dan alasannya dikembalikan di `errors`.
 */
export function addAttachments(
  existing: AttachedMedia[],
  incoming: File[],
): { items: AttachedMedia[]; errors: string[] } {
  const items = [...existing];
  const errors: string[] = [];

  for (const file of incoming) {
    const isImage = IMAGE_TYPES.includes(file.type);
    const isVideo = VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      errors.push(`${file.name}: format tidak didukung (gunakan JPG, PNG, MP4, atau MOV).`);
      continue;
    }
    if (isImage && file.size > MEDIA_LIMITS.imageMaxBytes) {
      errors.push(`${file.name}: gambar ${formatBytes(file.size)} melebihi batas ${formatBytes(MEDIA_LIMITS.imageMaxBytes)}.`);
      continue;
    }
    if (isVideo && file.size > MEDIA_LIMITS.videoMaxBytes) {
      errors.push(`${file.name}: video ${formatBytes(file.size)} melebihi batas ${formatBytes(MEDIA_LIMITS.videoMaxBytes)}.`);
      continue;
    }
    if (items.length >= MEDIA_LIMITS.maxItems) {
      errors.push(`Maksimal ${MEDIA_LIMITS.maxItems} lampiran. File berikutnya diabaikan.`);
      break;
    }

    items.push({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      file,
      kind: isVideo ? "video" : "image",
      previewUrl: URL.createObjectURL(file),
    });
  }

  return { items, errors };
}

export function revokeAttachment(item: AttachedMedia): void {
  URL.revokeObjectURL(item.previewUrl);
}

// ---------------------------------------------------------------------------
// Unggah ke URL publik
// ---------------------------------------------------------------------------

const SUPABASE_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "";
const MEDIA_BUCKET = (import.meta as any).env?.VITE_SUPABASE_MEDIA_BUCKET || "autothreads-media";

const hasSupabaseStorage = Boolean(
  SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes("your-project") &&
    !SUPABASE_ANON_KEY.includes("your-anon-key"),
);

function randomObjectName(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  const ext = dot >= 0 ? fileName.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, "") : "";
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}${ext}`;
}

async function uploadToSupabase(file: File): Promise<string> {
  const objectPath = `${new Date().toISOString().slice(0, 10)}/${randomObjectName(file.name)}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${MEDIA_BUCKET}/${objectPath}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": file.type,
      "x-upsert": "false",
    },
    body: file,
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(
      `Gagal mengunggah ${file.name}: ${errJson?.message || errJson?.error || `HTTP ${res.status}`}`,
    );
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${objectPath}`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Gagal membaca file ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

/**
 * Unggah semua lampiran dan kembalikan URL publiknya sesuai urutan awal.
 * - Dengan Supabase Storage: gambar dan video didukung (disarankan).
 * - Tanpa Supabase: hanya gambar, lewat endpoint /api/upload yang sudah ada.
 */
export async function uploadAttachments(
  items: AttachedMedia[],
  onProgress?: (message: string) => void,
): Promise<UploadedMedia[]> {
  if (items.length === 0) return [];

  if (hasSupabaseStorage) {
    const uploaded: UploadedMedia[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      onProgress?.(`Mengunggah lampiran ${i + 1} dari ${items.length} (${item.file.name})...`);
      const url = await uploadToSupabase(item.file);
      uploaded.push({ url, type: item.kind === "video" ? "VIDEO" : "IMAGE" });
    }
    return uploaded;
  }

  if (items.some((i) => i.kind === "video")) {
    throw new Error(
      "Lampiran video memerlukan Supabase Storage (isi VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, dan buat bucket publik). Hapus video atau konfigurasikan Supabase dulu.",
    );
  }

  onProgress?.(`Mengunggah ${items.length} gambar lampiran...`);
  const dataUrls = await Promise.all(items.map((i) => fileToDataUrl(i.file)));
  const urls = await threadsClient.uploadCanvasImages(dataUrls);
  return urls.map((url) => ({ url, type: "IMAGE" as const }));
}
