import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, Target, Activity, AlertCircle, RefreshCw } from "lucide-react";
import PortfolioChart from "@/components/PortfolioChart";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { computeSectorAllocation } from "@/utils/sectorClassification";
import type { PortfolioHistory, HoldingData } from "@shared/schema";

export default function Analytics() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  if (!user) {
    return null; // ProtectedRoute will handle redirect
  }
  
  // Fetch portfolio history for performance analysis
  const { 
    data: portfolioHistory, 
    isLoading: historyLoading, 
    error: historyError,
    refetch: refetchHistory 
  } = useQuery<PortfolioHistory[]>({
    queryKey: ['/api/portfolio', user.id, 'history'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Fetch holdings for sector allocation analysis
  const { 
    data: holdings, 
    isLoading: holdingsLoading, 
    error: holdingsError,
    refetch: refetchHoldings 
  } = useQuery<HoldingData[]>({
    queryKey: ['/api/portfolio', user.id, 'holdings'],
    staleTime: 2 * 60 * 1000,
    retry: 2
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Process portfolio history data for performance charts
  const performanceData = portfolioHistory && portfolioHistory.length > 0 
    ? portfolioHistory.map((entry) => {
        const portfolioValue = parseFloat(entry.totalValue);
        return {
          date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          portfolio: portfolioValue
          // Note: Benchmark data (S&P 500, NASDAQ) would be integrated from real APIs in production
        };
      })
    : [];

  // Calculate monthly returns from portfolio history
  const monthlyReturns = portfolioHistory && portfolioHistory.length > 1
    ? portfolioHistory.slice(1).map((entry, index) => {
        const prevEntry = portfolioHistory[index];
        const currentValue = parseFloat(entry.totalValue);
        const prevValue = parseFloat(prevEntry.totalValue);
        const returnPercent = prevValue > 0 ? ((currentValue - prevValue) / prevValue) * 100 : 0;
        
        return {
          month: new Date(entry.date).toLocaleDateString('en-US', { month: 'short' }),
          return: returnPercent
        };
      })
    : [];

  // Calculate sector allocation from holdings
  const sectorAllocation = holdings && holdings.length > 0
    ? computeSectorAllocation(holdings.map(holding => ({
        symbol: holding.symbol,
        marketValue: holding.marketValue
      })))
    : [];

  // Calculate risk metrics from portfolio history
  // Note: In production, these would be computed from actual historical data
  const riskMetrics = [
    { metric: 'Volatility (1Y)', value: 'N/A', status: 'Unknown' },
    { metric: 'Sharpe Ratio', value: 'N/A', status: 'Unknown' },
    { metric: 'Max Drawdown', value: 'N/A', status: 'Unknown' },
    { metric: 'Beta', value: 'N/A', status: 'Unknown' }
  ];

  const handleRefreshData = () => {
    Promise.all([refetchHistory(), refetchHoldings()])
      .then(() => {
        toast({
          title: "Analytics Refreshed",
          description: "Portfolio analytics data has been updated"
        });
      })
      .catch(() => {
        toast({
          title: "Refresh Failed",
          description: "Could not refresh analytics data",
          variant: "destructive"
        });
      });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-popover-border rounded-lg p-3 shadow-md">
          <p className="font-medium text-popover-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {typeof entry.value === 'number' && entry.value > 1000 
                ? formatCurrency(entry.value) 
                : formatPercent(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Deep insights into your portfolio performance and risk metrics.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefreshData}
            disabled={historyLoading || holdingsLoading}
            data-testid="button-refresh-analytics"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" data-testid="button-export-report">
            Export Report
          </Button>
          <Button data-testid="button-schedule-report">
            Schedule Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {historyLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="hover-elevate">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : historyError ? (
          <div className="col-span-4 text-center py-8">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
            <p className="text-sm text-muted-foreground mb-4">Unable to load risk metrics</p>
            <Button onClick={() => refetchHistory()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : (
          riskMetrics.map((metric) => (
            <Card key={metric.metric} className="hover-elevate">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.metric}</p>
                    <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                  </div>
                  <Badge variant={
                    metric.status === 'Good' ? 'default' : 
                    metric.status === 'Medium' || metric.status === 'Stable' ? 'secondary' : 
                    'outline'
                  }>
                    {metric.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Performance vs Benchmarks */}
      <Card className="hover-elevate">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                Portfolio Performance
              </CardTitle>
              <CardDescription>
                Track your portfolio performance over time
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" data-testid="button-1m-perf">1M</Button>
              <Button variant="outline" size="sm" data-testid="button-3m-perf">3M</Button>
              <Button variant="secondary" size="sm" data-testid="button-1y-perf">1Y</Button>
              <Button variant="outline" size="sm" data-testid="button-all-perf">All</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="h-80 w-full flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading performance data...</p>
              </div>
            </div>
          ) : historyError ? (
            <div className="h-80 w-full flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                <p className="text-sm text-muted-foreground mb-4">Unable to load performance data</p>
                <Button onClick={() => refetchHistory()} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="portfolio" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    name="Your Portfolio"
                  />
                  {/* Benchmark lines would be added here when real data is available */}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sector Allocation and Monthly Returns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-primary" />
              Sector Allocation
            </CardTitle>
            <CardDescription>
              Distribution of investments across sectors
            </CardDescription>
          </CardHeader>
          <CardContent>
            {holdingsLoading ? (
              <div className="h-64 w-full flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading sector allocation...</p>
                </div>
              </div>
            ) : holdingsError ? (
              <div className="h-64 w-full flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                  <p className="text-sm text-muted-foreground mb-4">Unable to load sector data</p>
                  <Button onClick={() => refetchHoldings()} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            ) : sectorAllocation.length === 0 ? (
              <div className="h-64 w-full flex items-center justify-center">
                <div className="text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No holdings data available</p>
                  <p className="text-xs text-muted-foreground mt-2">Add stocks to your portfolio to see sector allocation</p>
                </div>
              </div>
            ) : (
              <>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sectorAllocation}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {sectorAllocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {sectorAllocation.map((sector) => (
                    <div key={sector.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: sector.color }}
                        />
                        <span>{sector.name}</span>
                      </div>
                      <span className="font-medium">{sector.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-primary" />
              Monthly Returns
            </CardTitle>
            <CardDescription>
              Month-by-month performance breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="h-64 w-full flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading returns data...</p>
                </div>
              </div>
            ) : historyError ? (
              <div className="h-64 w-full flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                  <p className="text-sm text-muted-foreground mb-4">Unable to load returns data</p>
                  <Button onClick={() => refetchHistory()} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyReturns} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={formatPercent}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="return" 
                      fill="hsl(var(--primary))" 
                      radius={[2, 2, 0, 0]}
                      name="Monthly Return"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}