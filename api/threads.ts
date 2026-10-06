import { Request, Response } from "express";

const GRAPH_BASE_URL = "https://graph.threads.net/v1.0";

/**
 * Server endpoint for Meta Threads API Proxy & Diagnostics
 * Support curl testing and proxying requests safely
 */
export default async function threadsHandler(req: Request, res: Response) {
  try {
    const action = req.query.action as string || "threads";
    const token = (req.query.access_token as string) || (req.headers.authorization?.replace(/^Bearer\s+/i, "")) || "";

    if (!token) {
      return res.status(400).json({
        error: {
          message: "Parameter 'access_token' wajib disertakan dalam query atau Authorization header.",
          type: "OAuthException",
          code: 190,
        },
      });
    }

    if (action === "me") {
      // Validasi token via /v1.0/me
      const targetUrl = `${GRAPH_BASE_URL}/me?fields=id,username,name,threads_profile_picture_url,threads_biography&access_token=${encodeURIComponent(token)}`;
      const response = await fetch(targetUrl);
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    // Default: GET /v1.0/me/threads
    const fields = (req.query.fields as string) || "id,media_product_type,media_type,media_url,permalink,owner,username,text,timestamp,shortcode,thumbnail_url,children,is_quote_post";
    const limit = (req.query.limit as string) || "10";

    const targetUrl = `${GRAPH_BASE_URL}/me/threads?fields=${encodeURIComponent(fields)}&limit=${encodeURIComponent(limit)}&access_token=${encodeURIComponent(token)}`;
    const response = await fetch(targetUrl);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (err: any) {
    return res.status(500).json({
      error: {
        message: err.message || "Internal server error connecting to Meta Threads API",
      },
    });
  }
}
