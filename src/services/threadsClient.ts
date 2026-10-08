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
    const pollInterval = 1500; // interval 1.5 detik
    let attempt = 1;

    while (Date.now() - startTime < maxWaitMs) {
      quotaState.dailyCallsUsed += 1;
      const statusUrl = `${GRAPH_BASE_URL}/${containerId}?fields=status,error_message&access_token=${encodeURIComponent(token)}`;

      let res: Response;
      try {
        res = await fetch(statusUrl);
      } catch (err: any) {
        console.warn(`[Threads API] Network error polling container ${containerId}:`, err);
        await new Promise((r) => setTimeout(r, pollInterval));
        continue;
      }

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
      `Timeout menunggu pemrosesan media Meta Threads (30 detik). Container ID: ${containerId}. Silakan coba beberapa saat lagi.`
    );
  },

  /**
   * Menerbitkan postingan asli ke Threads menggunakan API Resmi
   * Mendukung Teks Tunggal, Single Image, maupun Multi-Image Carousel Album
   */
  async publishThread(params: {
    text?: string;
    posts?: Array<{ order?: number; text: string; media_suggestion?: string } | string>;
    subsequentPosts?: string[];
    topicTag?: string;
    reply2Text?: string;
    imageUrls?: string[];
    isCarousel?: boolean;
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

    const { text, posts, subsequentPosts, topicTag, reply2Text, imageUrls, isCarousel, onProgress } = params;
    
    // Kumpulkan seluruh daftar postingan (Post #1 s/d Post #N)
    let allPostTexts: string[] = [];
    if (Array.isArray(posts) && posts.length > 0) {
      allPostTexts = posts
        .map((p) => (typeof p === "string" ? p : p.text || ""))
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    } else if (text?.trim()) {
      allPostTexts = [text.trim()];
      if (Array.isArray(subsequentPosts)) {
        allPostTexts.push(
          ...subsequentPosts.map((t) => (t || "").trim()).filter((t) => t.length > 0)
        );
      }
    }

    if (allPostTexts.length === 0) {
      throw new Error("Tidak ada teks konten utas yang disediakan untuk dipublikasikan.");
    }

    const mainPostText = allPostTexts[0];
    const subsequentTexts = allPostTexts.slice(1);
    const cleanTopic = topicTag ? topicTag.replace(/#/g, "").trim() : "";
    const hasImages = Array.isArray(imageUrls) && imageUrls.length > 0;
    const isMultiImageCarousel = hasImages && (imageUrls.length > 1 || isCarousel === true);

    let mainCreationId: string = "";
    let finalMediaType: "TEXT_POST" | "IMAGE" | "CAROUSEL_ALBUM" = "TEXT_POST";

    if (isMultiImageCarousel && imageUrls) {
      // ==========================================
      // KASUS 1: CAROUSEL ALBUM (2-10 SLIDE GAMBAR)
      // ==========================================
      finalMediaType = "CAROUSEL_ALBUM";
      const totalSlides = imageUrls.length;
      const childContainerIds: string[] = [];

      onProgress?.(`Membuat media container item carousel (0/${totalSlides})...`);

      // 1.a Buat Container untuk Setiap Slide Item
      for (let i = 0; i < totalSlides; i++) {
        const slideUrl = imageUrls[i];
        onProgress?.(`Membuat slide item #${i + 1} dari ${totalSlides}...`);

        const itemBody = new URLSearchParams();
        itemBody.append("media_type", "IMAGE");
        itemBody.append("is_carousel_item", "true");
        itemBody.append("image_url", slideUrl);
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
            errJson?.error?.message || `Gagal membuat container slide #${i + 1} (HTTP ${itemRes.status})`
          );
        }

        const itemData = await itemRes.json();
        childContainerIds.push(itemData.id);
      }

      // 1.b Tunggu Kesiapan Status Semua Slide Item (Polling FINISHED)
      for (let i = 0; i < childContainerIds.length; i++) {
        const cId = childContainerIds[i];
        onProgress?.(`Memvalidasi status slide #${i + 1} di Meta Threads...`);
        await this.waitForContainerReady(cId, token, 30000, onProgress);
      }

      // 1.c Buat Container Induk CAROUSEL
      onProgress?.(`Merangkai album carousel (${childContainerIds.length} slide)...`);
      const carouselBody = new URLSearchParams();
      carouselBody.append("media_type", "CAROUSEL");
      carouselBody.append("children", childContainerIds.join(","));
      carouselBody.append("text", mainPostText);
      if (cleanTopic) {
        carouselBody.append("topic_tag", cleanTopic);
      }
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
          errJson?.error?.message || `Gagal membuat album carousel Threads (HTTP ${carouselRes.status})`
        );
      }

      const carouselData = await carouselRes.json();
      mainCreationId = carouselData.id;

      // 1.d Tunggu Kesiapan Album Carousel (Polling FINISHED)
      onProgress?.("Memverifikasi kesiapan album carousel Meta Threads...");
      await this.waitForContainerReady(mainCreationId, token, 30000, onProgress);

    } else if (hasImages && imageUrls && imageUrls.length === 1) {
      // ==========================================
      // KASUS 2: SINGLE IMAGE POST
      // ==========================================
      finalMediaType = "IMAGE";
      onProgress?.("Membuat container gambar tunggal di Threads...");

      const imgBody = new URLSearchParams();
      imgBody.append("media_type", "IMAGE");
      imgBody.append("image_url", imageUrls[0]);
      imgBody.append("text", mainPostText);
      if (cleanTopic) {
        imgBody.append("topic_tag", cleanTopic);
      }
      imgBody.append("access_token", token);

      quotaState.dailyCallsUsed += 1;
      const imgRes = await fetch(`${GRAPH_BASE_URL}/me/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: imgBody,
      });

      if (!imgRes.ok) {
        const errJson = await imgRes.json().catch(() => ({}));
        throw new Error(
          errJson?.error?.message || `Gagal membuat container gambar Threads (HTTP ${imgRes.status})`
        );
      }

      const imgData = await imgRes.json();
      mainCreationId = imgData.id;

      // Tunggu status container gambar FINISHED
      onProgress?.("Menunggu pemrosesan gambar di Meta Threads (FINISHED)...");
      await this.waitForContainerReady(mainCreationId, token, 30000, onProgress);

    } else {
      // ==========================================
      // KASUS 3: TEXT-ONLY POST (DEFAULT)
      // ==========================================
      finalMediaType = "TEXT_POST";
      onProgress?.("Membuat container teks Post #1 Threads...");

      const textBody = new URLSearchParams();
      textBody.append("media_type", "TEXT");
      textBody.append("text", mainPostText);
      if (cleanTopic) {
        textBody.append("topic_tag", cleanTopic);
      }
      textBody.append("access_token", token);

      quotaState.dailyCallsUsed += 1;
      const createRes = await fetch(`${GRAPH_BASE_URL}/me/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: textBody,
      });

      if (!createRes.ok) {
        const errJson = await createRes.json().catch(() => ({}));
        throw new Error(
          errJson?.error?.message || `Gagal membuat kontainer Threads (HTTP ${createRes.status})`
        );
      }

      const createData = await createRes.json();
      mainCreationId = createData.id;
    }

    // Step 2: Publikasikan Media Container Utama (Post #1)
    onProgress?.("Menerbitkan Post #1 ke akun Threads Anda...");
    const publishBody = new URLSearchParams();
    publishBody.append("creation_id", mainCreationId);
    publishBody.append("access_token", token);

    quotaState.dailyCallsUsed += 1;
    quotaState.publishingUsed += 1;

    const publishRes = await fetch(`${GRAPH_BASE_URL}/me/threads_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: publishBody,
    });

    if (!publishRes.ok) {
      const errJson = await publishRes.json().catch(() => ({}));
      throw new Error(
        errJson?.error?.message || `Gagal menerbitkan Post #1 Threads (HTTP ${publishRes.status})`
      );
    }

    const publishData = await publishRes.json();
    const rootPostId = publishData.id;
    let lastPostIdInChain = rootPostId;
    let publishedCount = 1;

    // Step 3: Publikasikan Post #2 sampai Post #N secara BERANTAI UTUH
    const totalThreadCount = allPostTexts.length + (reply2Text?.trim() ? 1 : 0);
    for (let idx = 0; idx < subsequentTexts.length; idx++) {
      const currentText = subsequentTexts[idx];
      const postNumber = idx + 2;

      onProgress?.(`Menerbitkan post #${postNumber} dari ${totalThreadCount} secara berantai...`);

      // Berikan jeda 1.5 detik agar pemrosesan berantai Graph API stabil
      await new Promise((r) => setTimeout(r, 1500));

      const replyContainerBody = new URLSearchParams();
      replyContainerBody.append("media_type", "TEXT");
      replyContainerBody.append("reply_to_id", lastPostIdInChain);
      replyContainerBody.append("text", currentText);
      replyContainerBody.append("access_token", token);

      quotaState.dailyCallsUsed += 1;
      quotaState.publishingUsed += 1;

      const replyCreateRes = await fetch(`${GRAPH_BASE_URL}/me/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: replyContainerBody,
      });

      if (!replyCreateRes.ok) {
        const errJson = await replyCreateRes.json().catch(() => ({}));
        throw new Error(
          errJson?.error?.message || `Gagal membuat kontainer reply untuk Post #${postNumber} (HTTP ${replyCreateRes.status})`
        );
      }

      const replyCreateData = await replyCreateRes.json();
      await this.waitForContainerReady(replyCreateData.id, token, 30000, onProgress);

      const replyPublishBody = new URLSearchParams();
      replyPublishBody.append("creation_id", replyCreateData.id);
      replyPublishBody.append("access_token", token);

      const replyPubRes = await fetch(`${GRAPH_BASE_URL}/me/threads_publish`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: replyPublishBody,
      });

      if (!replyPubRes.ok) {
        const errJson = await replyPubRes.json().catch(() => ({}));
        throw new Error(
          errJson?.error?.message || `Gagal menerbitkan Post #${postNumber} (HTTP ${replyPubRes.status})`
        );
      }

      const replyPubData = await replyPubRes.json();
      lastPostIdInChain = replyPubData.id;
      publishedCount++;
    }

    // Step 4: Jika ada Reply Penutup (CTA), terbitkan di akhir rantai
    if (reply2Text?.trim()) {
      try {
        onProgress?.(`Menerbitkan reply penutup CTA (#${publishedCount + 1})...`);
        await new Promise((r) => setTimeout(r, 1500));

        const replyContainerBody = new URLSearchParams();
        replyContainerBody.append("media_type", "TEXT");
        replyContainerBody.append("reply_to_id", lastPostIdInChain);
        replyContainerBody.append("text", reply2Text.trim());
        replyContainerBody.append("access_token", token);

        quotaState.dailyCallsUsed += 1;
        quotaState.publishingUsed += 1;

        const replyRes = await fetch(`${GRAPH_BASE_URL}/me/threads`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: replyContainerBody,
        });

        if (replyRes.ok) {
          const replyData = await replyRes.json();
          await this.waitForContainerReady(replyData.id, token, 30000, onProgress);

          const replyPublishBody = new URLSearchParams();
          replyPublishBody.append("creation_id", replyData.id);
          replyPublishBody.append("access_token", token);

          await fetch(`${GRAPH_BASE_URL}/me/threads_publish`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: replyPublishBody,
          });
          publishedCount++;
        }
      } catch (errReply) {
        console.warn("Gagal memposting reply CTA secara otomatis:", errReply);
      }
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
      text: mainPostText,
      timestamp: new Date().toISOString(),
      permalink,
      media_type: finalMediaType,
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
