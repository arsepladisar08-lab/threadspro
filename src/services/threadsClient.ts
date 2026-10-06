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
  media_type: "TEXT_POST" | "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
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

    // Simpan ke IndexedDB
    await storage.saveThreadsAccount(account);
    await storage.saveThreadsToken(cleanToken);

    // 2. Muat postingan terbaru secara otomatis
    try {
      await this.syncRealPosts(cleanToken);
    } catch (e) {
      console.warn("Sinkronisasi postingan awal dilewati:", e);
    }

    return account;
  },

  /**
   * Sinkronisasi postingan akun asli dari Meta Threads Graph API
   */
  async syncRealPosts(passedToken?: string): Promise<ThreadsPostData[]> {
    const token = passedToken || (await storage.getThreadsToken());
    if (!token) return [];

    quotaState.dailyCallsUsed += 1;

    const postsUrl = `${GRAPH_BASE_URL}/me/threads?fields=id,media_product_type,text,timestamp,permalink,media_type&limit=20&access_token=${encodeURIComponent(token)}`;
    const res = await fetch(postsUrl);
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.warn("Gagal mengambil daftar postingan Threads:", errJson);
      return (await storage.getThreadsPosts()) || [];
    }

    const json = await res.json();
    const rawList = Array.isArray(json.data) ? json.data : [];

    const posts: ThreadsPostData[] = [];

    // Ambil metrik untuk setiap postingan (hingga 10 post terbaru agar hemat kuota)
    for (const item of rawList.slice(0, 10)) {
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
        const insightUrl = `${GRAPH_BASE_URL}/${item.id}/insights?metric=views,likes,replies,reposts,quotes&access_token=${encodeURIComponent(token)}`;
        const insRes = await fetch(insightUrl);
        if (insRes.ok) {
          const insJson = await insRes.json();
          if (Array.isArray(insJson.data)) {
            for (const m of insJson.data) {
              const val = m.values?.[0]?.value || 0;
              if (m.name === "views") insights.views = val;
              if (m.name === "likes") insights.likes = val;
              if (m.name === "replies") insights.replies = val;
              if (m.name === "reposts") insights.reposts = val;
              if (m.name === "quotes") insights.quotes = val;
            }
          }
        }
      } catch (err) {
        console.warn(`Gagal memuat insights untuk post ${item.id}:`, err);
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

    await storage.saveThreadsPosts(posts);
    return posts;
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
  async getOwnPosts(): Promise<ThreadsPostData[]> {
    const list = await storage.getThreadsPosts();
    return list || [];
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
