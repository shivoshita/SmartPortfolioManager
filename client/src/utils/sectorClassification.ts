// Sector classification for common stocks
// In a production app, this would come from a comprehensive financial API
export const STOCK_SECTORS: Record<string, string> = {
  // Technology
  'AAPL': 'Technology',
  'MSFT': 'Technology',
  'NVDA': 'Technology',
  'AMD': 'Technology',
  'INTC': 'Technology',
  'ORCL': 'Technology',
  'CRM': 'Technology',
  'ADBE': 'Technology',
  'UBER': 'Technology',
  'SPOT': 'Technology',
  'SNOW': 'Technology',
  'PLTR': 'Technology',
  'RBLX': 'Technology',
  
  // Healthcare
  'JNJ': 'Healthcare',
  'PFE': 'Healthcare',
  'UNH': 'Healthcare',
  'MRNA': 'Healthcare',
  'ABBV': 'Healthcare',
  'TMO': 'Healthcare',
  'DHR': 'Healthcare',
  'BMY': 'Healthcare',
  'ABT': 'Healthcare',
  'LLY': 'Healthcare',
  'MRK': 'Healthcare',
  'AMGN': 'Healthcare',
  'GILD': 'Healthcare',
  'REGN': 'Healthcare',
  'VRTX': 'Healthcare',
  
  // Financials
  'JPM': 'Financials',
  'BAC': 'Financials',
  'WFC': 'Financials',
  'GS': 'Financials',
  'MS': 'Financials',
  'C': 'Financials',
  'BRK.A': 'Financials',
  'BRK.B': 'Financials',
  'AXP': 'Financials',
  'V': 'Financials',
  'MA': 'Financials',
  'PYPL': 'Financials',
  'SQ': 'Financials',
  'COF': 'Financials',
  'USB': 'Financials',
  
  // Consumer Discretionary
  'AMZN': 'Consumer Discretionary',
  'TSLA': 'Consumer Discretionary',
  'HD': 'Consumer Discretionary',
  'MCD': 'Consumer Discretionary',
  'SBUX': 'Consumer Discretionary',
  'NKE': 'Consumer Discretionary',
  'DIS': 'Consumer Discretionary',
  'LOW': 'Consumer Discretionary',
  'TJX': 'Consumer Discretionary',
  'BKNG': 'Consumer Discretionary',
  'CMG': 'Consumer Discretionary',
  'ABNB': 'Consumer Discretionary',
  
  // Consumer Staples
  'PG': 'Consumer Staples',
  'KO': 'Consumer Staples',
  'PEP': 'Consumer Staples',
  'WMT': 'Consumer Staples',
  'COST': 'Consumer Staples',
  'CL': 'Consumer Staples',
  'KMB': 'Consumer Staples',
  'GIS': 'Consumer Staples',
  'K': 'Consumer Staples',
  'MO': 'Consumer Staples',
  
  // Energy
  'XOM': 'Energy',
  'CVX': 'Energy',
  'COP': 'Energy',
  'EOG': 'Energy',
  'SLB': 'Energy',
  'MPC': 'Energy',
  'PSX': 'Energy',
  'VLO': 'Energy',
  'OXY': 'Energy',
  'KMI': 'Energy',
  
  // Communication Services
  'VZ': 'Communication Services',
  'T': 'Communication Services',
  'CMCSA': 'Communication Services',
  'TMUS': 'Communication Services',
  'CHTR': 'Communication Services',
  
  // Industrials
  'BA': 'Industrials',
  'CAT': 'Industrials',
  'GE': 'Industrials',
  'MMM': 'Industrials',
  'HON': 'Industrials',
  'UPS': 'Industrials',
  'LMT': 'Industrials',
  'RTX': 'Industrials',
  'NOC': 'Industrials',
  'GD': 'Industrials',
  
  // Utilities
  'NEE': 'Utilities',
  'DUK': 'Utilities',
  'SO': 'Utilities',
  'AEP': 'Utilities',
  'EXC': 'Utilities',
  'XEL': 'Utilities',
  'SRE': 'Utilities',
  'PEG': 'Utilities',
  'ED': 'Utilities',
  'ES': 'Utilities',
  
  // Materials
  'LIN': 'Materials',
  'APD': 'Materials',
  'ECL': 'Materials',
  'SHW': 'Materials',
  'FCX': 'Materials',
  'NEM': 'Materials',
  'DOW': 'Materials',
  'DD': 'Materials',
  'PPG': 'Materials',
  'VMC': 'Materials',
  
  // Real Estate
  'AMT': 'Real Estate',
  'PLD': 'Real Estate',
  'CCI': 'Real Estate',
  'EQIX': 'Real Estate',
  'SPG': 'Real Estate',
  'DLR': 'Real Estate',
  'PSA': 'Real Estate',
  'O': 'Real Estate',
  'WELL': 'Real Estate',
  'AVB': 'Real Estate'
};

export function getStockSector(symbol: string): string {
  // Remove any suffixes (like .A, .B) and convert to uppercase
  const cleanSymbol = symbol.split('.')[0].toUpperCase();
  return STOCK_SECTORS[cleanSymbol] || 'Other';
}

export function computeSectorAllocation(holdings: Array<{symbol: string, marketValue: number}>): Array<{name: string, value: number, color: string}> {
  if (!holdings || holdings.length === 0) {
    return [];
  }

  // Calculate total portfolio value
  const totalValue = holdings.reduce((sum, holding) => sum + holding.marketValue, 0);
  
  if (totalValue === 0) {
    return [];
  }

  // Group holdings by sector
  const sectorTotals = holdings.reduce((acc, holding) => {
    const sector = getStockSector(holding.symbol);
    acc[sector] = (acc[sector] || 0) + holding.marketValue;
    return acc;
  }, {} as Record<string, number>);

  // Convert to percentage-based allocation with colors
  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(217, 91%, 60%)', // Additional colors for more sectors
    'hsl(142, 71%, 45%)',
    'hsl(0, 84%, 60%)',
    'hsl(262, 83%, 58%)',
    'hsl(38, 92%, 50%)'
  ];

  const sectorAllocation = Object.entries(sectorTotals)
    .map(([sector, value], index) => ({
      name: sector,
      value: Math.round((value / totalValue) * 100 * 10) / 10, // Round to 1 decimal
      color: colors[index % colors.length]
    }))
    .sort((a, b) => b.value - a.value); // Sort by value descending

  return sectorAllocation;
}