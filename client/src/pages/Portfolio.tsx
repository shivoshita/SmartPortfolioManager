import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, TrendingUp, TrendingDown, DollarSign, AlertCircle, RefreshCw } from "lucide-react";
import PortfolioValueCard from "@/components/PortfolioValueCard";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import type { HoldingData, PortfolioData } from "@shared/schema";

export default function Portfolio() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  if (!user) {
    return null; // ProtectedRoute will handle redirect
  }

  // Fetch portfolio data
  const { 
    data: portfolioData, 
    isLoading: portfolioLoading, 
    error: portfolioError,
    refetch: refetchPortfolio 
  } = useQuery<PortfolioData>({
    queryKey: ['/api/portfolio', user.id],
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 2
  });

  // Fetch holdings data
  const { 
    data: holdings, 
    isLoading: holdingsLoading, 
    error: holdingsError,
    refetch: refetchHoldings 
  } = useQuery<HoldingData[]>({
    queryKey: ['/api/portfolio', user.id, 'holdings'],
    staleTime: 1 * 60 * 1000,
    retry: 2
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(amount);
  };

  const getTotalHoldingsValue = () => {
    if (!holdings || holdings.length === 0) return 0;
    return holdings.reduce((sum, holding) => sum + holding.marketValue, 0);
  };

  const handleRefreshData = () => {
    Promise.all([refetchPortfolio(), refetchHoldings()])
      .then(() => {
        toast({
          title: "Data Refreshed",
          description: "Portfolio data has been updated"
        });
      })
      .catch(() => {
        toast({
          title: "Refresh Failed",
          description: "Could not refresh portfolio data",
          variant: "destructive"
        });
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Portfolio</h1>
          <p className="text-muted-foreground">
            Detailed view of your investment holdings and performance.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefreshData}
            disabled={portfolioLoading || holdingsLoading}
            data-testid="button-refresh-portfolio"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" data-testid="button-export-portfolio">
            Export
          </Button>
          <Button data-testid="button-add-holding">
            Add Holding
          </Button>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          {portfolioLoading ? (
            <Card data-testid="portfolio-value-loading">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
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
                <p className="text-sm text-muted-foreground mb-4">Unable to load portfolio data</p>
                <Button onClick={() => refetchPortfolio()} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : (
            <PortfolioValueCard 
              portfolioData={portfolioData || { totalValue: 0, dailyChange: 0, dailyChangePercent: 0, totalReturn: 0, totalReturnPercent: 0 }}
              onViewDetails={() => console.log('View portfolio analytics')}
            />
          )}
        </div>
        
        <div className="lg:col-span-2">
          <Card className="hover-elevate">
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-primary" />
                Portfolio Allocation
              </CardTitle>
              <CardDescription>
                Distribution of your investments by value
              </CardDescription>
            </CardHeader>
            <CardContent>
              {holdingsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-12 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : holdingsError ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                  <p className="text-sm text-muted-foreground mb-4">Unable to load holdings data</p>
                  <Button onClick={() => refetchHoldings()} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : !holdings || holdings.length === 0 ? (
                <div className="text-center py-8">
                  <PieChart className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground mb-4">No holdings found</p>
                  <Button data-testid="button-add-first-holding">
                    Add Your First Holding
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {holdings.map((holding) => {
                    const totalValue = getTotalHoldingsValue();
                    const percentage = totalValue > 0 ? (holding.marketValue / totalValue) * 100 : 0;
                    return (
                      <div key={holding.symbol} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge variant="secondary" className="font-mono">
                            {holding.symbol}
                          </Badge>
                          <span className="text-sm text-muted-foreground truncate">
                            {holding.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{percentage.toFixed(1)}%</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(holding.marketValue)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Holdings Table */}
      <Card className="hover-elevate">
        <CardHeader>
          <CardTitle>Holdings Details</CardTitle>
          <CardDescription>
            Complete breakdown of your portfolio positions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {holdingsLoading ? (
            <div className="p-6">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : holdingsError ? (
            <div className="text-center py-12">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
              <p className="text-sm text-muted-foreground mb-4">Unable to load holdings data</p>
              <Button onClick={() => refetchHoldings()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : !holdings || holdings.length === 0 ? (
            <div className="text-center py-12">
              <PieChart className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground mb-4">No holdings found</p>
              <Button data-testid="button-add-first-holding-table">
                Add Your First Holding
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Symbol</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Name</th>
                    <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Shares</th>
                    <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Avg Price</th>
                    <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Current Price</th>
                    <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Market Value</th>
                    <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Gain/Loss</th>
                    <th className="text-center py-3 px-4 font-medium text-sm text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding, index) => {
                    const isPositive = holding.unrealizedGain >= 0;
                    
                    return (
                      <tr 
                        key={holding.symbol}
                        className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                          index % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                        }`}
                        data-testid={`holding-row-${holding.symbol}`}
                      >
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="font-mono">
                            {holding.symbol}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {holding.name}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          {holding.shares}
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          {formatCurrency(holding.averagePrice)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          {formatCurrency(holding.currentPrice)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          {formatCurrency(holding.marketValue)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className={`flex items-center justify-end ${
                            isPositive ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {isPositive ? (
                              <TrendingUp className="h-4 w-4 mr-1" />
                            ) : (
                              <TrendingDown className="h-4 w-4 mr-1" />
                            )}
                            <div className="text-right">
                              <div className="font-medium">
                                {formatCurrency(Math.abs(holding.unrealizedGain))}
                              </div>
                              <div className="text-xs">
                                ({Math.abs(holding.unrealizedGainPercent).toFixed(2)}%)
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex gap-1 justify-center">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => console.log('Buy more', holding.symbol)}
                              data-testid={`button-buy-${holding.symbol}`}
                            >
                              Buy
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => console.log('Sell', holding.symbol)}
                              data-testid={`button-sell-${holding.symbol}`}
                            >
                              Sell
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}