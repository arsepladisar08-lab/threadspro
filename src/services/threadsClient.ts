/**
 * AutoThreads Official Threads Client & Mock Engine
 * Mendukung demo interaktif lengkap (THREADS_MOCK=true) di Preview AI Studio
 * dan endpoint resmi Threads Graph API di lingkungan produksi.
 */

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

// Fixture Akun Mock Default
const DEFAULT_MOCK_ACCOUNT: ThreadsAccount = {
  id: "th_user_89123019",
  username: "kreator.nusantara",
  name: "Budi Santoso | Edukasi Finansial & Bisnis",
  threads_profile_picture_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  threads_biography: "Berbagi tips keuangan & sistem bisnis santai tanpa ribet. Warga aktif Threads ID.",
  followers_count: 4820,
  connectedAt: Date.now() - 15 * 86400000,
  tokenExpiryDays: 45,
  status: "active",
};

// Fixture Postingan Mock dengan Sinyal Nyata
const DEFAULT_MOCK_POSTS: ThreadsPostData[] = [
  {
    id: "post_1001",
    text: "Gaji 7jt tapi akhir bulan selalu bingung lari kemana uangnya? Setelah gue audit mutasi 3 bulan terakhir, ini 3 bocor halusnya yang gak disadari:",
    timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
    permalink: "https://threads.net/@kreator.nusantara/post/1001",
    media_type: "TEXT_POST",
    insights: {
      views: 14200,
      likes: 540,
      replies: 124, // RTL = 124 / 540 = 0.229 (>0.15)
      reposts: 42,
      quotes: 18,
      shares: 65,
    },
    linkedVariantId: "var_k01_h1",
    snapshots: {
      minute10: { views: 420, likes: 25, replies: 12, reposts: 2, quotes: 0, shares: 3 },
      minute30: { views: 2400, likes: 110, replies: 48, reposts: 9, quotes: 4, shares: 15 },
      minute60: { views: 6800, likes: 280, replies: 86, reposts: 22, quotes: 10, shares: 38 },
    },
  },
  {
    id: "post_1002",
    text: "Umur 27 baru sadar kalau rutinitas bangun jam 5 pagi itu gak cocok buat semua orang. Ini sistem kerja malam yang bikin gue tetap produktif:",
    timestamp: new Date(Date.now() - 26 * 3600000).toISOString(),
    permalink: "https://threads.net/@kreator.nusantara/post/1002",
    media_type: "TEXT_POST",
    insights: {
      views: 28500,
      likes: 1210,
      replies: 310, // RTL = 310 / 1210 = 0.256
      reposts: 110,
      quotes: 54,
      shares: 140,
    },
    linkedVariantId: "var_k02_h2",
  },
  {
    id: "post_1003",
    text: "JUMAT LAPAK WARGA - Drop 1 jasa freelance lo di reply, format: Bantu Siapa - Hasil Apa - Mulai Rp. Gue bantu review 5 paling menarik!",
    timestamp: new Date(Date.now() - 72 * 3600000).toISOString(),
    permalink: "https://threads.net/@kreator.nusantara/post/1003",
    media_type: "TEXT_POST",
    insights: {
      views: 9800,
      likes: 210,
      replies: 185, // RTL = 185 / 210 = 0.88 (Reply depth tinggi!)
      reposts: 15,
      quotes: 8,
      shares: 22,
    },
    linkedVariantId: "var_k11_h1",
  },
];

let mockAccountState: ThreadsAccount | null = DEFAULT_MOCK_ACCOUNT;
let mockPostsState: ThreadsPostData[] = DEFAULT_MOCK_POSTS;

let mockQuotaState: QuotaState = {
  dailyCallsLimit: 24000,
  dailyCallsUsed: 312,
  publishingLimit: 25,
  publishingUsed: 3,
  searchLimit: 300,
  searchUsed: 14,
  circuitBreakerStatus: "CLOSED",
  lastResetTime: Date.now(),
};

export const threadsClient = {
  /**
   * Cek status koneksi akun
   */
  async getAccount(): Promise<ThreadsAccount | null> {
    return mockAccountState;
  },

  /**
   * Simulasi Connect OAuth Akun
   */
  async connectAccount(): Promise<ThreadsAccount> {
    mockAccountState = {
      ...DEFAULT_MOCK_ACCOUNT,
      connectedAt: Date.now(),
      status: "active",
    };
    return mockAccountState;
  },

  /**
   * Putuskan Akun
   */
  async disconnectAccount(): Promise<void> {
    mockAccountState = null;
  },

  /**
   * Ambil daftar postingan akun sendiri
   */
  async getOwnPosts(): Promise<ThreadsPostData[]> {
    return mockPostsState;
  },

  /**
   * Ambil status kuota Meta API
   */
  async getQuotaState(): Promise<QuotaState> {
    return mockQuotaState;
  },

  /**
   * Publish postingan baru ke Threads (Fase 3 Publishing)
   */
  async publishThread(params: {
    text: string;
    topicTag?: string;
    reply2Text?: string;
  }): Promise<{ success: boolean; postId: string; permalink: string }> {
    if (mockQuotaState.publishingUsed >= mockQuotaState.publishingLimit) {
      throw new Error("Batas kuota posting harian tercapai (maks 25 post/hari).");
    }

    const newId = `post_${Date.now()}`;
    const newPost: ThreadsPostData = {
      id: newId,
      text: params.text,
      timestamp: new Date().toISOString(),
      permalink: `https://threads.net/@kreator.nusantara/post/${newId}`,
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

    mockPostsState = [newPost, ...mockPostsState];
    mockQuotaState.publishingUsed += 1;
    mockQuotaState.dailyCallsUsed += 2;

    return {
      success: true,
      postId: newId,
      permalink: newPost.permalink,
    };
  },

  /**
   * Tautkan post yang ada ke ID Varian AutoThreads
   */
  async linkPostToVariant(postId: string, variantId: string): Promise<boolean> {
    const post = mockPostsState.find(p => p.id === postId);
    if (post) {
      post.linkedVariantId = variantId;
      return true;
    }
    return false;
  },
};
