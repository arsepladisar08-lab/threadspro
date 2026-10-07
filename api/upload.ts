import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pastikan direktori public/uploads ada
const uploadsDir = path.resolve(__dirname, "..", "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Endpoint Pengunggahan Gambar Sementara untuk Meta Threads Graph API
 * Menerima base64 data URL canvas, menyimpan secara lokal, dan mengembalikan URL publik HTTPS yang valid.
 */
export default async function uploadHandler(req: Request, res: Response) {
  // Dukung CORS preflight jika dipanggil dari origin lain
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.json({
      status: "ok",
      message: "Endpoint Upload Gambar AutoThreads aktif.",
      dir: uploadsDir,
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Gunakan POST." });
  }

  try {
    const { image, images, filename } = req.body || {};

    // Kumpulkan daftar gambar (single atau batch)
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
      // Ambil ekstensi dan buffer
      let mime = "image/png";
      let base64Data = imgItem;

      const matches = imgItem.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (matches) {
        mime = matches[1];
        base64Data = matches[2];
      }

      const ext = mime.includes("jpeg") || mime.includes("jpg") ? "jpg" : "png";
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const safeCustomName = (filename ? `${filename.replace(/[^a-zA-Z0-9_-]/g, "")}_` : "");
      const generatedFileName = `slide_${safeCustomName}${timestamp}_${i + 1}_${randomStr}.${ext}`;
      const filePath = path.join(uploadsDir, generatedFileName);

      const buffer = Buffer.from(base64Data, "base64");
      fs.writeFileSync(filePath, buffer);

      const publicUrl = `${baseUrl}/uploads/${generatedFileName}`;
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
      error: `Gagal menyimpan gambar di server: ${err.message}`,
    });
  }
}
