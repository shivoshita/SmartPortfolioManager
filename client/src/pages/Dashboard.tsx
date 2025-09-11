import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardGrid from "@/components/DashboardGrid";
import StockWatchlist from "@/components/StockWatchlist";
import PortfolioValueCard from "@/components/PortfolioValueCard";
import PortfolioChart from "@/components/PortfolioChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { StockData, PortfolioData, PortfolioHistory } from "@shared/schema";

// Fallback chart data for demo purposes  
const fallbackChartData = [
  { date: 'Jan 2024', value: 85000, benchmark: 83000 },
  { date: 'Feb 2024', value: 88500, benchmark: 84200 },
  { date: 'Mar 2024', value: 92000, benchmark: 86500 },
  { date: 'Apr 2024', value: 89500, benchmark: 87800 },
  { date: 'May 2024', value: 95000, benchmark: 90200 },
  { date: 'Jun 2024', value: 98500, benchmark: 91500 },
  { date: 'Jul 2024', value: 102000, benchmark: 93800 },
  { date: 'Aug 2024', value: 107500, benchmark: 96200 },
  { date: 'Sep 2024', value: 112000, benchmark: 98500 },
  { date: 'Oct 2024', value: 118500, benchmark: 101200 },
  { date: 'Nov 2024', value: 123000, benchmark: 103800 },
  { date: 'Dec 2024', value: 125847, benchmark: 105500 },
];

export default function Dashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  if (!user) {
    return null; // ProtectedRoute will handle redirect
  }
  
  // Fetch real stock data with automatic refresh
  const { 
    data: stocks, 
    isLoading: stocksLoading, 
    error: stocksError,
    refetch: refetchStocks 
  } = useQuery<StockData[]>({
    queryKey: ['/api/stocks'],
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes  
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    refetchIntervalInBackground: true // Refresh even when tab is not active
  });

  // Fetch portfolio data with periodic refresh
  const { 
    data: portfolioData, 
    isLoading: portfolioLoading, 
    error: portfolioError 
  } = useQuery<PortfolioData>({
    queryKey: ['/api/portfolio', user.id],
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 1,
    refetchInterval: 3 * 60 * 1000, // Auto-refresh every 3 minutes
    refetchIntervalInBackground: false // Only refresh when tab is active
  });

  // Fetch portfolio history
  const { 
    data: portfolioHistory, 
    isLoading: historyLoading 
  } = useQuery<PortfolioHistory[]>({
    queryKey: ['/api/portfolio', user.id, 'history'],
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  // Mutation for refreshing stock data
  const refreshStocksMutation = useMutation({
    mutationFn: async (symbols: string[]) => {
      return apiRequest('POST', '/api/stocks/refresh', { symbols });
    },
    onSuccess: () => {
      // Invalidate and refetch stock data after successful refresh
      queryClient.invalidateQueries({ queryKey: ['/api/stocks'] });
      toast({
        title: "Stocks Refreshed",
        description: "Stock prices have been updated with latest data"
      });
    },
    onError: (error: any) => {
      console.error('Stock refresh error:', error);
      toast({
        title: "Refresh Failed",
        description: error?.message || "Could not refresh stock data",
        variant: "destructive"
      });
    }
  });

  const handleRefreshStocks = async () => {
    if (!stocks || stocks.length === 0) {
      toast({
        title: "No Stocks",
        description: "No stocks in watchlist to refresh",
        variant: "destructive"
      });
      return;
    }

    // Get current stock symbols and trigger refresh
    const symbols = stocks.map(stock => stock.symbol);
    console.log('Refreshing stocks:', symbols);
    refreshStocksMutation.mutate(symbols);
  };

  const handleStockClick = (symbol: string) => {
    console.log('Stock clicked:', symbol);
    toast({
      title: "Stock Selected",
      description: `Viewing details for ${symbol}`
    });
  };

  const widgets = [
    {
      id: 'portfolio-value',
      title: 'Portfolio Value',
      component: portfolioLoading ? (
        <Card data-testid="portfolio-value-loading">
          <CardHeader>
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ) : portfolioError ? (
        <Card data-testid="portfolio-value-error">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              Portfolio Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Unable to load portfolio data</p>
          </CardContent>
        </Card>
      ) : (
        <PortfolioValueCard 
          portfolioData={portfolioData || { totalValue: 0, dailyChange: 0, dailyChangePercent: 0, totalReturn: 0, totalReturnPercent: 0 }}
          onViewDetails={() => console.log('View portfolio details')}
        />
      ),
      width: 'half' as const,
      height: 'medium' as const
    },
    {
      id: 'portfolio-chart',
      title: 'Portfolio Performance',
      component: historyLoading ? (
        <Card data-testid="portfolio-chart-loading">
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      ) : (
        <PortfolioChart data={portfolioHistory && portfolioHistory.length > 0 ? portfolioHistory.map(entry => ({
          date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          value: parseFloat(entry.totalValue),
          benchmark: parseFloat(entry.totalValue) * 0.95 // Mock benchmark for demo
        })) : fallbackChartData} />
      ),
      width: 'full' as const,
      height: 'large' as const
    },
    {
      id: 'stock-watchlist',
      title: 'Stock Watchlist',
      component: stocksLoading ? (
        <Card data-testid="stock-watchlist-loading">
          <CardHeader className="flex flex-row items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-20" />
          </CardHeader>
          <CardContent>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : stocksError ? (
        <Card data-testid="stock-watchlist-error">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              Unable to Load Stocks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Failed to fetch stock data</p>
            <Button onClick={handleRefreshStocks} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <StockWatchlist 
          stocks={stocks || []}
          onStockClick={handleStockClick}
          onRefresh={handleRefreshStocks}
        />
      ),
      width: 'full' as const,
      height: 'medium' as const
    }
  ];

  const handleReorder = (newWidgets: any[]) => {
    console.log('Dashboard widgets reordered');
  };

  const handleAddWidget = () => {
    console.log('Add widget functionality would open a modal here');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your portfolio overview. Drag and drop widgets to customize your layout.
        </p>
      </div>
      
      <DashboardGrid 
        widgets={widgets}
        onReorder={handleReorder}
        onAddWidget={handleAddWidget}
      />
    </div>
  );
}