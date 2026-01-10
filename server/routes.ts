import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fetch from "node-fetch";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Proxy for RadReel API to avoid CORS and potential IP blocking issues
  app.get("/api/proxy/play/:id", async (req, res) => {
    const { id } = req.params;
    const { seq, lang } = req.query;
    const targetUrl = `https://dramabos.asia/api/radreel/api/v1/play/${id}?lang=${lang || 'id'}&seq=${seq || 0}`;
    
    try {
      console.log(`[Proxy] Fetching: ${targetUrl}`);
      const response = await fetch(targetUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('[Proxy Error]', error);
      res.status(500).json({ error: "Failed to fetch from upstream" });
    }
  });

  return httpServer;
}
