/**
 * AutoThreads Official Threads Client
 * Terhubung langsung ke Meta Threads Graph API resmi menggunakan Token Akses Pengguna
 * dan OAuth 2.0. Mock mode dinonaktifkan secara default.
 */

import { storage } from "../lib/storage";
import { CONFIG } from "../config";

export interface ThreadsAccount {
  id: string;
  username: string;
  name: string;
  threads_profile_picture_url: string;
  threads_biography: string;
  followers_count: number;
  connectedAt: number;
  tokenExpiryDays: number;
  status: "active" | "needs_reconnect" | "disconnected";
  token?: string;
  isReal?: boolean;
}

export interface ThreadsPostInsight {
  views: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
  shares: number;
}

export interface ThreadsPostData {
  id: string;
  text: string;
  timestamp: string;
  permalink: string;
  media_type: "TEXT_POST" | "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | string;
  insights: ThreadsPostInsight;
  linkedVariantId?: string;
  snapshots?: {
    minute10?: ThreadsPostInsight;
    minute30?: ThreadsPostInsight;
    minute60?: ThreadsPostInsight;
    hour24?: ThreadsPostInsight;
    day7?: ThreadsPostInsight;
  };
}

export interface QuotaState {
  dailyCallsLimit: number;
  dailyCallsUsed: number;
  publishingLimit: number;
  publishingUsed: number;
  searchLimit: number;
  searchUsed: number;
  circuitBreakerStatus: "CLOSED" | "HALF_OPEN" | "OPEN";
  lastResetTime: number;
}

const GRAPH_BASE_URL = "https://graph.threads.net/v1.0";
const FALLBACK_READY_WAIT_MS = 10000;

let quotaState: QuotaState = {
  dailyCallsLimit: 24000,
  dailyCallsUsed: 0,
  publishingLimit: 25,
  publishingUsed: 0,
  searchLimit: 300,
  searchUsed: 0,
  circuitBreakerStatus: "CLOSED",
  lastResetTime: Date.now(),
};

export const threadsClient = {
  lastInsightsWarning: null as string | null,

  /**
   * Cek status koneksi akun Threads dari penyimpanan lokal
   */
  async getAccount(): Promise<ThreadsAccount | null> {
    const saved = await storage.getThreadsAccount();
    if (!saved) return null;
    return saved as ThreadsAccount;
  },

  /**
   * Hubungkan akun langsung menggunakan User Access Token Meta Threads
   * @param token User Access Token (Short-lived atau Long-lived token)
   */
  async connectWithToken(token: string): Promise<ThreadsAccount> {
    const cleanToken = token.trim();
    if (!cleanToken) {
      throw new Error("Token akses tidak boleh kosong.");
    }

    quotaState.dailyCallsUsed += 1;

    // 1. Validasi Token dan Ambil Profil User
    const profileUrl = `${GRAPH_BASE_URL}/me?fields=id,username,name,threads_profile_picture_url,threads_biography&access_token=${encodeURIComponent(cleanToken)}`;
    
    let res: Response;
    try {
      res = await fetch(profileUrl);
    } catch (networkErr: any) {
      throw new Error(
        `Koneksi jaringan ke Meta Threads Graph API gagal: ${networkErr.message}. Pastikan koneksi internet stabil.`
      );
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const msg = errJson?.error?.message || `HTTP ${res.status}: Gagal memvalidasi token Threads`;
      throw new Error(msg);
    }

    const data = await res.json();
    if (!data.id) {
      throw new Error("Respons Meta Threads tidak mengembalikan ID pengguna yang valid.");
    }

    const account: ThreadsAccount = {
      id: data.id,
      username: data.username || "threads_user",
      name: data.name || data.username || "Pengguna Threads",
      threads_profile_picture_url:
        data.threads_profile_picture_url ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.username || "TH")}`,
      threads_biography: data.threads_biography || "",
      followers_count: 0, // Threads Graph API belum selalu menyediakan follower count secara publik
      connectedAt: Date.now(),
      tokenExpiryDays: 60, // Long-lived token Meta Threads berlaku 60 hari
      status: "active",
      token: cleanToken,
      isReal: true,
    };

    // Simpan ke IndexedDB & tabel api_profiles
    await storage.saveThreadsAccount(account);
    await storage.saveThreadsToken(cleanToken);
    await storage.saveApiProfile({
      token: cleanToken,
      threads_user_id: data.id,
      username: data.username,
      updatedAt: Date.now(),
    });

    // 2. Muat postingan terbaru secara otomatis menggunakan fetchThreadsOriginal
    try {
      await this.fetchThreadsOriginal({ passedToken: cleanToken, limitCount: 20 });
    } catch (e) {
      console.warn("Sinkronisasi postingan awal dilewati:", e);
    }

    return account;
  },

  /**
   * Mengambil kumpulan utas asli langsung dari akun pemilik token resmi Meta Threads
   * Mendukung pengambilan SEMUA postingan (pagination loop) atau PILIHAN jumlah (limitCount)
   */
  async fetchThreadsOriginal(options?: {
    limitCount?: number;
    passedToken?: string;
  }): Promise<ThreadsPostData[]> {
    // 1. Ambil token & threads_user_id dari tabel api_profiles (jangan hardcode)
    const profile = await storage.getApiProfile();
    const token = options?.passedToken || profile?.token || (await storage.getThreadsToken());

    if (!token || !token.trim()) {
      throw new Error(
        "Token akses Threads belum disetel. Masukkan Token Akses di Pengaturan > API Profil / API Lab."
      );
    }
    const cleanToken = token.trim();

    // 2. Validasi Token & User ID: wajib hit GET /v1.0/me?fields=id,username&access_token=TOKEN
    quotaState.dailyCallsUsed += 1;
    const validateUrl = `${GRAPH_BASE_URL}/me?fields=id,username,name,threads_profile_picture_url,threads_biography&access_token=${encodeURIComponent(cleanToken)}`;

    let meRes: Response;
    try {
      meRes = await fetch(validateUrl);
    } catch (networkErr: any) {
      throw new Error(
        `Koneksi jaringan ke Meta Threads Graph API gagal: ${networkErr.message}. Periksa koneksi internet.`
      );
    }

    const meData = await meRes.json().catch(() => ({}));
    if (!meRes.ok || meData.error) {
      const errMsg = meData.error?.message || `HTTP ${meRes.status}`;
      console.error("[Threads API] Validasi token gagal:", meData.error);
      throw new Error(`Token invalid, user harus re-auth di Pengaturan API (${errMsg})`);
    }

    if (!meData.id) {
      throw new Error("Respons Meta Threads tidak mengembalikan ID pengguna yang valid.");
    }

    // Jika ID beda dengan yang disimpan, perbarui api_profiles & threads_account
    if (!profile || profile.threads_user_id !== meData.id || profile.token !== cleanToken) {
      await storage.saveApiProfile({
        token: cleanToken,
        threads_user_id: meData.id,
        username: meData.username || "",
        updatedAt: Date.now(),
      });
    }

    const existingAccount = await storage.getThreadsAccount();
    const updatedAccount: ThreadsAccount = {
      ...(existingAccount || {}),
      id: meData.id,
      username: meData.username || existingAccount?.username || "threads_user",
      name: meData.name || existingAccount?.name || meData.username || "Pengguna Threads",
      threads_profile_picture_url:
        meData.threads_profile_picture_url ||
        existingAccount?.threads_profile_picture_url ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(meData.username || "TH")}`,
      threads_biography: meData.threads_biography || existingAccount?.threads_biography || "",
      followers_count: existingAccount?.followers_count || 0,
      connectedAt: existingAccount?.connectedAt || Date.now(),
      tokenExpiryDays: 60,
      status: "active",
      token: cleanToken,
      isReal: true,
    };
    await storage.saveThreadsAccount(updatedAccount);

    // 3. Implementasi Fetch yang benar dengan pagination loop
    const fields =
      "id,media_product_type,media_type,media_url,permalink,owner,username,text,timestamp,shortcode,thumbnail_url,children,is_quote_post";
    const pageLimit = options?.limitCount && options.limitCount < 100 ? options.limitCount : 100;
    let url: string | null = `${GRAPH_BASE_URL}/me/threads?fields=${fields}&limit=${pageLimit}&access_token=${encodeURIComponent(cleanToken)}`;

    let allData: any[] = [];
    let page = 1;

    while (url) {
      console.log(`[Threads API] Fetching page ${page}...`);
      quotaState.dailyCallsUsed += 1;
      const response = await fetch(url);
      const resJson: any = await response.json().catch(() => ({}));

      if (resJson.error) {
        console.error(`[Threads API] Error response on page ${page}:`, resJson.error);
        throw new Error(JSON.stringify(resJson.error));
      }

      const pageData = Array.isArray(resJson.data) ? resJson.data : [];
      console.log(`[Threads API] Page ${page} data.length = ${pageData.length}`);
      allData.push(...pageData);

      // Jika user memilih batasan tertentu (limitCount) dan sudah terpenuhi
      if (options?.limitCount && allData.length >= options.limitCount) {
        allData = allData.slice(0, options.limitCount);
        break;
      }

      url = resJson.paging?.next || null; // wajib loop pagination, jangan ambil halaman pertama saja
      page++;
    }

    console.log(`[Threads API] Total raw utas fetched: ${allData.length}`);

    // 4. Mapping & Metrik Insights
    // Saring dan JANGAN sertakan postingan dengan tipe 'REPOST_FACADE' (repost akun lain)
    const originalItems = allData.filter((item) => {
      const mType = (item.media_type || "").toUpperCase();
      const pType = (item.media_product_type || "").toUpperCase();
      if (
        mType === "REPOST_FACADE" ||
        pType === "REPOST_FACADE" ||
        mType.includes("REPOST_FACADE") ||
        pType.includes("REPOST_FACADE")
      ) {
        console.log(`[Threads API] Mengabaikan postingan tipe REPOST_FACADE: ${item.id}`);
        return false;
      }
      return true;
    });

    console.log(`[Threads API] Total utas asli non-repost_facade: ${originalItems.length}`);

    // Reset warning sebelum fetch insights
    this.lastInsightsWarning = null;
    let hadPermissionIssue = false;

    const posts: ThreadsPostData[] = [];

    for (const item of originalItems) {
      let insights: ThreadsPostInsight = {
        views: 0,
        likes: 0,
        replies: 0,
        reposts: 0,
        quotes: 0,
        shares: 0,
      };

      try {
        quotaState.dailyCallsUsed += 1;
        // Coba kombinasi metrik bertahap untuk kompatibilitas Meta Graph API
        const tryMetricUrls = [
          `${GRAPH_BASE_URL}/${item.id}/insights?metric=views,likes,replies,reposts,quotes&access_token=${encodeURIComponent(cleanToken)}`,
          `${GRAPH_BASE_URL}/${item.id}/insights?metric=views,likes,replies&access_token=${encodeURIComponent(cleanToken)}`,
          `${GRAPH_BASE_URL}/${item.id}/insights?metric=likes,replies&access_token=${encodeURIComponent(cleanToken)}`,
          `${GRAPH_BASE_URL}/${item.id}/insights?metric=likes&access_token=${encodeURIComponent(cleanToken)}`,
        ];

        let insRes: Response | null = null;
        for (const mUrl of tryMetricUrls) {
          try {
            const tempRes = await fetch(mUrl);
            if (tempRes.ok) {
              insRes = tempRes;
              break;
            } else if (!insRes) {
              insRes = tempRes; // simpan response pertama untuk cek error
            }
          } catch {
            // Lanjut ke kombinasi berikutnya
          }
        }

        if (insRes && insRes.ok) {
          const insJson = await insRes.json();
          if (Array.isArray(insJson.data)) {
            for (const m of insJson.data) {
              const val =
                (typeof m.total_value === "number" ? m.total_value : undefined) ??
                (typeof m.total_value?.value === "number" ? m.total_value.value : undefined) ??
                (typeof m.values?.[0]?.value === "number" ? m.values[0].value : undefined) ??
                (typeof m.value === "number" ? m.value : undefined) ??
                (Number(m.total_value?.value) || Number(m.values?.[0]?.value) || 0);

              if (m.name === "views") insights.views = val;
              if (m.name === "likes") insights.likes = val;
              if (m.name === "replies") insights.replies = val;
              if (m.name === "reposts") insights.reposts = val;
              if (m.name === "quotes") insights.quotes = val;
            }
          }
        } else if (insRes && !insRes.ok) {
          const errJson = await insRes.json().catch(() => null);
          const errMsg = errJson?.error?.message || "";
          if (
            errJson?.error?.code === 10 ||
            errMsg.toLowerCase().includes("permission") ||
            errMsg.toLowerCase().includes("threads_manage_insights")
          ) {
            hadPermissionIssue = true;
          }
        }
      } catch (err) {
        // Lanjutkan jika insights postingan individual dibatasi
      }

      posts.push({
        id: item.id,
        text: item.text || "",
        timestamp: item.timestamp || new Date().toISOString(),
        permalink: item.permalink || `https://threads.net/post/${item.id}`,
        media_type: item.media_type || "TEXT_POST",
        insights,
      });
    }

    if (hadPermissionIssue) {
      this.lastInsightsWarning =
        "Perhatian: Data View, Like, dan Reply terbaca 0 karena Token Akses Meta Anda belum memiliki izin 'threads_manage_insights'. Untuk mengaktifkan sinkronisasi angka otomatis, generate token dengan izin 'threads_basic' dan 'threads_manage_insights' di Meta Developer Console. Anda juga dapat mengisi angka secara manual via tombol Edit (✏️).";
    }

    // Upsert by id (threads_media_id), bukan by permalink
    const currentStored = await storage.getThreadsPosts();
    const postMap = new Map<string, ThreadsPostData>();
    for (const p of currentStored) {
      if (p && p.id) postMap.set(p.id, p);
    }
    for (const p of posts) {
      if (p && p.id) postMap.set(p.id, p);
    }
    const mergedPosts = Array.from(postMap.values());
    await storage.saveThreadsPosts(mergedPosts);

    return posts;
  },

  /**
   * Sinkronisasi postingan akun asli dari Meta Threads Graph API (Alias ke fetchThreadsOriginal)
   */
  async syncRealPosts(passedToken?: string, limitCount?: number): Promise<ThreadsPostData[]> {
    return this.fetchThreadsOriginal({ passedToken, limitCount });
  },

  /**
   * Hubungkan akun sandbox / demo untuk uji coba langsung tanpa Meta Developer token
   */
  async connectDemoAccount(customUsername = "kreator_threads"): Promise<ThreadsAccount> {
    const cleanUser = customUsername.trim().replace(/^@/, "") || "kreator_threads";
    const account: ThreadsAccount = {
      id: "demo_" + Math.random().toString(36).substring(2, 10),
      username: cleanUser,
      name: `Kreator ${cleanUser.charAt(0).toUpperCase() + cleanUser.slice(1)}`,
      threads_profile_picture_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanUser)}`,
      threads_biography: "Kreator konten terkurasi, bertumbuh konsisten di Meta Threads dengan AutoThreads.",
      followers_count: 1420,
      connectedAt: Date.now(),
      tokenExpiryDays: 60,
      status: "active",
      token: "demo_sandbox_token_" + Date.now(),
      isReal: false,
    };

    await storage.saveThreadsAccount(account);
    await storage.saveThreadsToken(account.token!);
    await storage.saveApiProfile({
      token: account.token!,
      threads_user_id: account.id,
      username: account.username,
      updatedAt: Date.now(),
    });

    return account;
  },

  /**
   * Putuskan Akun Threads & Hapus Token
   */
  async disconnectAccount(): Promise<void> {
    await storage.clearThreadsAccount();
  },

  /**
   * Ambil daftar postingan akun sendiri
   */
  async getOwnPosts(options?: {
    forceFetch?: boolean;
    limitCount?: number;
  }): Promise<ThreadsPostData[]> {
    if (options?.forceFetch) {
      return this.fetchThreadsOriginal(options);
    }

    const cached = await storage.getThreadsPosts();
    if (cached && cached.length > 0) {
      if (options?.limitCount) return cached.slice(0, options.limitCount);
      return cached;
    }

    // Jika cache kosong, otomatis fetch data asli menggunakan token
    const token = await storage.getThreadsToken();
    if (token) {
      try {
        return await this.fetchThreadsOriginal(options);
      } catch (err) {
        console.warn("Gagal auto-fetch threads original saat cache kosong:", err);
      }
    }

    return [];
  },

  /**
   * Ambil status kuota Meta API
   */
  async getQuotaState(): Promise<QuotaState> {
    return quotaState;
  },

  /**
   * Mengunggah gambar base64 canvas ke server penyimpanan publik sementara
   * untuk mendapatkan URL publik HTTPS yang valid untuk Meta Threads API
   */
  async uploadCanvasImages(images: string[]): Promise<string[]> {
    if (!images || images.length === 0) return [];
    
    // Panggil endpoint /api/upload
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.error || `Gagal mengunggah gambar ke server publik (HTTP ${res.status})`);
    }

    const data = await res.json();
    if (!data.urls || !Array.isArray(data.urls) || data.urls.length === 0) {
      throw new Error("Server tidak mengembalikan URL publik yang valid untuk gambar.");
    }

    return data.urls;
  },

  /**
   * Polling status container Meta Threads hingga berstatus FINISHED sebelum dipublikasikan
   * Memiliki batas timeout 30 detik sesuai spesifikasi resmi Threads Graph API
   */
  async waitForContainerReady(
    containerId: string,
    token: string,
    maxWaitMs: number = 30000,
    onProgress?: (info: string) => void
  ): Promise<boolean> {
    const startTime = Date.now();
    const pollInterval = maxWaitMs > 60000 ? 5000 : 1500; // video: polling lebih jarang
    let attempt = 1;
    let networkFailures = 0;

    while (Date.now() - startTime < maxWaitMs) {
      quotaState.dailyCallsUsed += 1;
      const statusUrl = `${GRAPH_BASE_URL}/${containerId}?fields=status,error_message&access_token=${encodeURIComponent(token)}`;

      let res: Response;
      try {
        res = await fetch(statusUrl);
      } catch (err: any) {
  networkFailures++;
  console.warn(`[Threads API] Network error polling container ${containerId}:`, err);
  if (networkFailures >= 3 && maxWaitMs <= 30000) {
    onProgress?.("Status container tidak bisa dibaca dari browser, menunggu beberapa detik lalu lanjut menerbitkan...");
    await new Promise((r) => setTimeout(r, FALLBACK_READY_WAIT_MS));
    return true;
  }
  await new Promise((r) => setTimeout(r, pollInterval));
  continue;
}
networkFailures = 0; // tepat setelah blok try/catch fetch

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `HTTP ${res.status}`;
        throw new Error(`Gagal memeriksa status media container ${containerId}: ${errMsg}`);
      }

      const data = await res.json();
      const status = (data.status || "").toUpperCase();

      if (status === "FINISHED") {
        return true;
      } else if (status === "ERROR") {
        const detail = data.error_message || "Pemrosesan media ditolak oleh server Meta Threads.";
        throw new Error(`Media container ${containerId} gagal diproses: ${detail}`);
      } else if (status === "IN_PROGRESS") {
        if (onProgress) {
          onProgress(`Memverifikasi media container Meta Threads... (${attempt}x, status: IN_PROGRESS)`);
        }
        await new Promise((r) => setTimeout(r, pollInterval));
        attempt++;
      } else {
        // Status lain menunggu
        await new Promise((r) => setTimeout(r, pollInterval));
        attempt++;
      }
    }

    throw new Error(
      `Timeout menunggu pemrosesan media Meta Threads (${Math.round(maxWaitMs / 1000)} detik). Container ID: ${containerId}. Silakan coba beberapa saat lagi.`
    );
  },

  /**
   * Helper internal: Buat container (TEXT, SINGLE IMAGE, SINGLE VIDEO, atau CAROUSEL)
   * dan publikasikan langsung ke Meta Threads.
   */
  async createAndPublishPostContainer(opts: {
    text: string;
    media?: Array<{ url: string; type: "IMAGE" | "VIDEO" }>;
    topicTag?: string;
    replyToId?: string;
    token: string;
    label: string;
    onProgress?: (status: string) => void;
  }): Promise<{ postId: string; mediaType: "TEXT_POST" | "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" }> {
    const { text, media, topicTag, replyToId, token, label, onProgress } = opts;
    const cleanTopic = topicTag ? topicTag.replace(/#/g, "").trim() : "";
    const mediaItems = Array.isArray(media) ? media : [];
    const hasMedia = mediaItems.length > 0;
    const isMultiMediaCarousel = mediaItems.length > 1;
    const readyTimeoutFor = (type: "IMAGE" | "VIDEO") => (type === "VIDEO" ? 300000 : 30000);

    if (mediaItems.length > 20) {
      throw new Error(`Media untuk ${label} maksimal 20 item.`);
    }

    let creationId = "";
    let finalMediaType: "TEXT_POST" | "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" = "TEXT_POST";

    if (isMultiMediaCarousel) {
      finalMediaType = "CAROUSEL_ALBUM";
      const totalSlides = mediaItems.length;
      const childContainerIds: string[] = [];

      onProgress?.(`${label}: Menyiapkan ${totalSlides} slide media carousel...`);

      for (let i = 0; i < totalSlides; i++) {
        const slide = mediaItems[i];
        onProgress?.(`${label}: Mengunggah slide item #${i + 1} dari ${totalSlides}...`);

        const itemBody = new URLSearchParams();
        itemBody.append("media_type", slide.type);
        itemBody.append("is_carousel_item", "true");
        itemBody.append(slide.type === "VIDEO" ? "video_url" : "image_url", slide.url);
        itemBody.append("access_token", token);

        quotaState.dailyCallsUsed += 1;
        const itemRes = await fetch(`${GRAPH_BASE_URL}/me/threads`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: itemBody,
        });

        if (!itemRes.ok) {
          const errJson = await itemRes.json().catch(() => ({}));
          throw new Error(
            errJson?.error?.message || `Gagal membuat container slide #${i + 1} untuk ${label} (HTTP ${itemRes.status})`
          );
        }

        const itemData = await itemRes.json();
        childContainerIds.push(itemData.id);
      }

      // Validasi kesiapan semua slide
      for (let i = 0; i < childContainerIds.length; i++) {
        const cId = childContainerIds[i];
        onProgress?.(`${label}: Memvalidasi status slide #${i + 1} di Threads...`);
        await this.waitForContainerReady(cId, token, readyTimeoutFor(mediaItems[i].type), onProgress);
      }

      // Buat container induk CAROUSEL
      onProgress?.(`${label}: Merangkai album carousel (${childContainerIds.length} item)...`);
      const carouselBody = new URLSearchParams();
      carouselBody.append("media_type", "CAROUSEL");
      carouselBody.append("children", childContainerIds.join(","));
      carouselBody.append("text", text);
      if (cleanTopic) carouselBody.append("topic_tag", cleanTopic);
      if (replyToId) carouselBody.append("reply_to_id", replyToId);
      carouselBody.append("access_token", token);

      quotaState.dailyCallsUsed += 1;
      const carouselRes = await fetch(`${GRAPH_BASE_URL}/me/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: carouselBody,
      });

      if (!carouselRes.ok) {
        const errJson = await carouselRes.json().catch(() => ({}));
        throw new Error(
          errJson?.error?.message || `Gagal membuat album carousel untuk ${label} (HTTP ${carouselRes.status})`
        );
      }

      const carouselData = await carouselRes.json();
      creationId = carouselData.id;
      await this.waitForContainerReady(creationId, token, 30000, onProgress);

    } else if (hasMedia) {
      const single = mediaItems[0];
      finalMediaType = single.type === "VIDEO" ? "VIDEO" : "IMAGE";
      onProgress?.(`${label}: Membuat container ${single.type === "VIDEO" ? "video" : "gambar"} di Threads...`);

      const mediaBody = new URLSearchParams();
      mediaBody.append("media_type", single.type);
      mediaBody.append(single.type === "VIDEO" ? "video_url" : "image_url", single.url);
      mediaBody.append("text", text);
      if (cleanTopic) mediaBody.append("topic_tag", cleanTopic);
      if (replyToId) mediaBody.append("reply_to_id", replyToId);
      mediaBody.append("access_token", token);

      quotaState.dailyCallsUsed += 1;
      const mediaRes = await fetch(`${GRAPH_BASE_URL}/me/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: mediaBody,
      });

      if (!mediaRes.ok) {
        const errJson = await mediaRes.json().catch(() => ({}));
        throw new Error(
          errJson?.error?.message || `Gagal membuat container media untuk ${label} (HTTP ${mediaRes.status})`
        );
      }

      const mediaData = await mediaRes.json();
      creationId = mediaData.id;
      await this.waitForContainerReady(creationId, token, readyTimeoutFor(single.type), onProgress);

    } else {
      finalMediaType = "TEXT_POST";
      onProgress?.(`${label}: Membuat container teks di Threads...`);

      const textBody = new URLSearchParams();
      textBody.append("media_type", "TEXT");
      textBody.append("text", text);
      if (cleanTopic) textBody.append("topic_tag", cleanTopic);
      if (replyToId) textBody.append("reply_to_id", replyToId);
      textBody.append("access_token", token);

      quotaState.dailyCallsUsed += 1;
      const textRes = await fetch(`${GRAPH_BASE_URL}/me/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: textBody,
      });

      if (!textRes.ok) {
        const errJson = await textRes.json().catch(() => ({}));
        throw new Error(
          errJson?.error?.message || `Gagal membuat container teks untuk ${label} (HTTP ${textRes.status})`
        );
      }

      const textData = await textRes.json();
      creationId = textData.id;
    }

    // Terbitkan container ke Threads feed
    onProgress?.(`${label}: Menerbitkan postingan ke feed Threads...`);
    const pubBody = new URLSearchParams();
    pubBody.append("creation_id", creationId);
    pubBody.append("access_token", token);

    quotaState.dailyCallsUsed += 1;
    quotaState.publishingUsed += 1;

    const pubRes = await fetch(`${GRAPH_BASE_URL}/me/threads_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: pubBody,
    });

    if (!pubRes.ok) {
      const errJson = await pubRes.json().catch(() => ({}));
      throw new Error(
        errJson?.error?.message || `Gagal menerbitkan ${label} ke Threads (HTTP ${pubRes.status})`
      );
    }

    const pubData = await pubRes.json();
    return { postId: pubData.id, mediaType: finalMediaType };
  },

  /**
   * Menerbitkan postingan ke Threads menggunakan API Resmi.
   * Mendukung publikasi seluruh utas atau pilihan postingan tertentu,
   * dengan lampiran teks, gambar tunggal, video, maupun carousel album pada setiap post.
   */
  async publishThread(params: {
    text?: string;
    posts?: Array<{
      order?: number;
      text: string;
      media_suggestion?: string;
      media?: Array<{ url: string; type: "IMAGE" | "VIDEO" }>;
    } | string>;
    subsequentPosts?: string[];
    topicTag?: string;
    reply2Text?: string;
    reply2Media?: Array<{ url: string; type: "IMAGE" | "VIDEO" }>;
    imageUrls?: string[];
    isCarousel?: boolean;
    /** Media campuran gambar/video (URL publik). Jika diisi, menjadi fallback untuk post pertama. */
    media?: Array<{ url: string; type: "IMAGE" | "VIDEO" }>;
    /**
     * "root"  : Post #2 dst. membalas langsung Post #1
     * "chain" : tiap post membalas post sebelumnya (berantai)
     */
    replyMode?: "root" | "chain";
    onProgress?: (status: string) => void;
  }): Promise<{ success: boolean; postId: string; permalink: string; publishedCount: number }> {
    const token = await storage.getThreadsToken();
    const account = await this.getAccount();

    if (!token || !account) {
      throw new Error(
        "Akun Threads asli belum terhubung. Silakan masukkan Token Akses Akun Threads Anda terlebih dahulu."
      );
    }

    if (quotaState.publishingUsed >= quotaState.publishingLimit) {
      throw new Error("Batas kuota posting harian tercapai (maks 25 post/hari).");
    }

    const { text, posts, subsequentPosts, topicTag, reply2Text, reply2Media, imageUrls, media, onProgress } = params;
    const replyMode = params.replyMode === "root" ? "root" : "chain";
    const cleanTopic = topicTag ? topicTag.replace(/#/g, "").trim() : "";

    interface PostToPublish {
      text: string;
      media: Array<{ url: string; type: "IMAGE" | "VIDEO" }>;
      label: string;
    }

    const itemsToPublish: PostToPublish[] = [];

    if (Array.isArray(posts) && posts.length > 0) {
      posts.forEach((p, idx) => {
        const itemText = (typeof p === "string" ? p : p.text || "").trim();
        if (!itemText) return;
        const itemMedia: Array<{ url: string; type: "IMAGE" | "VIDEO" }> = [];
        if (typeof p !== "string" && Array.isArray(p.media) && p.media.length > 0) {
          itemMedia.push(...p.media);
        } else if (idx === 0) {
          if (Array.isArray(media) && media.length > 0) {
            itemMedia.push(...media);
          } else if (Array.isArray(imageUrls) && imageUrls.length > 0) {
            itemMedia.push(...imageUrls.map((url) => ({ url, type: "IMAGE" as const })));
          }
        }
        itemsToPublish.push({
          text: itemText,
          media: itemMedia,
          label: idx === 0 ? "Post Utama (#1)" : `Reply ke-${idx + 1}`,
        });
      });
    } else if (text?.trim()) {
      const firstMedia: Array<{ url: string; type: "IMAGE" | "VIDEO" }> = [];
      if (Array.isArray(media) && media.length > 0) {
        firstMedia.push(...media);
      } else if (Array.isArray(imageUrls) && imageUrls.length > 0) {
        firstMedia.push(...imageUrls.map((url) => ({ url, type: "IMAGE" as const })));
      }
      itemsToPublish.push({
        text: text.trim(),
        media: firstMedia,
        label: "Post Utama (#1)",
      });

      if (Array.isArray(subsequentPosts)) {
        subsequentPosts.forEach((st, idx) => {
          const t = (st || "").trim();
          if (t) {
            itemsToPublish.push({
              text: t,
              media: [],
              label: `Reply ke-${idx + 2}`,
            });
          }
        });
      }
    }

    // Jika ada reply2Text yang disediakan secara terpisah dan belum masuk
    if (reply2Text?.trim()) {
      itemsToPublish.push({
        text: reply2Text.trim(),
        media: Array.isArray(reply2Media) ? reply2Media : [],
        label: `Reply Penutup (#${itemsToPublish.length + 1})`,
      });
    }

    if (itemsToPublish.length === 0) {
      throw new Error("Tidak ada teks postingan yang disediakan untuk dipublikasikan.");
    }

    // 1. Publikasikan Post #1 (Root Post)
    const firstPost = itemsToPublish[0];
    const { postId: rootPostId, mediaType: rootMediaType } = await this.createAndPublishPostContainer({
      text: firstPost.text,
      media: firstPost.media,
      topicTag: cleanTopic,
      token,
      label: firstPost.label,
      onProgress,
    });

    let lastPostIdInChain = rootPostId;
    let publishedCount = 1;
    const getReplyParentId = () => (replyMode === "root" ? rootPostId : lastPostIdInChain);

    // 2. Publikasikan post-post berikutnya (balasan berantai atau langsung ke post 1)
    for (let i = 1; i < itemsToPublish.length; i++) {
      const item = itemsToPublish[i];
      onProgress?.(`Mempersiapkan ${item.label} (${i + 1} dari ${itemsToPublish.length})...`);
      await new Promise((r) => setTimeout(r, 1500));

      const parentId = getReplyParentId();
      const { postId: replyPostId } = await this.createAndPublishPostContainer({
        text: item.text,
        media: item.media,
        replyToId: parentId,
        token,
        label: item.label,
        onProgress,
      });

      lastPostIdInChain = replyPostId;
      publishedCount++;
    }

    // Step 5: Dapatkan permalink resmi postingan
    onProgress?.("Menyinkronkan permalink postingan...");
    let permalink = `https://threads.net/@${account.username}/post/${rootPostId}`;
    try {
      quotaState.dailyCallsUsed += 1;
      const permalinkRes = await fetch(
        `${GRAPH_BASE_URL}/${rootPostId}?fields=id,permalink&access_token=${encodeURIComponent(token)}`
      );
      if (permalinkRes.ok) {
        const pJson = await permalinkRes.json();
        if (pJson.permalink) permalink = pJson.permalink;
      }
    } catch {}

    // Simpan postingan baru ke riwayat lokal
    const newPost: ThreadsPostData = {
      id: rootPostId,
      text: firstPost.text,
      timestamp: new Date().toISOString(),
      permalink,
      media_type: rootMediaType,
      insights: {
        views: 1,
        likes: 0,
        replies: publishedCount - 1,
        reposts: 0,
        quotes: 0,
        shares: 0,
      },
    };

    const currentPosts = await storage.getThreadsPosts();
    await storage.saveThreadsPosts([newPost, ...(currentPosts || [])]);

    onProgress?.(`Selesai! Seluruh utas (${publishedCount} post) berhasil dipublikasikan.`);

    return {
      success: true,
      postId: rootPostId,
      permalink,
      publishedCount,
    };
  },

  /**
   * Tautkan post yang ada ke ID Varian AutoThreads
   */
  async linkPostToVariant(postId: string, variantId: string): Promise<boolean> {
    const posts = await storage.getThreadsPosts();
    const post = posts.find((p) => p.id === postId);
    if (post) {
      post.linkedVariantId = variantId;
      await storage.saveThreadsPosts(posts);
      return true;
    }
    return false;
  },

  /**
   * Bangun URL OAuth Resmi Meta Threads
   */
  getOAuthUrl(redirectUri: string, clientId?: string): string {
    const appId = clientId || import.meta.env.VITE_THREADS_APP_ID || "";
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      scope: "threads_basic,threads_content_publish,threads_manage_insights,threads_manage_replies",
      response_type: "code",
    });
    return `https://threads.net/oauth/authorize?${params.toString()}`;
  },
};
