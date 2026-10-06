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
      console.log(`[Threads API] Fetching page ${page}... URL:`, url);
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
   * Menerbitkan postingan asli ke Threads menggunakan API Resmi
   */
  async publishThread(params: {
    text: string;
    topicTag?: string;
    reply2Text?: string;
  }): Promise<{ success: boolean; postId: string; permalink: string }> {
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

    // Step 1: Buat Media Container untuk Post Utama
    const containerBody = new URLSearchParams();
    containerBody.append("media_type", "TEXT");
    containerBody.append("text", params.text);
    if (params.topicTag) {
      containerBody.append("topic_tag", params.topicTag.replace(/#/g, "").trim());
    }
    containerBody.append("access_token", token);

    quotaState.dailyCallsUsed += 1;
    const createRes = await fetch(`${GRAPH_BASE_URL}/me/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: containerBody,
    });

    if (!createRes.ok) {
      const errJson = await createRes.json().catch(() => ({}));
      throw new Error(
        errJson?.error?.message || `Gagal membuat kontainer Threads (HTTP ${createRes.status})`
      );
    }

    const createData = await createRes.json();
    const creationId = createData.id;

    // Step 2: Publikasikan Media Container Utama
    const publishBody = new URLSearchParams();
    publishBody.append("creation_id", creationId);
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
        errJson?.error?.message || `Gagal menerbitkan kontainer Threads (HTTP ${publishRes.status})`
      );
    }

    const publishData = await publishRes.json();
    const newPostId = publishData.id;

    // Step 3: Jika ada reply kedua, buat & terbitkan secara berantai
    if (params.reply2Text?.trim()) {
      try {
        const replyContainerBody = new URLSearchParams();
        replyContainerBody.append("media_type", "TEXT");
        replyContainerBody.append("reply_to_id", newPostId);
        replyContainerBody.append("text", params.reply2Text.trim());
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
          const replyPublishBody = new URLSearchParams();
          replyPublishBody.append("creation_id", replyData.id);
          replyPublishBody.append("access_token", token);

          await fetch(`${GRAPH_BASE_URL}/me/threads_publish`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: replyPublishBody,
          });
        }
      } catch (errReply) {
        console.warn("Gagal memposting reply ke-2 secara otomatis:", errReply);
      }
    }

    // Step 4: Dapatkan permalink resmi postingan
    let permalink = `https://threads.net/@${account.username}/post/${newPostId}`;
    try {
      quotaState.dailyCallsUsed += 1;
      const permalinkRes = await fetch(
        `${GRAPH_BASE_URL}/${newPostId}?fields=id,permalink&access_token=${encodeURIComponent(token)}`
      );
      if (permalinkRes.ok) {
        const pJson = await permalinkRes.json();
        if (pJson.permalink) permalink = pJson.permalink;
      }
    } catch {}

    // Simpan postingan baru ke riwayat lokal
    const newPost: ThreadsPostData = {
      id: newPostId,
      text: params.text,
      timestamp: new Date().toISOString(),
      permalink,
      media_type: "TEXT_POST",
      insights: {
        views: 1,
        likes: 0,
        replies: params.reply2Text ? 1 : 0,
        reposts: 0,
        quotes: 0,
        shares: 0,
      },
    };

    const currentPosts = await storage.getThreadsPosts();
    await storage.saveThreadsPosts([newPost, ...(currentPosts || [])]);

    return {
      success: true,
      postId: newPostId,
      permalink,
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
