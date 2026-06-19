// Vercel serverless function (zero-config): server-side stock/FX quote via Yahoo Finance.
// Avoids the CORS / rate-limit issues of public browser proxies. Runs only on Vercel.
module.exports = async (req, res) => {
  const symbol = req.query && req.query.symbol ? String(req.query.symbol).trim() : "";
  if (!symbol) {
    res.status(400).json({ error: "symbol required" });
    return;
  }
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; NumBrrr/1.0)" } });
    const j = await r.json();
    const meta = j && j.chart && j.chart.result && j.chart.result[0] && j.chart.result[0].meta;
    // edge-cache the price for an hour so repeat visitors don't refetch
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json({ price: meta ? meta.regularMarketPrice : null, currency: meta ? meta.currency : null });
  } catch (e) {
    res.status(502).json({ error: "fetch failed" });
  }
};
