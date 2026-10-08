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
    const payload = req.body || {};
    const clientToken = payload.accessToken || (authHeader ? authHeader.replace(/^Bearer\s+/i, "") : "");

    // Jika CRON_SECRET dikonfigurasi, periksa apakah pemanggil adalah sistem cron resmi
    // atau request manual yang menyertakan token autentikasi yang sah
    if (cronSecret) {
      const isCronSecretMatch = authHeader === `Bearer ${cronSecret}`;
      const isManualWithToken = Boolean(clientToken && clientToken !== cronSecret);
      if (!isCronSecretMatch && !isManualWithToken) {
        return res.status(401).json({ error: "Unauthorized: Invalid CRON_SECRET or missing authorization token." });
      }
    }
    // Saring item yang berstatus queued dan waktunya <= sekarang
    const queueItems = Array.isArray(payload.queue) ? payload.queue : [];
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

      // Publikasi langsung ke Threads Graph API secara berantai utuh (Post 1 sampai Post N + reply_2)
      try {
        const variant = item.variant;
        const postsList: string[] = Array.isArray(variant?.posts)
          ? variant.posts
              .map((p: any) => (typeof p === "string" ? p : p?.text || ""))
              .filter((t: string) => t.trim().length > 0)
          : [];
        const mainPost = postsList[0] || variant?.posts?.[0]?.text || "";
        const subsequentPosts = postsList.slice(1);
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

        // 1. Buat Container Post Utama (Post #1)
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
          throw new Error(createJson.error?.message || "Gagal membuat media container Post #1 di Threads.");
        }

        const creationId = createJson.id;

        // Tunggu sejenak agar media container siap di-publish
        await new Promise((r) => setTimeout(r, 2000));

        // 2. Publish Post Utama (Post #1)
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
          throw new Error(publishJson.error?.message || "Gagal mempublikasikan Post #1 ke Threads.");
        }

        const rootPostId = publishJson.id;
        let lastPostIdInChain = rootPostId;
        let publishedCount = 1;

        // Ambil permalink post utama
        let permalink = "";
        try {
          const postDetailRes = await fetch(`${GRAPH_BASE_URL}/${rootPostId}?fields=permalink&access_token=${encodeURIComponent(token)}`);
          if (postDetailRes.ok) {
            const detailJson = await postDetailRes.json();
            permalink = detailJson.permalink || "";
          }
        } catch {}

        // 3. Terbitkan Post #2 s/d Post #N secara berantai (menautkan reply_to_id)
        for (let idx = 0; idx < subsequentPosts.length; idx++) {
          const subText = subsequentPosts[idx];
          const postNum = idx + 2;

          await new Promise((r) => setTimeout(r, 1500));
          const subParams = new URLSearchParams({
            media_type: "TEXT_POST",
            text: subText.trim(),
            reply_to_id: lastPostIdInChain,
            access_token: token,
          });

          const subCreateRes = await fetch(`${GRAPH_BASE_URL}/me/threads`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: subParams.toString(),
          });
          const subCreateJson = await subCreateRes.json();
          if (subCreateJson.id) {
            await new Promise((r) => setTimeout(r, 2000));
            const subPubParams = new URLSearchParams({
              creation_id: subCreateJson.id,
              access_token: token,
            });
            const subPubRes = await fetch(`${GRAPH_BASE_URL}/me/threads_publish`, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: subPubParams.toString(),
            });
            const subPubJson = await subPubRes.json();
            if (subPubJson.id) {
              lastPostIdInChain = subPubJson.id;
              publishedCount++;
            }
          }
        }

        // 4. Jika ada Reply #2 (CTA/penutup), buat & publish berantai di akhir
        if (reply2Text && reply2Text.trim()) {
          try {
            await new Promise((r) => setTimeout(r, 1500));
            const r2Params = new URLSearchParams({
              media_type: "TEXT_POST",
              text: reply2Text.trim(),
              reply_to_id: lastPostIdInChain,
              access_token: token,
            });

            const r2CreateRes = await fetch(`${GRAPH_BASE_URL}/me/threads`, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: r2Params.toString(),
            });
            const r2CreateJson = await r2CreateRes.json();

            if (r2CreateJson.id) {
              await new Promise((r) => setTimeout(r, 2000));
              const r2PubParams = new URLSearchParams({
                creation_id: r2CreateJson.id,
                access_token: token,
              });
              await fetch(`${GRAPH_BASE_URL}/me/threads_publish`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: r2PubParams.toString(),
              });
              publishedCount++;
            }
          } catch (r2Err) {
            console.warn("Gagal memposting Reply penutup pada jadwal:", r2Err);
          }
        }

        results.push({
          id: item.id,
          status: "published",
          publishedAt: Date.now(),
          postId: rootPostId,
          publishedCount,
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
