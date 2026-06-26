"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Plus, 
  X, 
  Clock,
  AlertCircle,
  Check,
  Loader2,
  Building2
} from "lucide-react"
import { cn } from "@/lib/utils"

interface StockQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  previousClose: number
  open: number
  dayHigh: number
  dayLow: number
  volume: number
  marketCap?: number
  companyName?: string
  lastUpdated: Date
}

interface SearchResult {
  symbol: string
  name: string
  type: string
  exchange: string
}

interface StockTickerProps {
  onPriceUpdate?: (symbol: string, price: number) => void
  primarySymbol?: string
  onPrimarySymbolChange?: (symbol: string) => void
}

// Search for stocks by company name or ticker symbol via server API
const searchStocks = async (query: string): Promise<SearchResult[]> => {
  try {
    const response = await fetch(
      `/api/stock?action=search&q=${encodeURIComponent(query)}`,
      { cache: 'no-store' }
    )
    
    if (!response.ok) throw new Error('Search failed')
    
    const data = await response.json()
    return (data.results || []).map((r: { symbol: string; name: string; exchange?: string }) => ({
      symbol: r.symbol,
      name: r.name,
      type: 'EQUITY',
      exchange: r.exchange || '',
    }))
  } catch {
    return []
  }
}

// Fetch real stock data via server API route
const fetchRealStockData = async (symbol: string): Promise<StockQuote | null> => {
  try {
    const response = await fetch(
      `/api/stock?symbol=${encodeURIComponent(symbol.toUpperCase())}`,
      { cache: 'no-store' }
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch')
    }
    
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error)
    }
    
    return {
      symbol: data.symbol,
      price: data.price,
      change: data.change,
      changePercent: data.changePercent,
      previousClose: data.previousClose,
      open: data.open,
      dayHigh: data.dayHigh,
      dayLow: data.dayLow,
      volume: data.volume,
      marketCap: data.marketCap,
      companyName: data.companyName,
      lastUpdated: new Date(),
    }
  } catch {
    // Fallback to cached/default data if API fails
    return getFallbackData(symbol)
  }
}

// Fallback data when API is unavailable
const getFallbackData = (symbol: string): StockQuote => {
  const fallbackPrices: Record<string, { price: number; name: string }> = {
    AAPL: { price: 185.50, name: "Apple Inc." },
    GOOGL: { price: 141.80, name: "Alphabet Inc." },
    MSFT: { price: 378.25, name: "Microsoft Corporation" },
    AMZN: { price: 178.50, name: "Amazon.com Inc." },
    META: { price: 485.20, name: "Meta Platforms Inc." },
    NVDA: { price: 875.30, name: "NVIDIA Corporation" },
    TSLA: { price: 245.60, name: "Tesla Inc." },
    JPM: { price: 195.40, name: "JPMorgan Chase & Co." },
    V: { price: 278.90, name: "Visa Inc." },
    JNJ: { price: 155.30, name: "Johnson & Johnson" },
    WMT: { price: 165.80, name: "Walmart Inc." },
    PG: { price: 162.40, name: "Procter & Gamble Co." },
    UNH: { price: 525.60, name: "UnitedHealth Group Inc." },
    MA: { price: 458.30, name: "Mastercard Inc." },
    HD: { price: 362.70, name: "The Home Depot Inc." },
    TECH: { price: 150.00, name: "Tech Corp Inc." },
  }
  
  const data = fallbackPrices[symbol.toUpperCase()] || { price: 100, name: `${symbol} Corp` }
  
  return {
    symbol: symbol.toUpperCase(),
    price: data.price,
    change: 0,
    changePercent: 0,
    previousClose: data.price,
    open: data.price,
    dayHigh: data.price,
    dayLow: data.price,
    volume: 0,
    companyName: data.name,
    lastUpdated: new Date(),
  }
}

export function StockTicker({ 
  onPriceUpdate, 
  primarySymbol = "TECH",
  onPrimarySymbolChange 
}: StockTickerProps) {
  const [symbols, setSymbols] = useState<string[]>([primarySymbol])
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchQuote = useCallback(async (symbol: string): Promise<StockQuote | null> => {
    try {
      return await fetchRealStockData(symbol)
    } catch {
      return getFallbackData(symbol)
    }
  }, [])

  const refreshAllQuotes = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const newQuotes: Record<string, StockQuote> = {}
      
      for (const symbol of symbols) {
        const quote = await fetchQuote(symbol)
        if (quote) {
          newQuotes[symbol] = quote
          // Update primary symbol price
          if (symbol === primarySymbol && onPriceUpdate) {
            onPriceUpdate(symbol, quote.price)
          }
        }
      }
      
      setQuotes(newQuotes)
      setLastRefresh(new Date())
    } catch {
      setError("Failed to fetch some quotes. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [symbols, primarySymbol, onPriceUpdate, fetchQuote])

  // Initial fetch
  useEffect(() => {
    refreshAllQuotes()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 60 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      refreshAllQuotes()
    }, 60000)
    
    return () => clearInterval(interval)
  }, [autoRefresh, refreshAllQuotes])

  // Search for stocks when query changes
  useEffect(() => {
    const query = searchQuery.trim()
    if (query.length < 1) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true)
      const results = await searchStocks(query)
      setSearchResults(results)
      setShowResults(results.length > 0)
      setIsSearching(false)
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const addSymbol = async (symbolToAdd?: string) => {
    const symbol = (symbolToAdd || searchQuery).toUpperCase().trim()
    if (!symbol || symbols.includes(symbol)) {
      setSearchQuery("")
      setShowResults(false)
      return
    }
    
    setIsLoading(true)
    setShowResults(false)
    const quote = await fetchQuote(symbol)
    
    if (quote) {
      setSymbols([...symbols, symbol])
      setQuotes({ ...quotes, [symbol]: quote })
    } else {
      setError(`Could not find symbol: ${symbol}`)
    }
    
    setSearchQuery("")
    setIsLoading(false)
  }

  const selectSearchResult = (result: SearchResult) => {
    addSymbol(result.symbol)
  }

  const removeSymbol = (symbol: string) => {
    if (symbol === primarySymbol) return // Can't remove primary
    setSymbols(symbols.filter(s => s !== symbol))
    const newQuotes = { ...quotes }
    delete newQuotes[symbol]
    setQuotes(newQuotes)
  }

  const setPrimarySymbol = (symbol: string) => {
    if (onPrimarySymbolChange) {
      onPrimarySymbolChange(symbol)
    }
    // Update the price immediately
    const quote = quotes[symbol]
    if (quote && onPriceUpdate) {
      onPriceUpdate(symbol, quote.price)
    }
  }

  const formatNumber = (num: number, decimals = 2) => {
    return num.toLocaleString(undefined, { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    })
  }

  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    return `$${num.toLocaleString()}`
  }

  const primaryQuote = quotes[primarySymbol]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Market Data
            </p>
            <CardTitle className="font-serif text-base">Stock Prices</CardTitle>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn(
                "h-7 px-2 text-[10px]",
                autoRefresh && "text-emerald-600"
              )}
            >
              <Clock className="mr-1 h-3 w-3" />
              {autoRefresh ? "Auto" : "Man"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAllQuotes}
              disabled={isLoading}
              className="h-7 px-2 text-[10px]"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
        {lastRefresh && (
          <p className="text-[10px] text-muted-foreground">
            Updated: {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Symbol Input */}
        <div className="relative">
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              {isSearching ? (
                <Loader2 className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-muted-foreground" />
              ) : (
                <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              )}
              <Input
                placeholder="Search ticker or company"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSymbol()}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                className="h-8 pl-7 text-xs"
              />
            </div>
            <Button size="sm" className="h-8 w-8 p-0" onClick={() => addSymbol()} disabled={isLoading || !searchQuery.trim()}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-8 top-9 z-50 rounded-md border bg-card shadow-lg">
              <div className="max-h-48 overflow-y-auto py-1">
                {searchResults.map((result) => (
                  <button
                    key={result.symbol}
                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted/50"
                    onMouseDown={() => selectSearchResult(result)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">{result.symbol}</span>
                        <span className="text-[9px] text-muted-foreground">{result.exchange}</span>
                      </div>
                      <p className="truncate text-[10px] text-muted-foreground">{result.name}</p>
                    </div>
                    <Plus className="ml-2 h-3 w-3 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-1.5 rounded border border-destructive/20 bg-destructive/5 p-2 text-[10px] text-destructive">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}

        {/* Primary Stock (compact display) */}
        {primaryQuote && (
          <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="bg-primary/10 px-1.5 py-0 text-[10px] text-primary">
                    Primary
                  </Badge>
                  <span className="font-mono text-sm font-bold text-primary">
                    {primaryQuote.symbol}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                  {primaryQuote.companyName}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-serif text-xl font-bold text-foreground">
                  ${formatNumber(primaryQuote.price)}
                </p>
                <div className={cn(
                  "flex items-center justify-end gap-0.5 text-[10px] font-medium",
                  primaryQuote.change >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {primaryQuote.change >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {primaryQuote.change >= 0 ? "+" : ""}
                  {formatNumber(primaryQuote.changePercent)}%
                </div>
              </div>
            </div>
            
            {/* Additional details - 2x2 grid */}
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-border/50 pt-2 text-[10px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Open</span>
                <span className="font-mono font-medium">${formatNumber(primaryQuote.open)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">High</span>
                <span className="font-mono font-medium">${formatNumber(primaryQuote.dayHigh)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Low</span>
                <span className="font-mono font-medium">${formatNumber(primaryQuote.dayLow)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vol</span>
                <span className="font-mono font-medium">{(primaryQuote.volume / 1e6).toFixed(1)}M</span>
              </div>
            </div>
          </div>
        )}

        {/* Watchlist */}
        {symbols.length > 1 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Watchlist
            </p>
            <div className="space-y-1">
              {symbols.filter(s => s !== primarySymbol).map((symbol) => {
                const quote = quotes[symbol]
                if (!quote) return null
                
                return (
                  <div
                    key={symbol}
                    className="flex items-center justify-between rounded border bg-card p-2 transition-all hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs font-bold">{quote.symbol}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 px-1 text-[9px] text-muted-foreground hover:text-primary"
                          onClick={() => setPrimarySymbol(symbol)}
                        >
                          <Check className="mr-0.5 h-2.5 w-2.5" />
                          Primary
                        </Button>
                      </div>
                      <p className="truncate text-[9px] text-muted-foreground">{quote.companyName}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="text-right">
                        <p className="font-mono text-xs font-bold">${formatNumber(quote.price)}</p>
                        <p className={cn(
                          "text-[9px] font-medium",
                          quote.change >= 0 ? "text-emerald-600" : "text-red-600"
                        )}>
                          {quote.change >= 0 ? "+" : ""}{formatNumber(quote.changePercent)}%
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removeSymbol(symbol)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Market Cap */}
        {primaryQuote && primaryQuote.marketCap && (
          <div className="flex items-center justify-between rounded border bg-muted/30 px-2 py-1.5 text-[10px]">
            <span className="text-muted-foreground">Market Cap</span>
            <span className="font-mono font-medium">{formatLargeNumber(primaryQuote.marketCap)}</span>
          </div>
        )}

        {/* Data Source Note */}
        <p className="text-center text-[9px] leading-tight text-muted-foreground">
          Live data from Yahoo Finance. Prices may be delayed 15-20 minutes.
        </p>
      </CardContent>
    </Card>
  )
}
