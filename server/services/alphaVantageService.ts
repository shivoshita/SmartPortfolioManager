import type { StockData } from "@shared/schema";

export interface AlphaVantageQuote {
  "01. symbol": string;
  "02. open": string;
  "03. high": string;
  "04. low": string;
  "05. price": string;
  "06. volume": string;
  "07. latest trading day": string;
  "08. previous close": string;
  "09. change": string;
  "10. change percent": string;
}

export interface AlphaVantageOverview {
  Symbol: string;
  AssetType: string;
  Name: string;
  Description: string;
  CIK: string;
  Exchange: string;
  Currency: string;
  Country: string;
  Sector: string;
  Industry: string;
  Address: string;
  OfficialSite: string;
  FiscalYearEnd: string;
  LatestQuarter: string;
  MarketCapitalization: string;
  EBITDA: string;
  PERatio: string;
  PEGRatio: string;
  BookValue: string;
  DividendPerShare: string;
  DividendYield: string;
  EPS: string;
  RevenuePerShareTTM: string;
  ProfitMargin: string;
  OperatingMarginTTM: string;
  ReturnOnAssetsTTM: string;
  ReturnOnEquityTTM: string;
  RevenueTTM: string;
  GrossProfitTTM: string;
  DilutedEPSTTM: string;
  QuarterlyEarningsGrowthYOY: string;
  QuarterlyRevenueGrowthYOY: string;
  AnalystTargetPrice: string;
  TrailingPE: string;
  ForwardPE: string;
  PriceToSalesRatioTTM: string;
  PriceToBookRatio: string;
  EVToRevenue: string;
  EVToEBITDA: string;
  Beta: string;
  "52WeekHigh": string;
  "52WeekLow": string;
  "50DayMovingAverage": string;
  "200DayMovingAverage": string;
  SharesOutstanding: string;
  DividendDate: string;
  ExDividendDate: string;
}

interface RateLimiter {
  requests: Array<{ timestamp: number }>;
  maxRequests: number;
  timeWindow: number;
}

class AlphaVantageService {
  private baseUrl = 'https://www.alphavantage.co/query';
  private apiKey: string;
  private rateLimiter: RateLimiter;

  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Alpha Vantage API key not found. Service will operate in demo mode.');
    }
    
    // Rate limiter: 25 requests per day for free tier
    this.rateLimiter = {
      requests: [],
      maxRequests: 25,
      timeWindow: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    };
  }

  private cleanRateLimiter(): void {
    const now = Date.now();
    const cutoff = now - this.rateLimiter.timeWindow;
    this.rateLimiter.requests = this.rateLimiter.requests.filter(
      req => req.timestamp > cutoff
    );
  }

  private canMakeRequest(): boolean {
    this.cleanRateLimiter();
    return this.rateLimiter.requests.length < this.rateLimiter.maxRequests;
  }

  private recordRequest(): void {
    this.rateLimiter.requests.push({ timestamp: Date.now() });
  }

  private getRemainingRequests(): number {
    this.cleanRateLimiter();
    return Math.max(0, this.rateLimiter.maxRequests - this.rateLimiter.requests.length);
  }

  private async makeRequest(url: string): Promise<any> {
    if (!this.canMakeRequest()) {
      throw new Error(`Rate limit exceeded. ${this.getRemainingRequests()} requests remaining until reset.`);
    }

    // Log function and symbol without exposing API key
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const functionName = urlParams.get('function');
    const symbol = urlParams.get('symbol') || urlParams.get('keywords');
    console.log(`Making Alpha Vantage API request: function=${functionName} symbol=${symbol}`);
    this.recordRequest();
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check for API error responses
    if (data.Note) {
      throw new Error(`Alpha Vantage API rate limit: ${data.Note}`);
    }
    
    if (data.Information) {
      throw new Error(`Alpha Vantage API information: ${data.Information}`);
    }
    
    if (data['Error Message']) {
      throw new Error(`Alpha Vantage API error: ${data['Error Message']}`);
    }

    return data;
  }

  /**
   * Fetch real-time quote for a single stock symbol
   */
  async getQuote(symbol: string): Promise<StockData | null> {
    try {
      const url = `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`;
      const data = await this.makeRequest(url);
      
      const quote = data['Global Quote'] as AlphaVantageQuote;
      
      if (!quote || !quote['01. symbol']) {
        throw new Error(`No quote data found for symbol: ${symbol}`);
      }

      // Get company overview for name and market cap
      const overview = await this.getOverview(symbol);
      
      const currentPrice = parseFloat(quote['05. price']);
      const previousClose = parseFloat(quote['08. previous close']);
      const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
      
      return {
        symbol: quote['01. symbol'],
        name: overview?.Name || symbol,
        currentPrice,
        previousClose,
        changePercent,
        volume: parseInt(quote['06. volume']) || 0,
        marketCap: overview?.MarketCapitalization ? parseInt(overview.MarketCapitalization) : undefined
      };
      
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Fetch company overview information
   */
  async getOverview(symbol: string): Promise<AlphaVantageOverview | null> {
    try {
      const url = `${this.baseUrl}?function=OVERVIEW&symbol=${symbol}&apikey=${this.apiKey}`;
      const data = await this.makeRequest(url);
      
      if (!data.Symbol) {
        return null;
      }
      
      return data as AlphaVantageOverview;
      
    } catch (error) {
      console.error(`Error fetching overview for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Fetch quotes for multiple symbols
   * This will respect rate limits and may not return data for all symbols if limit is exceeded
   */
  async getMultipleQuotes(symbols: string[]): Promise<{ [symbol: string]: StockData | null }> {
    const results: { [symbol: string]: StockData | null } = {};
    
    console.log(`Fetching quotes for ${symbols.length} symbols. Remaining requests: ${this.getRemainingRequests()}`);
    
    for (const symbol of symbols) {
      if (!this.canMakeRequest()) {
        console.warn(`Rate limit reached. Skipping remaining symbols: ${symbols.slice(symbols.indexOf(symbol)).join(', ')}`);
        break;
      }
      
      results[symbol] = await this.getQuote(symbol);
      
      // Add a small delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  /**
   * Search for stocks by keywords
   */
  async searchSymbols(keywords: string): Promise<Array<{symbol: string, name: string}>> {
    try {
      const url = `${this.baseUrl}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(keywords)}&apikey=${this.apiKey}`;
      const data = await this.makeRequest(url);
      
      const bestMatches = data.bestMatches || [];
      
      return bestMatches.map((match: any) => ({
        symbol: match['1. symbol'],
        name: match['2. name']
      }));
      
    } catch (error) {
      console.error(`Error searching for symbols with keywords "${keywords}":`, error);
      return [];
    }
  }

  /**
   * Get service status and rate limit information
   */
  getServiceInfo() {
    this.cleanRateLimiter();
    return {
      hasApiKey: !!this.apiKey,
      remainingRequests: this.getRemainingRequests(),
      maxRequests: this.rateLimiter.maxRequests,
      timeWindow: this.rateLimiter.timeWindow,
      requestHistory: this.rateLimiter.requests.length
    };
  }
}

export const alphaVantageService = new AlphaVantageService();