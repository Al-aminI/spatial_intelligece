import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Proxy for OpenSky Network (Planes)
  app.get("/api/planes", async (req, res) => {
    try {
      // OpenSky Network API - Public data for a bounding box around Austin
      // Austin roughly: 30.2672° N, 97.7431° W
      // Bounding box: lamin, lomin, lamax, lomax
      const response = await fetch("https://opensky-network.org/api/states/all?lamin=29.5&lomin=-98.5&lamax=31.0&lomax=-97.0");
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch plane data" });
    }
  });

  // Proxy for Austin Traffic Cameras
  app.get("/api/traffic-cams", async (req, res) => {
    try {
      const response = await fetch("https://data.austintexas.gov/resource/isv6-499d.json?$limit=20");
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch traffic cameras" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AEGIS Intelligence Server running on http://localhost:${PORT}`);
  });
}

startServer();
