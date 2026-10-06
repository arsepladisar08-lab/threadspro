import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import aiHandler from "./api/ai";
import bankExportHandler from "./api/bank/export";
import cronDailyHandler from "./api/cron/daily";
import threadsHandler from "./api/threads";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Server API Routes
app.all("/api/ai", (req, res) => aiHandler(req, res));
app.all("/api/threads", (req, res) => threadsHandler(req, res));
app.all("/api/bank/export", (req, res) => bankExportHandler(req, res));
app.all("/api/cron/daily", (req, res) => cronDailyHandler(req, res));

// Mount Vite middleware in development or serve dist in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true",
        watch: process.env.DISABLE_HMR === "true" ? null : {},
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AutoThreads server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
