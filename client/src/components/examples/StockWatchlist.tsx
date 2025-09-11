import StockWatchlist from '../StockWatchlist'

// TODO: remove mock functionality
const mockStocks = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    currentPrice: 182.52,
    previousClose: 180.95,
    changePercent: 0.87,
    volume: 48392847,
    marketCap: 2847392000000
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc. Class A",
    currentPrice: 142.87,
    previousClose: 144.12,
    changePercent: -0.87,
    volume: 25847293,
    marketCap: 1792847000000
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    currentPrice: 378.24,
    previousClose: 375.89,
    changePercent: 0.63,
    volume: 19284738,
    marketCap: 2847291000000
  },
  {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    currentPrice: 248.42,
    previousClose: 251.89,
    changePercent: -1.38,
    volume: 63847291,
    marketCap: 792847000000
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    currentPrice: 875.28,
    previousClose: 869.42,
    changePercent: 0.67,
    volume: 41847291,
    marketCap: 2154738000000
  }
];

export default function StockWatchlistExample() {
  const handleStockClick = (symbol: string) => {
    console.log('Stock clicked:', symbol);
  };

  return (
    <StockWatchlist 
      stocks={mockStocks} 
      onStockClick={handleStockClick}
    />
  );
}