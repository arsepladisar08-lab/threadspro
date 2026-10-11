/**
 * Layanan Ekstraksi Metadata Video YouTube Terverifikasi
 * Mengambil judul asli, kreator/kanal resmi, deskripsi lengkap, babak/timestamp, dan thumbnail.
 */

export interface YouTubeMetadata {
  videoId: string;
  url: string;
  title: string;
  author: string;
  authorUrl?: string;
  subscriberCount?: string;
  thumbnailUrl: string;
  description: string;
  aiSummary?: string;
  keywords: string[];
  durationMinutes?: number;
  chapters: string[];
  viewCount?: string;
}

/**
 * Ekstrak ID Video YouTube dari berbagai format tautan:
 * - youtube.com/watch?v=VIDEO_ID
 * - youtu.be/VIDEO_ID
 * - youtube.com/shorts/VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 * - youtube.com/live/VIDEO_ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  const clean = (url || "").trim();
  const match = clean.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/|v\/|live\/))([a-zA-Z0-9_-]{11})/i
  );
  return match ? match[1] : null;
}

export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}

/**
 * Mengambil metadata otentik video dari endpoint server /api/youtube,
 * dengan fallback client-side ke YouTube oEmbed API jika endpoint server tidak dapat diakses.
 */
export async function fetchYouTubeMetadata(url: string): Promise<YouTubeMetadata> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw new Error("Tautan YouTube tidak valid. Gunakan format youtube.com/watch?v=... atau youtu.be/...");
  }

  // 1. Coba panggil server endpoint /api/youtube terlebih dahulu (kaya informasi deskripsi, AI summary, & chapters)
  try {
    const res = await fetch(`/api/youtube?url=${encodeURIComponent(url)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.success) {
        return {
          videoId,
          url,
          title: json.title || "Video YouTube",
          author: json.author || "Kreator YouTube",
          authorUrl: json.authorUrl,
          subscriberCount: json.subscriberCount,
          thumbnailUrl: json.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          description: json.description || "",
          aiSummary: json.aiSummary || "",
          keywords: Array.isArray(json.keywords) ? json.keywords : [],
          durationMinutes: typeof json.durationMinutes === "number" ? json.durationMinutes : 0,
          chapters: Array.isArray(json.chapters) ? json.chapters : [],
          viewCount: json.viewCount,
        };
      }
    }
  } catch (serverErr) {
    console.warn("[YouTube Service] Gagal mengakses /api/youtube, mencoba fallback oEmbed langsung:", serverErr);
  }

  // 2. Fallback client-side langsung ke YouTube oEmbed (CORS didukung secara publik oleh YouTube)
  try {
    const oeRes = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (oeRes.ok) {
      const oe = await oeRes.json();
      return {
        videoId,
        url,
        title: oe.title || "Video YouTube",
        author: oe.author_name || "Kreator YouTube",
        authorUrl: oe.author_url,
        thumbnailUrl: oe.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        description: "",
        aiSummary: "",
        keywords: [],
        durationMinutes: 0,
        chapters: [],
      };
    }
  } catch (oeErr) {
    console.warn("[YouTube Service] Fallback oEmbed juga gagal:", oeErr);
  }

  throw new Error("Tidak dapat memverifikasi video YouTube. Pastikan link video publik dan koneksi internet stabil.");
}
