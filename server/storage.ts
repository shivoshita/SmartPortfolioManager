import { 
  type User, 
  type InsertUser, 
  type Stock,
  type InsertStock,
  type PortfolioHolding,
  type InsertPortfolioHolding,
  type PortfolioHistory,
  type StockData,
  type PortfolioData,
  type HoldingData,
  users,
  stocks,
  portfolioHoldings,
  portfolioHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { alphaVantageService } from "./services/alphaVantageService";

// Storage interface for all portfolio management operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Stock operations
  getStock(symbol: string): Promise<Stock | undefined>;
  getStockById(id: string): Promise<Stock | undefined>;
  getAllStocks(): Promise<Stock[]>;
  createStock(stock: InsertStock): Promise<Stock>;
  updateStock(symbol: string, updates: Partial<InsertStock>): Promise<Stock | undefined>;
  
  // Real-time stock data operations
  refreshStockData(symbol: string): Promise<Stock | undefined>;
  refreshMultipleStocks(symbols: string[]): Promise<{ [symbol: string]: Stock | undefined }>;
  searchStocks(keywords: string): Promise<Array<{symbol: string, name: string}>>;
  getStockWithFreshData(symbol: string, maxAgeMinutes?: number): Promise<Stock | undefined>;
  
  // Portfolio operations
  getUserHoldings(userId: string): Promise<PortfolioHolding[]>;
  getHolding(userId: string, stockId: string): Promise<PortfolioHolding | undefined>;
  createHolding(holding: InsertPortfolioHolding & { userId: string }): Promise<PortfolioHolding>;
  updateHolding(id: string, updates: Partial<InsertPortfolioHolding>): Promise<PortfolioHolding | undefined>;
  deleteHolding(id: string): Promise<boolean>;
  
  // Portfolio history operations
  getPortfolioHistory(userId: string, days?: number): Promise<PortfolioHistory[]>;
  createPortfolioSnapshot(userId: string, data: PortfolioData): Promise<PortfolioHistory>;
  
  // Computed operations for dashboard
  getWatchlistStocks(): Promise<StockData[]>;
  getUserPortfolioData(userId: string): Promise<PortfolioData | undefined>;
  getUserHoldingsData(userId: string): Promise<HoldingData[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private stocks: Map<string, Stock>;
  private holdings: Map<string, PortfolioHolding>;
  private portfolioHistory: PortfolioHistory[];
  private stockTimestamps: Map<string, Date>;

  constructor() {
    this.users = new Map();
    this.stocks = new Map();
    this.holdings = new Map();
    this.portfolioHistory = [];
    this.stockTimestamps = new Map();
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Create sample user
    const sampleUser = await this.createUser({ username: "demo", password: "password" });
    
    // Create sample stocks
    const sampleStocks = [
      { symbol: "AAPL", name: "Apple Inc.", currentPrice: "182.52", previousClose: "180.95", changePercent: "0.87", volume: 48392847, marketCap: "2847392000000" },
      { symbol: "GOOGL", name: "Alphabet Inc. Class A", currentPrice: "142.87", previousClose: "144.12", changePercent: "-0.87", volume: 25847293, marketCap: "1792847000000" },
      { symbol: "MSFT", name: "Microsoft Corporation", currentPrice: "378.24", previousClose: "375.89", changePercent: "0.63", volume: 19284738, marketCap: "2847291000000" },
      { symbol: "TSLA", name: "Tesla, Inc.", currentPrice: "248.42", previousClose: "251.89", changePercent: "-1.38", volume: 63847291, marketCap: "792847000000" },
      { symbol: "NVDA", name: "NVIDIA Corporation", currentPrice: "875.28", previousClose: "869.42", changePercent: "0.67", volume: 41847291, marketCap: "2154738000000" }
    ] as const;
    
    for (const stockData of sampleStocks) {
      await this.createStock({ 
        symbol: stockData.symbol,
        name: stockData.name,
        currentPrice: stockData.currentPrice,
        previousClose: stockData.previousClose,
        changePercent: stockData.changePercent,
        volume: stockData.volume,
        marketCap: stockData.marketCap
      });
    }
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Stock operations
  async getStock(symbol: string): Promise<Stock | undefined> {
    return Array.from(this.stocks.values()).find(
      (stock) => stock.symbol === symbol
    );
  }
  
  async getStockById(id: string): Promise<Stock | undefined> {
    return this.stocks.get(id);
  }
  
  async getAllStocks(): Promise<Stock[]> {
    return Array.from(this.stocks.values());
  }
  
  async createStock(stock: InsertStock): Promise<Stock> {
    const id = randomUUID();
    const newStock: Stock = { 
      ...stock, 
      id,
      marketCap: stock.marketCap ?? null
    };
    this.stocks.set(id, newStock);
    this.stockTimestamps.set(newStock.symbol, new Date());
    return newStock;
  }
  
  async updateStock(symbol: string, updates: Partial<InsertStock>): Promise<Stock | undefined> {
    const stock = await this.getStock(symbol);
    if (!stock) return undefined;
    
    const updatedStock = { ...stock, ...updates };
    this.stocks.set(stock.id, updatedStock);
    this.stockTimestamps.set(symbol, new Date());
    return updatedStock;
  }
  
  // Real-time stock data operations
  async refreshStockData(symbol: string): Promise<Stock | undefined> {
    console.log(`Refreshing stock data for ${symbol}`);
    
    try {
      const freshData = await alphaVantageService.getQuote(symbol);
      if (!freshData) {
        console.warn(`No fresh data available for ${symbol}`);
        return await this.getStock(symbol);
      }
      
      // Check if stock already exists
      const existingStock = await this.getStock(symbol);
      if (existingStock) {
        // Update existing stock
        return await this.updateStock(symbol, {
          name: freshData.name,
          currentPrice: freshData.currentPrice.toString(),
          previousClose: freshData.previousClose.toString(),
          changePercent: freshData.changePercent.toString(),
          volume: freshData.volume,
          marketCap: freshData.marketCap?.toString() || null
        });
      } else {
        // Create new stock
        return await this.createStock({
          symbol: freshData.symbol,
          name: freshData.name,
          currentPrice: freshData.currentPrice.toString(),
          previousClose: freshData.previousClose.toString(),
          changePercent: freshData.changePercent.toString(),
          volume: freshData.volume,
          marketCap: freshData.marketCap?.toString() || null
        });
      }
    } catch (error) {
      console.error(`Error refreshing stock data for ${symbol}:`, error);
      return await this.getStock(symbol); // Return cached data as fallback
    }
  }
  
  async refreshMultipleStocks(symbols: string[]): Promise<{ [symbol: string]: Stock | undefined }> {
    console.log(`Refreshing data for ${symbols.length} stocks`);
    const results: { [symbol: string]: Stock | undefined } = {};
    
    try {
      const freshDataResults = await alphaVantageService.getMultipleQuotes(symbols);
      
      for (const [symbol, freshData] of Object.entries(freshDataResults)) {
        if (freshData) {
          results[symbol] = await this.refreshStockData(symbol);
        } else {
          // Use cached data as fallback
          results[symbol] = await this.getStock(symbol);
        }
      }
    } catch (error) {
      console.error('Error refreshing multiple stocks:', error);
      // Return cached data for all symbols
      for (const symbol of symbols) {
        results[symbol] = await this.getStock(symbol);
      }
    }
    
    return results;
  }
  
  async searchStocks(keywords: string): Promise<Array<{symbol: string, name: string}>> {
    try {
      return await alphaVantageService.searchSymbols(keywords);
    } catch (error) {
      console.error('Error searching stocks:', error);
      return [];
    }
  }
  
  async getStockWithFreshData(symbol: string, maxAgeMinutes: number = 15): Promise<Stock | undefined> {
    const cachedStock = await this.getStock(symbol);
    const lastUpdate = this.stockTimestamps.get(symbol);
    
    // If no cached data exists, always try to fetch fresh data
    if (!cachedStock || !lastUpdate) {
      console.log(`No cached data for ${symbol}, fetching fresh data`);
      return await this.refreshStockData(symbol);
    }
    
    // Check if cached data is still fresh
    const now = new Date();
    const ageMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (ageMinutes <= maxAgeMinutes) {
      console.log(`Using cached data for ${symbol} (${ageMinutes.toFixed(1)} minutes old)`);
      return cachedStock;
    }
    
    console.log(`Cached data for ${symbol} is ${ageMinutes.toFixed(1)} minutes old, refreshing`);
    return await this.refreshStockData(symbol);
  }
  
  // Portfolio operations
  async getUserHoldings(userId: string): Promise<PortfolioHolding[]> {
    return Array.from(this.holdings.values()).filter(
      (holding) => holding.userId === userId
    );
  }
  
  async getHolding(userId: string, stockId: string): Promise<PortfolioHolding | undefined> {
    return Array.from(this.holdings.values()).find(
      (holding) => holding.userId === userId && holding.stockId === stockId
    );
  }
  
  async createHolding(holding: InsertPortfolioHolding & { userId: string }): Promise<PortfolioHolding> {
    const id = randomUUID();
    const newHolding: PortfolioHolding = { 
      ...holding, 
      id,
      purchaseDate: new Date()
    };
    this.holdings.set(id, newHolding);
    return newHolding;
  }
  
  async updateHolding(id: string, updates: Partial<InsertPortfolioHolding>): Promise<PortfolioHolding | undefined> {
    const holding = this.holdings.get(id);
    if (!holding) return undefined;
    
    const updatedHolding = { ...holding, ...updates };
    this.holdings.set(id, updatedHolding);
    return updatedHolding;
  }
  
  async deleteHolding(id: string): Promise<boolean> {
    return this.holdings.delete(id);
  }
  
  // Portfolio history operations
  async getPortfolioHistory(userId: string, days: number = 365): Promise<PortfolioHistory[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.portfolioHistory
      .filter(entry => entry.userId === userId && new Date(entry.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  async createPortfolioSnapshot(userId: string, data: PortfolioData): Promise<PortfolioHistory> {
    const id = randomUUID();
    const snapshot: PortfolioHistory = {
      id,
      userId,
      date: new Date(),
      totalValue: data.totalValue.toString(),
      dailyChange: data.dailyChange.toString(),
      dailyChangePercent: data.dailyChangePercent.toString()
    };
    
    this.portfolioHistory.push(snapshot);
    return snapshot;
  }
  
  // Computed operations for dashboard
  async getWatchlistStocks(): Promise<StockData[]> {
    const allStocks = await this.getAllStocks();
    const stockSymbols = allStocks.map(stock => stock.symbol);
    
    // Try to refresh data for all stocks if we have API quota
    const serviceInfo = alphaVantageService.getServiceInfo();
    if (serviceInfo.remainingRequests > 0 && stockSymbols.length <= serviceInfo.remainingRequests) {
      console.log(`Attempting to refresh ${stockSymbols.length} stocks (${serviceInfo.remainingRequests} requests remaining)`);
      await this.refreshMultipleStocks(stockSymbols);
      // Get updated stocks
      const updatedStocks = await this.getAllStocks();
      return updatedStocks.map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        currentPrice: parseFloat(stock.currentPrice),
        previousClose: parseFloat(stock.previousClose),
        changePercent: parseFloat(stock.changePercent),
        volume: stock.volume,
        marketCap: stock.marketCap ? parseFloat(stock.marketCap) : undefined
      }));
    } else {
      console.log('Using cached stock data (insufficient API quota or too many stocks)');
      return allStocks.map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        currentPrice: parseFloat(stock.currentPrice),
        previousClose: parseFloat(stock.previousClose),
        changePercent: parseFloat(stock.changePercent),
        volume: stock.volume,
        marketCap: stock.marketCap ? parseFloat(stock.marketCap) : undefined
      }));
    }
  }
  
  async getUserPortfolioData(userId: string): Promise<PortfolioData | undefined> {
    const holdings = await this.getUserHoldings(userId);
    if (holdings.length === 0) {
      return {
        totalValue: 0,
        dailyChange: 0,
        dailyChangePercent: 0,
        totalReturn: 0,
        totalReturnPercent: 0
      };
    }
    
    let totalValue = 0;
    let totalCost = 0;
    let dailyChange = 0;
    
    for (const holding of holdings) {
      const stock = await this.getStockById(holding.stockId);
      if (stock) {
        const currentPrice = parseFloat(stock.currentPrice);
        const previousClose = parseFloat(stock.previousClose);
        const shares = parseFloat(holding.shares);
        const avgPrice = parseFloat(holding.averagePrice);
        
        const marketValue = currentPrice * shares;
        const cost = avgPrice * shares;
        const dayChange = (currentPrice - previousClose) * shares;
        
        totalValue += marketValue;
        totalCost += cost;
        dailyChange += dayChange;
      }
    }
    
    const totalReturn = totalValue - totalCost;
    const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;
    const dailyChangePercent = totalValue > 0 ? (dailyChange / (totalValue - dailyChange)) * 100 : 0;
    
    return {
      totalValue,
      dailyChange,
      dailyChangePercent,
      totalReturn,
      totalReturnPercent
    };
  }
  
  async getUserHoldingsData(userId: string): Promise<HoldingData[]> {
    const holdings = await this.getUserHoldings(userId);
    const holdingsData: HoldingData[] = [];
    
    for (const holding of holdings) {
      const stock = await this.getStockById(holding.stockId);
      if (stock) {
        const currentPrice = parseFloat(stock.currentPrice);
        const shares = parseFloat(holding.shares);
        const averagePrice = parseFloat(holding.averagePrice);
        const marketValue = currentPrice * shares;
        const unrealizedGain = marketValue - (averagePrice * shares);
        const unrealizedGainPercent = (averagePrice * shares) > 0 ? (unrealizedGain / (averagePrice * shares)) * 100 : 0;
        
        holdingsData.push({
          symbol: stock.symbol,
          name: stock.name,
          shares,
          averagePrice,
          currentPrice,
          marketValue,
          unrealizedGain,
          unrealizedGainPercent
        });
      }
    }
    
    return holdingsData;
  }
}

// Database implementation
export class DatabaseStorage implements IStorage {
  private stockTimestamps: Map<string, Date> = new Map();
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Stock operations
  async getStock(symbol: string): Promise<Stock | undefined> {
    const [stock] = await db.select().from(stocks).where(eq(stocks.symbol, symbol));
    return stock || undefined;
  }
  
  async getStockById(id: string): Promise<Stock | undefined> {
    const [stock] = await db.select().from(stocks).where(eq(stocks.id, id));
    return stock || undefined;
  }
  
  async getAllStocks(): Promise<Stock[]> {
    return await db.select().from(stocks);
  }
  
  async createStock(stock: InsertStock): Promise<Stock> {
    const [newStock] = await db.insert(stocks).values(stock).returning();
    return newStock;
  }
  
  async updateStock(symbol: string, updates: Partial<InsertStock>): Promise<Stock | undefined> {
    const [updatedStock] = await db.update(stocks)
      .set(updates)
      .where(eq(stocks.symbol, symbol))
      .returning();
    if (updatedStock) {
      this.stockTimestamps.set(symbol, new Date());
    }
    return updatedStock || undefined;
  }
  
  // Real-time stock data operations
  async refreshStockData(symbol: string): Promise<Stock | undefined> {
    console.log(`Refreshing stock data for ${symbol}`);
    
    try {
      const freshData = await alphaVantageService.getQuote(symbol);
      if (!freshData) {
        console.warn(`No fresh data available for ${symbol}`);
        return await this.getStock(symbol);
      }
      
      // Check if stock already exists
      const existingStock = await this.getStock(symbol);
      if (existingStock) {
        // Update existing stock
        return await this.updateStock(symbol, {
          name: freshData.name,
          currentPrice: freshData.currentPrice.toString(),
          previousClose: freshData.previousClose.toString(),
          changePercent: freshData.changePercent.toString(),
          volume: freshData.volume,
          marketCap: freshData.marketCap?.toString() || null
        });
      } else {
        // Create new stock
        return await this.createStock({
          symbol: freshData.symbol,
          name: freshData.name,
          currentPrice: freshData.currentPrice.toString(),
          previousClose: freshData.previousClose.toString(),
          changePercent: freshData.changePercent.toString(),
          volume: freshData.volume,
          marketCap: freshData.marketCap?.toString() || null
        });
      }
    } catch (error) {
      console.error(`Error refreshing stock data for ${symbol}:`, error);
      return await this.getStock(symbol); // Return cached data as fallback
    }
  }
  
  async refreshMultipleStocks(symbols: string[]): Promise<{ [symbol: string]: Stock | undefined }> {
    console.log(`Refreshing data for ${symbols.length} stocks`);
    const results: { [symbol: string]: Stock | undefined } = {};
    
    try {
      const freshDataResults = await alphaVantageService.getMultipleQuotes(symbols);
      
      for (const [symbol, freshData] of Object.entries(freshDataResults)) {
        if (freshData) {
          results[symbol] = await this.refreshStockData(symbol);
        } else {
          // Use cached data as fallback
          results[symbol] = await this.getStock(symbol);
        }
      }
    } catch (error) {
      console.error('Error refreshing multiple stocks:', error);
      // Return cached data for all symbols
      for (const symbol of symbols) {
        results[symbol] = await this.getStock(symbol);
      }
    }
    
    return results;
  }
  
  async searchStocks(keywords: string): Promise<Array<{symbol: string, name: string}>> {
    try {
      return await alphaVantageService.searchSymbols(keywords);
    } catch (error) {
      console.error('Error searching stocks:', error);
      return [];
    }
  }
  
  async getStockWithFreshData(symbol: string, maxAgeMinutes: number = 15): Promise<Stock | undefined> {
    const cachedStock = await this.getStock(symbol);
    const lastUpdate = this.stockTimestamps.get(symbol);
    
    // If no cached data exists, always try to fetch fresh data
    if (!cachedStock || !lastUpdate) {
      console.log(`No cached data for ${symbol}, fetching fresh data`);
      return await this.refreshStockData(symbol);
    }
    
    // Check if cached data is still fresh
    const now = new Date();
    const ageMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (ageMinutes <= maxAgeMinutes) {
      console.log(`Using cached data for ${symbol} (${ageMinutes.toFixed(1)} minutes old)`);
      return cachedStock;
    }
    
    console.log(`Cached data for ${symbol} is ${ageMinutes.toFixed(1)} minutes old, refreshing`);
    return await this.refreshStockData(symbol);
  }
  
  // Portfolio operations
  async getUserHoldings(userId: string): Promise<PortfolioHolding[]> {
    return await db.select().from(portfolioHoldings).where(eq(portfolioHoldings.userId, userId));
  }
  
  async getHolding(userId: string, stockId: string): Promise<PortfolioHolding | undefined> {
    const [holding] = await db.select().from(portfolioHoldings)
      .where(and(
        eq(portfolioHoldings.userId, userId),
        eq(portfolioHoldings.stockId, stockId)
      ));
    return holding || undefined;
  }
  
  async createHolding(holding: InsertPortfolioHolding & { userId: string }): Promise<PortfolioHolding> {
    const [newHolding] = await db.insert(portfolioHoldings).values(holding).returning();
    return newHolding;
  }
  
  async updateHolding(id: string, updates: Partial<InsertPortfolioHolding>): Promise<PortfolioHolding | undefined> {
    const [updatedHolding] = await db.update(portfolioHoldings)
      .set(updates)
      .where(eq(portfolioHoldings.id, id))
      .returning();
    return updatedHolding || undefined;
  }
  
  async deleteHolding(id: string): Promise<boolean> {
    const result = await db.delete(portfolioHoldings)
      .where(eq(portfolioHoldings.id, id))
      .returning();
    return result.length > 0;
  }
  
  // Portfolio history operations
  async getPortfolioHistory(userId: string, days: number = 365): Promise<PortfolioHistory[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return await db.select().from(portfolioHistory)
      .where(and(
        eq(portfolioHistory.userId, userId),
        sql`${portfolioHistory.date} >= ${cutoffDate}`
      ))
      .orderBy(desc(portfolioHistory.date));
  }
  
  async createPortfolioSnapshot(userId: string, data: PortfolioData): Promise<PortfolioHistory> {
    const [snapshot] = await db.insert(portfolioHistory).values({
      userId,
      date: new Date(),
      totalValue: data.totalValue.toString(),
      dailyChange: data.dailyChange.toString(),
      dailyChangePercent: data.dailyChangePercent.toString()
    }).returning();
    return snapshot;
  }
  
  // Computed operations for dashboard
  async getWatchlistStocks(): Promise<StockData[]> {
    const allStocks = await this.getAllStocks();
    const stockSymbols = allStocks.map(stock => stock.symbol);
    
    // Try to refresh data for all stocks if we have API quota
    const serviceInfo = alphaVantageService.getServiceInfo();
    if (serviceInfo.remainingRequests > 0 && stockSymbols.length <= serviceInfo.remainingRequests) {
      console.log(`Attempting to refresh ${stockSymbols.length} stocks (${serviceInfo.remainingRequests} requests remaining)`);
      await this.refreshMultipleStocks(stockSymbols);
      // Get updated stocks
      const updatedStocks = await this.getAllStocks();
      return updatedStocks.map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        currentPrice: parseFloat(stock.currentPrice),
        previousClose: parseFloat(stock.previousClose),
        changePercent: parseFloat(stock.changePercent),
        volume: stock.volume,
        marketCap: stock.marketCap ? parseFloat(stock.marketCap) : undefined
      }));
    } else {
      console.log('Using cached stock data (insufficient API quota or too many stocks)');
      return allStocks.map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        currentPrice: parseFloat(stock.currentPrice),
        previousClose: parseFloat(stock.previousClose),
        changePercent: parseFloat(stock.changePercent),
        volume: stock.volume,
        marketCap: stock.marketCap ? parseFloat(stock.marketCap) : undefined
      }));
    }
  }
  
  async getUserPortfolioData(userId: string): Promise<PortfolioData | undefined> {
    const holdings = await this.getUserHoldings(userId);
    if (holdings.length === 0) {
      return {
        totalValue: 0,
        dailyChange: 0,
        dailyChangePercent: 0,
        totalReturn: 0,
        totalReturnPercent: 0
      };
    }
    
    let totalValue = 0;
    let totalCost = 0;
    let dailyChange = 0;
    
    for (const holding of holdings) {
      const stock = await this.getStockById(holding.stockId);
      if (stock) {
        const currentPrice = parseFloat(stock.currentPrice);
        const previousClose = parseFloat(stock.previousClose);
        const shares = parseFloat(holding.shares);
        const avgPrice = parseFloat(holding.averagePrice);
        
        const marketValue = currentPrice * shares;
        const cost = avgPrice * shares;
        const dayChange = (currentPrice - previousClose) * shares;
        
        totalValue += marketValue;
        totalCost += cost;
        dailyChange += dayChange;
      }
    }
    
    const totalReturn = totalValue - totalCost;
    const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;
    const dailyChangePercent = totalValue > 0 ? (dailyChange / (totalValue - dailyChange)) * 100 : 0;
    
    return {
      totalValue,
      dailyChange,
      dailyChangePercent,
      totalReturn,
      totalReturnPercent
    };
  }
  
  async getUserHoldingsData(userId: string): Promise<HoldingData[]> {
    const holdings = await this.getUserHoldings(userId);
    const holdingsData: HoldingData[] = [];
    
    for (const holding of holdings) {
      const stock = await this.getStockById(holding.stockId);
      if (stock) {
        const currentPrice = parseFloat(stock.currentPrice);
        const shares = parseFloat(holding.shares);
        const averagePrice = parseFloat(holding.averagePrice);
        const marketValue = currentPrice * shares;
        const unrealizedGain = marketValue - (averagePrice * shares);
        const unrealizedGainPercent = (averagePrice * shares) > 0 ? (unrealizedGain / (averagePrice * shares)) * 100 : 0;
        
        holdingsData.push({
          symbol: stock.symbol,
          name: stock.name,
          shares,
          averagePrice,
          currentPrice,
          marketValue,
          unrealizedGain,
          unrealizedGainPercent
        });
      }
    }
    
    return holdingsData;
  }
}

// Use database storage in production, memory storage for development/testing
export const storage = process.env.NODE_ENV === 'development' 
  ? new MemStorage() 
  : new DatabaseStorage();
