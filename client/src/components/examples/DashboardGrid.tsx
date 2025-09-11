import DashboardGrid from '../DashboardGrid'
import StockWatchlist from '../StockWatchlist'
import PortfolioValueCard from '../PortfolioValueCard'
import PortfolioChart from '../PortfolioChart'
import { useState } from 'react'

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
  }
];

const mockPortfolioData = {
  totalValue: 125847.32,
  dailyChange: 2847.21,
  dailyChangePercent: 2.31,
  totalReturn: 28472.18,
  totalReturnPercent: 29.2
};

const mockChartData = [
  { date: 'Jan 2024', value: 85000, benchmark: 83000 },
  { date: 'Feb 2024', value: 88500, benchmark: 84200 },
  { date: 'Mar 2024', value: 92000, benchmark: 86500 },
  { date: 'Apr 2024', value: 89500, benchmark: 87800 },
  { date: 'May 2024', value: 95000, benchmark: 90200 },
  { date: 'Jun 2024', value: 98500, benchmark: 91500 }
];

export default function DashboardGridExample() {
  const [widgets, setWidgets] = useState([
    {
      id: 'portfolio-value',
      title: 'Portfolio Value',
      component: <PortfolioValueCard portfolioData={mockPortfolioData} />,
      width: 'half' as const,
      height: 'medium' as const
    },
    {
      id: 'stock-watchlist', 
      title: 'Stock Watchlist',
      component: <StockWatchlist stocks={mockStocks} />,
      width: 'full' as const,
      height: 'medium' as const
    },
    {
      id: 'portfolio-chart',
      title: 'Portfolio Chart', 
      component: <PortfolioChart data={mockChartData} />,
      width: 'full' as const,
      height: 'large' as const
    }
  ]);

  const handleReorder = (newWidgets: any[]) => {
    setWidgets(newWidgets);
  };

  const handleAddWidget = () => {
    console.log('Add widget clicked');
  };

  return (
    <DashboardGrid 
      widgets={widgets}
      onReorder={handleReorder}
      onAddWidget={handleAddWidget}
    />
  );
}