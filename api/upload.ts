import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import os from "os";

// Konfigurasi batasan upload aman
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // Maksimal 8MB (sesuai batas Meta Threads)
const MAX_BATCH_ITEMS = 10; // Maksimal 10 slide (batas album carousel Threads)
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

// In-memory cache untuk retensi serverless Vercel
const memoryFileCache = new Map<string, { buffer: Buffer; mime: string; createdAt: number }>();

// Tentukan direktori penyimpanan yang aman dan writable
function getWritableStorageDir(): string {
  // 1. Coba gunakan /tmp di Vercel atau OS tmpdir
  const tmpDir = path.join(os.tmpdir(), "autothreads-uploads");
  try {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    return tmpDir;
  } catch {
    // 2. Fallback ke direktori lokal ./public/uploads jika writable
    const localPublic = path.resolve(process.cwd(), "public", "uploads");
    try {
      if (!fs.existsSync(localPublic)) {
        fs.mkdirSync(localPublic, { recursive: true });
      }
      return localPublic;
    } catch {
      return os.tmpdir();
    }
  }
}

/**
 * Validasi magic bytes untuk memastikan buffer adalah file gambar asli
 */
function validateImageMagicBytes(buffer: Buffer): { isValid: boolean; mime: string; ext: string } {
  if (!buffer || buffer.length < 8) {
    return { isValid: false, mime: "", ext: "" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isValid: true, mime: "image/png", ext: "png" };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, mime: "image/jpeg", ext: "jpg" };
  }

  // WEBP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { isValid: true, mime: "image/webp", ext: "webp" };
  }

  return { isValid: false, mime: "", ext: "" };
}

/**
 * Endpoint Pengunggahan dan Penyajian Gambar Terverifikasi & Persisten
 * Menghandle:
 * - GET: Melayani file gambar langsung ke crawler Meta Threads dengan HTTP 200 dan Cache-Control
 * - POST: Menerima base64, memvalidasi ukuran & format mime, menyimpan ke disk/tmp dan memory cache
 */
export default async function uploadHandler(req: Request, res: Response) {
  // CORS Headers untuk pengujian lintas origin
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const storageDir = getWritableStorageDir();

  // =========================================================================
  // HANDLER GET: Sajikan gambar langsung ke Meta Threads Graph API
  // =========================================================================
  if (req.method === "GET") {
    const rawFileParam = req.query.file || req.query.f;
    if (!rawFileParam || typeof rawFileParam !== "string") {
      return res.status(200).json({
        status: "ok",
        message: "Endpoint Upload & Image Server AutoThreads aktif dan terlindungi.",
        maxSizeLimit: "8MB per slide",
        allowedFormats: ALLOWED_MIME_TYPES,
      });
    }

    // Hindari directory traversal dengan basename murni
    const safeFilename = path.basename(rawFileParam);

    // 1. Cek di Memory Cache
    if (memoryFileCache.has(safeFilename)) {
      const cached = memoryFileCache.get(safeFilename)!;
      res.setHeader("Content-Type", cached.mime);
      res.setHeader("Content-Length", cached.buffer.length);
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
      return res.status(200).send(cached.buffer);
    }

    // 2. Cek di storageDir (/tmp atau public/uploads)
    const filePath = path.join(storageDir, safeFilename);
    if (fs.existsSync(filePath)) {
      try {
        const fileBuf = fs.readFileSync(filePath);
        const { mime } = validateImageMagicBytes(fileBuf);
        res.setHeader("Content-Type", mime || "image/png");
        res.setHeader("Content-Length", fileBuf.length);
        res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
        return res.status(200).send(fileBuf);
      } catch (err: any) {
        return res.status(500).json({ error: `Gagal membaca file gambar: ${err.message}` });
      }
    }

    // 3. Cek di public/uploads jika berbeda
    const fallbackPath = path.resolve(process.cwd(), "public", "uploads", safeFilename);
    if (fs.existsSync(fallbackPath)) {
      try {
        const fileBuf = fs.readFileSync(fallbackPath);
        const { mime } = validateImageMagicBytes(fileBuf);
        res.setHeader("Content-Type", mime || "image/png");
        res.setHeader("Content-Length", fileBuf.length);
        res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
        return res.status(200).send(fileBuf);
      } catch (err: any) {
        return res.status(500).json({ error: `Gagal membaca file: ${err.message}` });
      }
    }

    return res.status(404).json({ error: "File gambar tidak ditemukan atau telah kedaluwarsa." });
  }

  // =========================================================================
  // HANDLER POST: Unggah Gambar Baru dengan Validasi Ketat
  // =========================================================================
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Gunakan GET atau POST." });
  }

  try {
    const { image, images, filename } = req.body || {};

    const rawImages: string[] = [];
    if (Array.isArray(images) && images.length > 0) {
      rawImages.push(...images);
    } else if (typeof image === "string" && image.trim().length > 0) {
      rawImages.push(image);
    }

    if (rawImages.length === 0) {
      return res.status(400).json({
        error: "Data gambar tidak ditemukan. Kirim 'image' (string base64) atau 'images' (array string base64).",
      });
    }

    // Validasi jumlah slide
    if (rawImages.length > MAX_BATCH_ITEMS) {
      return res.status(400).json({
        error: `Jumlah slide melebihi batas maksimal Meta Threads (${MAX_BATCH_ITEMS} slide per postingan).`,
      });
    }

    // Tentukan Base URL publik
    const forwardedProto = req.headers["x-forwarded-proto"];
    const proto = typeof forwardedProto === "string" ? forwardedProto.split(",")[0].trim() : "https";
    const forwardedHost = req.headers["x-forwarded-host"];
    const host = (typeof forwardedHost === "string" ? forwardedHost.split(",")[0].trim() : req.headers.host) || "localhost:3000";
    const appUrlEnv = (process.env.APP_URL || process.env.VITE_APP_URL || "").trim().replace(/\/$/, "");
    const baseUrl = appUrlEnv || `${proto}://${host}`;

    const savedUrls: string[] = [];

    for (let i = 0; i < rawImages.length; i++) {
      const imgItem = rawImages[i];
      if (typeof imgItem !== "string") {
        return res.status(400).json({ error: `Item gambar ke-${i + 1} tidak valid.` });
      }

      // 1. Parsing format Base64 Data URL
      let reportedMime = "image/png";
      let base64Data = imgItem;

      const matches = imgItem.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (matches) {
        reportedMime = matches[1].toLowerCase();
        base64Data = matches[2];
      }

      // Validasi MIME yang dilaporkan
      if (!ALLOWED_MIME_TYPES.includes(reportedMime) && reportedMime !== "image/jpg") {
        return res.status(400).json({
          error: `Format gambar ke-${i + 1} (${reportedMime}) tidak didukung. Gunakan PNG, JPEG, atau WEBP.`,
        });
      }

      // 2. Konversi ke Buffer & Validasi Ukuran File (Maks 8MB)
      let buffer: Buffer;
      try {
        buffer = Buffer.from(base64Data, "base64");
      } catch {
        return res.status(400).json({ error: `Data base64 slide ke-${i + 1} korup atau tidak valid.` });
      }

      if (buffer.length > MAX_FILE_SIZE_BYTES) {
        const sizeMb = (buffer.length / (1024 * 1024)).toFixed(2);
        return res.status(413).json({
          error: `Ukuran gambar ke-${i + 1} (${sizeMb} MB) melebihi batas kuota Meta Threads (Maksimal 8 MB). Silakan kompres visual terlebih dahulu.`,
        });
      }

      // 3. Validasi Keaslian Format Gambar (Magic Bytes Inspection)
      const validated = validateImageMagicBytes(buffer);
      if (!validated.isValid) {
        return res.status(400).json({
          error: `Slide ke-${i + 1} bukan file gambar biner yang valid atau data korup.`,
        });
      }

      // 4. Generate nama file yang aman dan unik
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const safeCustomName = filename ? `${filename.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 20)}_` : "";
      const generatedFileName = `slide_${safeCustomName}${timestamp}_${i + 1}_${randomStr}.${validated.ext}`;

      // 5. Simpan ke Storage Disk / Tmp (dengan try-catch untuk serverless read-only safety)
      try {
        const destPath = path.join(storageDir, generatedFileName);
        fs.writeFileSync(destPath, buffer);
      } catch (writeErr: any) {
        console.warn(`[Upload Service] Gagal menulis ke filesystem (${storageDir}):`, writeErr.message);
      }

      // Coba juga tulis ke public/uploads jika berbeda dan writable
      try {
        const localPub = path.resolve(process.cwd(), "public", "uploads");
        if (localPub !== storageDir && fs.existsSync(localPub)) {
          fs.writeFileSync(path.join(localPub, generatedFileName), buffer);
        }
      } catch {}

      // 6. Simpan di Memory Cache (Menjamin ketersediaan langsung di Vercel Serverless GET)
      memoryFileCache.set(generatedFileName, {
        buffer,
        mime: validated.mime,
        createdAt: timestamp,
      });

      // Bersihkan memory cache jika lebih dari 40 item
      if (memoryFileCache.size > 40) {
        const oldestKey = memoryFileCache.keys().next().value;
        if (oldestKey) memoryFileCache.delete(oldestKey);
      }

      // 7. Bentuk URL publik yang dapat diakses langsung oleh Threads Graph API
      // Menggunakan route GET /api/upload?file=... yang dijamin dapat diakses di Vercel maupun Express
      const publicUrl = `${baseUrl}/api/upload?file=${encodeURIComponent(generatedFileName)}`;
      savedUrls.push(publicUrl);
    }

    return res.status(200).json({
      success: true,
      count: savedUrls.length,
      url: savedUrls[0],
      urls: savedUrls,
    });
  } catch (err: any) {
    console.error("Gagal memproses upload gambar:", err);
    return res.status(500).json({
      error: `Gagal memvalidasi atau memproses gambar: ${err.message}`,
    });
  }
}
