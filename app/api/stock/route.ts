import { NextResponse } from "next/server"

/**
 * Stock quote API route.
 *
 * Uses Yahoo Finance's public chart API as the primary data source.
 * NOTE: For production use, replace with a licensed provider such as:
 *   - Polygon.io (free tier available)
 *   - Alpha Vantage (free API key)
 *   - Twelve Data (free tier)
 *   - Financial Modeling Prep
 *
 * Set MARKET_DATA_PROVIDER=polygon|alphavantage in .env.local and provide
 * the corresponding API key (POLYGON_API_KEY / ALPHA_VANTAGE_API_KEY).
 */

const PROVIDER = process.env.MARKET_DATA_PROVIDER ?? "yahoo"
const POLYGON_KEY = process.env.POLYGON_API_KEY ?? ""
const AV_KEY = process.env.ALPHA_VANTAGE_API_KEY ?? ""

async function fetchYahoo(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?interval=1d&range=1d`
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 60 }, // cache for 60 s
  })
  if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status}`)
  const data = await res.json()
  const result = data.chart?.result?.[0]
  if (!result) throw new Error("No data from Yahoo Finance")
  const meta  = result.meta
  const quote = result.indicators?.quote?.[0]
  const price = meta.regularMarketPrice || meta.previousClose || 0
  const prev  = meta.previousClose || price
  return {
    symbol: symbol.toUpperCase(),
    price,
    change:        price - prev,
    changePercent: prev > 0 ? ((price - prev) / prev) * 100 : 0,
    previousClose: prev,
    open:     quote?.open?.[quote.open.length - 1]  ?? meta.regularMarketOpen       ?? price,
    dayHigh:  quote?.high ? Math.max(...quote.high.filter(Boolean)) : meta.regularMarketDayHigh ?? price,
    dayLow:   quote?.low  ? Math.min(...quote.low.filter(Boolean))  : meta.regularMarketDayLow  ?? price,
    volume:   meta.regularMarketVolume ?? (quote?.volume?.[quote.volume.length - 1] ?? 0),
    marketCap:   meta.marketCap   ?? undefined,
    companyName: meta.shortName   ?? meta.longName ?? symbol.toUpperCase(),
    source: "yahoo",
  }
}

async function fetchPolygon(symbol: string) {
  if (!POLYGON_KEY) throw new Error("POLYGON_API_KEY not configured")
  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol.toUpperCase()}/prev?adjusted=true&apiKey=${POLYGON_KEY}`
  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`Polygon returned ${res.status}`)
  const data = await res.json()
  const bar  = data.results?.[0]
  if (!bar)  throw new Error("No data from Polygon")
  const price = bar.c
  const prev  = bar.o
  return {
    symbol:        symbol.toUpperCase(),
    price,
    change:        price - prev,
    changePercent: prev > 0 ? ((price - prev) / prev) * 100 : 0,
    previousClose: prev,
    open:     bar.o,
    dayHigh:  bar.h,
    dayLow:   bar.l,
    volume:   bar.v,
    marketCap:   undefined,
    companyName: symbol.toUpperCase(),
    source: "polygon",
  }
}

async function fetchAlphaVantage(symbol: string) {
  if (!AV_KEY) throw new Error("ALPHA_VANTAGE_API_KEY not configured")
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol.toUpperCase()}&apikey=${AV_KEY}`
  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`Alpha Vantage returned ${res.status}`)
  const data = await res.json()
  const q    = data["Global Quote"]
  if (!q || !q["05. price"]) throw new Error("No data from Alpha Vantage")
  const price = parseFloat(q["05. price"])
  const prev  = parseFloat(q["08. previous close"])
  return {
    symbol:        symbol.toUpperCase(),
    price,
    change:        parseFloat(q["09. change"]),
    changePercent: parseFloat(q["10. change percent"]),
    previousClose: prev,
    open:     parseFloat(q["02. open"]),
    dayHigh:  parseFloat(q["03. high"]),
    dayLow:   parseFloat(q["04. low"]),
    volume:   parseInt(q["06. volume"]),
    marketCap:   undefined,
    companyName: symbol.toUpperCase(),
    source: "alphavantage",
  }
}

async function searchYahoo(query: string) {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=6&newsCount=0`
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error("Search failed")
  const data = await res.json()
  return (data.quotes ?? [])
    .filter((q: { quoteType?: string }) => q.quoteType === "EQUITY")
    .slice(0, 6)
    .map((q: { symbol: string; shortname?: string; longname?: string; exchange?: string }) => ({
      symbol:   q.symbol,
      name:     q.shortname ?? q.longname ?? q.symbol,
      exchange: q.exchange ?? "",
    }))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")
  const action = searchParams.get("action") ?? "quote"

  if (!symbol && action === "quote") {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 })
  }

  try {
    if (action === "search") {
      const results = await searchYahoo(searchParams.get("q") ?? "")
      return NextResponse.json({ results })
    }

    // Try configured provider first, fall back to Yahoo
    let quoteData
    try {
      if (PROVIDER === "polygon")      quoteData = await fetchPolygon(symbol!)
      else if (PROVIDER === "alphavantage") quoteData = await fetchAlphaVantage(symbol!)
      else                             quoteData = await fetchYahoo(symbol!)
    } catch {
      // Fall back to Yahoo if primary provider fails
      if (PROVIDER !== "yahoo") {
        quoteData = await fetchYahoo(symbol!)
      } else {
        throw new Error("Market data unavailable")
      }
    }

    return NextResponse.json(quoteData)
  } catch (error) {
    console.error("Stock API error:", error)
    return NextResponse.json({ error: "Failed to fetch stock data" }, { status: 500 })
  }
}
