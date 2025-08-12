import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// CORS: sadece gerekirse açın; statik içerik aynı origin'den servis edildiği için şart değil
app.use(cors());

// Statik dosyalar (landing + app)
app.use(express.static("public", { extensions: ["html"] }));

// Trendyol base URL seçimi
function getBaseUrl() {
  const env = (process.env.TRENDYOL_ENV || "stage").toLowerCase();
  return env === "prod" || env === "production"
    ? "https://apigw.trendyol.com"
    : "https://stageapigw.trendyol.com";
}

// Basit health
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    env: process.env.TRENDYOL_ENV || "stage",
    time: new Date().toISOString(),
    hasSecret: !!process.env.API_SECRET
  });
});

// Orders proxy: /api/orders?status=Awaiting&size=20&page=0 ...
app.get("/api/orders", async (req, res) => {
  try {
    const sellerId = process.env.SELLER_ID;
    const apiKey = process.env.API_KEY;
    if (!sellerId || !apiKey) {
      return res.status(500).json({ ok: false, error: "SELLER_ID or API_KEY not set" });
    }

    // Build destination URL with original query string
    const base = getBaseUrl();
    const url = new URL(`${base}/integration/order/sellers/${sellerId}/orders`);
    for (const [k, v] of Object.entries(req.query)) url.searchParams.set(k, v);
    if (!url.searchParams.has("status")) url.searchParams.set("status", "Awaiting");

    const auth = Buffer.from(`${sellerId}:${apiKey}`).toString("base64");
    const r = await fetch(url.toString(), {
      headers: {
        "Accept": "application/json",
        "User-Agent": (process.env.TY_USER_AGENT || "LondApp/1.0 (contact: support@lond.example)"),
        "Authorization": `Basic ${auth}`
      }
    });

    const text = await r.text();
    // Try to parse JSON if possible, else relay text
    try {
      const j = JSON.parse(text);
      res.status(r.status).json(j);
    } catch {
      res.status(r.status).send(text);
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message || String(e) });
  }
});

// Fallback: send index.html for landing
app.get("*", (req, res) => {
  res.sendFile(process.cwd() + "/public/index.html");
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
