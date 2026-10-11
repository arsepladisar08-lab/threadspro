import { Request, Response } from "express";

/**
 * Filter untuk menyaring teks boilerplate bawaan YouTube yang sering muncul
 * saat scraping meta tag generic.
 */
function isGenericYouTubeBoilerplate(text: string): boolean {
  if (!text) return true;
  const lower = text.trim().toLowerCase();
  return (
    lower.includes("nikmati video dan musik") ||
    lower.includes("enjoy the videos and music") ||
    lower.includes("upload konten asli") ||
    lower.includes("bagikan kepada teman, keluarga") ||
    lower.includes("share them with friends, family") ||
    lower.includes("about press copyright contact us creators")
  );
}

/**
 * Ekstraksi metadata otentik video YouTube langsung dari sumber asli:
 * Menggabungkan YouTube oEmbed (resmi), ytInitialData (deskripsi utuh, AI summary, babak/timestamp),
 * dan ytInitialPlayerResponse.
 */
export async function fetchYouTubeVideoMetadata(inputUrl: string) {
  const match = inputUrl.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/|v\/|live\/))([a-zA-Z0-9_-]{11})/i
  );
  if (!match) {
    throw new Error("Format tautan YouTube tidak valid. Gunakan format youtube.com/watch?v=... atau youtu.be/...");
  }
  const videoId = match[1];

  let title = "";
  let author = "";
  let authorUrl = "";
  let thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  let description = "";
  let aiSummary = "";
  let subscriberCount = "";
  let viewCount = "";
  let keywords: string[] = [];
  let durationMinutes = 0;
  const chapters: string[] = [];

  // 1. YouTube Official oEmbed API (Cepat, stabil, resmi untuk data dasar)
  try {
    const oeRes = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (oeRes.ok) {
      const oe = (await oeRes.json()) as any;
      if (oe.title) title = String(oe.title).trim();
      if (oe.author_name) author = String(oe.author_name).trim();
      if (oe.author_url) authorUrl = String(oe.author_url).trim();
      if (oe.thumbnail_url) thumbnailUrl = String(oe.thumbnail_url).trim();
    }
  } catch (err: any) {
    console.warn("[YouTube oEmbed Warning]:", err?.message);
  }

  // 2. YouTube Watch Page Scraping (Mengambil deskripsi asli, rangkuman materi, babak/timestamps)
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "id,en-US;q=0.9,en;q=0.8",
      },
    });

    if (pageRes.ok) {
      const html = await pageRes.text();

      // A. Ekstraksi dari ytInitialData (Sumber utama deskripsi utuh, AI summary, dan babak modern)
      const mData = html.match(/var ytInitialData\s*=\s*(\{.+?\});<\/script>/);
      if (mData) {
        try {
          const data = JSON.parse(mData[1]);

          // Judul dari primary info jika oEmbed belum dapat
          if (!title) {
            const primary = data.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[0]?.videoPrimaryInfoRenderer;
            const priTitle = primary?.title?.runs?.map((r: any) => r.text).join("");
            if (priTitle) title = priTitle.trim();
          }

          // Kreator & Subscriber dari secondary info
          const secondary = data.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[1]?.videoSecondaryInfoRenderer;
          const owner = secondary?.owner?.videoOwnerRenderer;
          if (!author && owner?.title?.runs) {
            author = owner.title.runs.map((r: any) => r.text).join("").trim();
          }
          if (owner?.subscriberCountText?.simpleText) {
            subscriberCount = owner.subscriberCountText.simpleText.trim();
          }

          // Structured Description Panel (Tempat deskripsi asli & ringkasan YouTube)
          const panel = data.engagementPanels?.find(
            (p: any) => p.engagementPanelSectionListRenderer?.panelIdentifier === "engagement-panel-structured-description"
          );
          const items = panel?.engagementPanelSectionListRenderer?.content?.structuredDescriptionContentRenderer?.items || [];

          for (const item of items) {
            // Deskripsi lengkap asli yang ditulis kreator
            if (item.expandableVideoDescriptionBodyRenderer) {
              const bodyText = item.expandableVideoDescriptionBodyRenderer.attributedDescriptionBodyText?.content;
              if (bodyText && !isGenericYouTubeBoilerplate(bodyText)) {
                description = bodyText.trim();
              }
            }

            // Ringkasan resmi esensi video jika tersedia di YouTube
            if (item.expandableMetadataRenderer) {
              const summ = item.expandableMetadataRenderer?.header?.collapsedTitle?.simpleText;
              if (summ && !isGenericYouTubeBoilerplate(summ)) {
                aiSummary = summ.trim();
              }
            }
          }
        } catch (dataErr: any) {
          console.warn("[YouTube ytInitialData Parse Warning]:", dataErr?.message);
        }
      }

      // B. Fallback dari ytInitialPlayerResponse jika deskripsi belum didapat
      if (!description) {
        const mPlayer = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});(?:var|<\/script)/);
        if (mPlayer) {
          try {
            const p = JSON.parse(mPlayer[1]);
            const d = p.videoDetails || {};
            if (!title && d.title) title = d.title.trim();
            if (!author && d.author) author = d.author.trim();
            if (d.shortDescription && !isGenericYouTubeBoilerplate(d.shortDescription)) {
              description = d.shortDescription.trim();
            }
            if (Array.isArray(d.keywords) && d.keywords.length > 0) {
              keywords = d.keywords;
            }
            if (d.lengthSeconds) {
              durationMinutes = Math.round(parseInt(d.lengthSeconds, 10) / 60);
            }
          } catch {}
        }
      }

      // C. Fallback regex attributedDescriptionBodyText jika JSON parse gagal
      if (!description) {
        const mDescRegex = html.match(/"attributedDescriptionBodyText":\s*\{.*?"content":\s*"(.*?)"/);
        if (mDescRegex && mDescRegex[1]) {
          try {
            const raw = JSON.parse(`"${mDescRegex[1]}"`);
            if (!isGenericYouTubeBoilerplate(raw)) {
              description = raw.trim();
            }
          } catch {
            const cleaned = mDescRegex[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
            if (!isGenericYouTubeBoilerplate(cleaned)) {
              description = cleaned.trim();
            }
          }
        }
      }
    }
  } catch (err: any) {
    console.warn("[YouTube Page Warning]:", err?.message);
  }

  // 3. Ekstrak babak/timestamps nyata dari deskripsi
  if (description) {
    const lines = description.split("\n");
    const timeRegex = /(?:^|\s)(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:\s+[-–—]?\s*|\s+)(.+)$/;
    let maxSec = 0;
    for (const line of lines) {
      const tm = line.match(timeRegex);
      if (tm) {
        const cleanedLine = line.trim();
        chapters.push(cleanedLine);
        const h = tm[1] ? parseInt(tm[1], 10) : 0;
        const m = parseInt(tm[2], 10);
        const s = parseInt(tm[3], 10);
        const totalSec = h * 3600 + m * 60 + s;
        if (totalSec > maxSec) maxSec = totalSec;
      }
    }
    // Jika durasi belum diketahui, gunakan waktu babak tertinggi sebagai patokan minimal
    if (durationMinutes === 0 && maxSec > 0) {
      durationMinutes = Math.round(maxSec / 60);
    }
  }

  return {
    videoId,
    title: title || "Video YouTube",
    author: author || "Kreator YouTube",
    authorUrl,
    subscriberCount,
    thumbnailUrl,
    description: description.trim(),
    aiSummary: aiSummary.trim(),
    keywords,
    durationMinutes,
    chapters,
    viewCount,
  };
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const url = (req.query?.url || req.body?.url || "").toString().trim();
  if (!url) {
    return res.status(400).json({ error: "Parameter 'url' YouTube wajib disertakan." });
  }

  try {
    const data = await fetchYouTubeVideoMetadata(url);
    return res.status(200).json({ success: true, ...data });
  } catch (err: any) {
    console.error("[YouTube Handler Error]:", err);
    return res.status(400).json({ error: err.message || "Gagal memproses URL YouTube." });
  }
}
