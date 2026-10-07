/**
 * API Cron Publisher & Worker Eksekutor Auto-Scheduler
 * Dapat dipanggil oleh Cron server Express, Vercel Cron, atau scheduler eksternal
 */

import type { Request, Response } from "express";

const GRAPH_BASE_URL = "https://graph.threads.net/v1.0";

export default async function publishCronHandler(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;

    // Jika CRON_SECRET dikonfigurasi, amankan endpoint
    if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized: Invalid CRON_SECRET token." });
    }

    // Ambil item antrean yang dikirim dalam body atau cek database
    const payload = req.body || {};
    const queueItems = Array.isArray(payload.queue) ? payload.queue : [];
    const clientToken = payload.accessToken || (authHeader ? authHeader.replace(/^Bearer\s+/i, "") : "");

    const nowIso = new Date().toISOString();
    const nowMs = Date.now();

    // Saring item yang berstatus queued dan waktunya <= sekarang
    const dueItems = queueItems.filter(
      (item: any) =>
        item.status === "queued" &&
        new Date(item.scheduledTimeISO).getTime() <= nowMs
    );

    if (dueItems.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Tidak ada antrean utas yang jatuh tempo saat ini.",
        checkedAt: nowIso,
        executedCount: 0,
        results: [],
      });
    }

    const results: any[] = [];

    for (const item of dueItems) {
      const token = item.token || clientToken || process.env.THREADS_ACCESS_TOKEN;
      if (!token) {
        results.push({
          id: item.id,
          status: "failed",
          errorMessage: "Token Meta Threads tidak ditemukan untuk eksekusi jadwal ini.",
        });
        continue;
      }

      // Publikasi langsung ke Threads Graph API
      try {
        const variant = item.variant;
        const mainPost = variant?.posts?.[0]?.text || "";
        const topicTag = (variant?.topic_tag || "").replace(/#/g, "").trim();
        const reply2Text = variant?.reply_2?.text;

        if (!mainPost.trim()) {
          results.push({
            id: item.id,
            status: "failed",
            errorMessage: "Konten teks utas kosong.",
          });
          continue;
        }

        // 1. Buat Container Post Utama
        const containerParams = new URLSearchParams({
          media_type: "TEXT_POST",
          text: mainPost,
          access_token: token,
        });
        if (topicTag) {
          containerParams.append("topic_tag", topicTag);
        }

        const createRes = await fetch(`${GRAPH_BASE_URL}/me/threads`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: containerParams.toString(),
        });

        const createJson = await createRes.json();
        if (!createRes.ok || !createJson.id) {
          throw new Error(createJson.error?.message || "Gagal membuat media container di Threads.");
        }

        const creationId = createJson.id;

        // Tunggu sejenak agar media container siap di-publish
        await new Promise((r) => setTimeout(r, 2000));

        // 2. Publish Post Utama
        const publishParams = new URLSearchParams({
          creation_id: creationId,
          access_token: token,
        });

        const publishRes = await fetch(`${GRAPH_BASE_URL}/me/threads_publish`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: publishParams.toString(),
        });

        const publishJson = await publishRes.json();
        if (!publishRes.ok || !publishJson.id) {
          throw new Error(publishJson.error?.message || "Gagal mempublikasikan utas ke Threads.");
        }

        const rootPostId = publishJson.id;

        // Ambil permalink
        let permalink = "";
        try {
          const postDetailRes = await fetch(`${GRAPH_BASE_URL}/${rootPostId}?fields=permalink&access_token=${encodeURIComponent(token)}`);
          if (postDetailRes.ok) {
            const detailJson = await postDetailRes.json();
            permalink = detailJson.permalink || "";
          }
        } catch {}

        // 3. Jika ada Reply #2, buat & publish reply ke post utama
        if (reply2Text && reply2Text.trim()) {
          try {
            await new Promise((r) => setTimeout(r, 2000));
            const r2Params = new URLSearchParams({
              media_type: "TEXT_POST",
              text: reply2Text.trim(),
              reply_to_id: rootPostId,
              access_token: token,
            });

            const r2CreateRes = await fetch(`${GRAPH_BASE_URL}/me/threads`, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: r2Params.toString(),
            });
            const r2CreateJson = await r2CreateRes.json();

            if (r2CreateJson.id) {
              await new Promise((r) => setTimeout(r, 1500));
              const r2PubParams = new URLSearchParams({
                creation_id: r2CreateJson.id,
                access_token: token,
              });
              await fetch(`${GRAPH_BASE_URL}/me/threads_publish`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: r2PubParams.toString(),
              });
            }
          } catch (r2Err) {
            console.warn("Gagal memposting Reply #2 pada jadwal:", r2Err);
          }
        }

        results.push({
          id: item.id,
          status: "published",
          publishedAt: Date.now(),
          postId: rootPostId,
          permalink: permalink || `https://www.threads.net`,
        });
      } catch (err: any) {
        results.push({
          id: item.id,
          status: "failed",
          errorMessage: err.message || "Terjadi kesalahan saat mempublikasikan utas.",
          retryCount: (item.retryCount || 0) + 1,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Eksekusi worker selesai. Berhasil memproses ${results.length} item.`,
      executedAt: nowIso,
      results,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || "Internal server error saat mengeksekusi antrean jadwal.",
    });
  }
}
