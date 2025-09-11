import { TrendingUp, TrendingDown, Wallet, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PortfolioData } from "@shared/schema";

interface PortfolioValueCardProps {
  portfolioData: PortfolioData;
  onViewDetails?: () => void;
}

export default function PortfolioValueCard({ portfolioData, onViewDetails }: PortfolioValueCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(amount);
  };

  const isDailyPositive = portfolioData.dailyChange >= 0;
  const isTotalPositive = portfolioData.totalReturn >= 0;

  return (
    <Card className="hover-elevate">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Wallet className="h-5 w-5 mr-2 text-primary" />
              Portfolio Value
            </CardTitle>
            <CardDescription>
              Your total investment performance
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onViewDetails} data-testid="button-view-details">
            View Details
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Portfolio Value */}
        <div className="text-center">
          <div className="text-3xl font-bold text-foreground mb-1" data-testid="text-total-value">
            {formatCurrency(portfolioData.totalValue)}
          </div>
          <div className="text-sm text-muted-foreground">
            Total Portfolio Value
          </div>
        </div>

        {/* Daily Performance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Today's Change</span>
              {isDailyPositive ? (
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className={`text-lg font-semibold ${
              isDailyPositive ? 'text-emerald-600' : 'text-red-600'
            }`} data-testid="text-daily-change">
              {formatCurrency(Math.abs(portfolioData.dailyChange))}
            </div>
            <div className={`text-sm ${
              isDailyPositive ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {isDailyPositive ? '+' : '-'}{Math.abs(portfolioData.dailyChangePercent).toFixed(2)}%
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Total Return</span>
              <DollarSign className={`h-4 w-4 ${
                isTotalPositive ? 'text-emerald-600' : 'text-red-600'
              }`} />
            </div>
            <div className={`text-lg font-semibold ${
              isTotalPositive ? 'text-emerald-600' : 'text-red-600'
            }`} data-testid="text-total-return">
              {formatCurrency(Math.abs(portfolioData.totalReturn))}
            </div>
            <div className={`text-sm ${
              isTotalPositive ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {isTotalPositive ? '+' : '-'}{Math.abs(portfolioData.totalReturnPercent).toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button className="flex-1" size="sm" data-testid="button-buy-stock">
            Buy Stock
          </Button>
          <Button variant="outline" className="flex-1" size="sm" data-testid="button-sell-stock">
            Sell Stock
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}