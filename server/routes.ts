import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertStockSchema, insertPortfolioHoldingSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await storage.createUser({ ...userData, password: hashedPassword });
      res.status(201).json({ user: { id: user.id, username: user.username } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      res.json({ user: { id: user.id, username: user.username } });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/auth/logout', async (req, res) => {
    // In a real app, this would clear the session/token
    res.json({ success: true });
  });

  app.get('/api/auth/me', async (req, res) => {
    // In a real app, this would check session/token and return user info
    // For now, return demo user if no auth headers are present
    res.json({ 
      user: { 
        id: 'demo-user', 
        username: 'demo' 
      } 
    });
  });

  // Stock routes
  app.get('/api/stocks', async (req, res) => {
    try {
      const refresh = req.query.refresh === 'true';
      const maxAge = req.query.maxAge ? parseInt(req.query.maxAge as string) : undefined;
      
      if (refresh) {
        console.log('Forced refresh requested for all watchlist stocks');
        // Get all stock symbols and force refresh them
        const allStocks = await storage.getAllStocks();
        const stockSymbols = allStocks.map(stock => stock.symbol);
        
        if (stockSymbols.length > 0) {
          console.log(`Force refreshing ${stockSymbols.length} stocks: ${stockSymbols.join(', ')}`);
          await storage.refreshMultipleStocks(stockSymbols);
        }
      }
      
      const stocks = await storage.getWatchlistStocks();
      res.json(stocks);
    } catch (error) {
      console.error('Error fetching stocks:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.get('/api/stocks/:symbol', async (req, res) => {
    try {
      const { symbol } = req.params;
      const refresh = req.query.refresh === 'true';
      const maxAge = req.query.maxAge ? parseInt(req.query.maxAge as string) : 15;
      
      let stock;
      if (refresh) {
        console.log(`Refreshing data for ${symbol}`);
        stock = await storage.refreshStockData(symbol);
      } else {
        stock = await storage.getStockWithFreshData(symbol, maxAge);
      }
      
      if (!stock) {
        return res.status(404).json({ error: 'Stock not found' });
      }
      
      const stockData = {
        symbol: stock.symbol,
        name: stock.name,
        currentPrice: parseFloat(stock.currentPrice),
        previousClose: parseFloat(stock.previousClose),
        changePercent: parseFloat(stock.changePercent),
        volume: stock.volume,
        marketCap: stock.marketCap ? parseFloat(stock.marketCap) : undefined
      };
      
      res.json(stockData);
    } catch (error) {
      console.error('Error fetching stock:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.post('/api/stocks', async (req, res) => {
    try {
      const stockData = insertStockSchema.parse(req.body);
      const stock = await storage.createStock(stockData);
      res.status(201).json(stock);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      console.error('Error creating stock:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // New Alpha Vantage specific routes
  app.post('/api/stocks/refresh', async (req, res) => {
    try {
      const { symbols } = req.body;
      
      if (!symbols || !Array.isArray(symbols)) {
        return res.status(400).json({ error: 'Symbols array is required' });
      }
      
      console.log(`Refreshing data for symbols: ${symbols.join(', ')}`);
      const refreshedStocks = await storage.refreshMultipleStocks(symbols);
      
      const results = Object.entries(refreshedStocks).map(([symbol, stock]) => {
        if (stock) {
          return {
            symbol: stock.symbol,
            name: stock.name,
            currentPrice: parseFloat(stock.currentPrice),
            previousClose: parseFloat(stock.previousClose),
            changePercent: parseFloat(stock.changePercent),
            volume: stock.volume,
            marketCap: stock.marketCap ? parseFloat(stock.marketCap) : undefined
          };
        }
        return { symbol, error: 'Failed to refresh' };
      });
      
      res.json({ refreshed: results });
    } catch (error) {
      console.error('Error refreshing stocks:', error);
      res.status(500).json({ error: 'Failed to refresh stock data' });
    }
  });
  
  app.get('/api/stocks/search/:keywords', async (req, res) => {
    try {
      const { keywords } = req.params;
      
      if (!keywords || keywords.trim().length < 2) {
        return res.status(400).json({ error: 'Search keywords must be at least 2 characters long' });
      }
      
      console.log(`Searching stocks with keywords: ${keywords}`);
      const searchResults = await storage.searchStocks(keywords);
      
      res.json({ results: searchResults });
    } catch (error) {
      console.error('Error searching stocks:', error);
      res.status(500).json({ error: 'Failed to search stocks' });
    }
  });
  
  app.post('/api/stocks/:symbol/add-to-watchlist', async (req, res) => {
    try {
      const { symbol } = req.params;
      
      console.log(`Adding ${symbol} to watchlist`);
      const stock = await storage.refreshStockData(symbol);
      
      if (!stock) {
        return res.status(404).json({ error: 'Stock not found or could not be added' });
      }
      
      const stockData = {
        symbol: stock.symbol,
        name: stock.name,
        currentPrice: parseFloat(stock.currentPrice),
        previousClose: parseFloat(stock.previousClose),
        changePercent: parseFloat(stock.changePercent),
        volume: stock.volume,
        marketCap: stock.marketCap ? parseFloat(stock.marketCap) : undefined
      };
      
      res.status(201).json({ added: stockData });
    } catch (error) {
      console.error('Error adding stock to watchlist:', error);
      res.status(500).json({ error: 'Failed to add stock to watchlist' });
    }
  });

  // Portfolio routes
  app.get('/api/portfolio/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const portfolioData = await storage.getUserPortfolioData(userId);
      
      if (!portfolioData) {
        return res.status(404).json({ error: 'Portfolio not found' });
      }
      
      res.json(portfolioData);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.get('/api/portfolio/:userId/holdings', async (req, res) => {
    try {
      const { userId } = req.params;
      const holdings = await storage.getUserHoldingsData(userId);
      res.json(holdings);
    } catch (error) {
      console.error('Error fetching holdings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.post('/api/portfolio/:userId/holdings', async (req, res) => {
    try {
      const { userId } = req.params;
      const holdingData = {
        ...insertPortfolioHoldingSchema.parse(req.body),
        userId
      };
      
      const holding = await storage.createHolding(holdingData);
      res.status(201).json(holding);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      console.error('Error creating holding:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.put('/api/portfolio/holdings/:holdingId', async (req, res) => {
    try {
      const { holdingId } = req.params;
      const updates = insertPortfolioHoldingSchema.partial().parse(req.body);
      
      const holding = await storage.updateHolding(holdingId, updates);
      
      if (!holding) {
        return res.status(404).json({ error: 'Holding not found' });
      }
      
      res.json(holding);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      console.error('Error updating holding:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.delete('/api/portfolio/holdings/:holdingId', async (req, res) => {
    try {
      const { holdingId } = req.params;
      const success = await storage.deleteHolding(holdingId);
      
      if (!success) {
        return res.status(404).json({ error: 'Holding not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting holding:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Portfolio history routes
  app.get('/api/portfolio/:userId/history', async (req, res) => {
    try {
      const { userId } = req.params;
      const days = req.query.days ? parseInt(req.query.days as string) : 365;
      
      const history = await storage.getPortfolioHistory(userId, days);
      res.json(history);
    } catch (error) {
      console.error('Error fetching portfolio history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.post('/api/portfolio/:userId/snapshot', async (req, res) => {
    try {
      const { userId } = req.params;
      const portfolioData = await storage.getUserPortfolioData(userId);
      
      if (!portfolioData) {
        return res.status(404).json({ error: 'Portfolio not found' });
      }
      
      const snapshot = await storage.createPortfolioSnapshot(userId, portfolioData);
      res.status(201).json(snapshot);
    } catch (error) {
      console.error('Error creating portfolio snapshot:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
