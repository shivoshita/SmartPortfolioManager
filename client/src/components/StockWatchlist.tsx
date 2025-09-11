import { useState } from "react";
import { TrendingUp, TrendingDown, Volume2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StockSearchDialog from "./StockSearchDialog";
import type { StockData } from "@shared/schema";

interface StockWatchlistProps {
  stocks: StockData[];
  onStockClick?: (symbol: string) => void;
  onRefresh?: () => void;
}

export default function StockWatchlist({ stocks, onStockClick, onRefresh }: StockWatchlistProps) {
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  
  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toString();
  };

  return (
    <Card className="hover-elevate">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Volume2 className="h-5 w-5 mr-2 text-primary" />
              Stock Watchlist
            </CardTitle>
            <CardDescription>
              Track your favorite stocks in real-time
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {onRefresh && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefresh}
                data-testid="button-refresh-stocks"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSearchDialogOpen(true)}
              data-testid="button-add-stock"
            >
              Add Stock
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Symbol</th>
                <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Company</th>
                <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Price</th>
                <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Change</th>
                <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Volume</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock, index) => {
                const changeAmount = stock.currentPrice - stock.previousClose;
                const isPositive = changeAmount >= 0;
                
                return (
                  <tr 
                    key={stock.symbol} 
                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer ${
                      index % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                    }`}
                    onClick={() => onStockClick?.(stock.symbol)}
                    data-testid={`stock-row-${stock.symbol}`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground">{stock.symbol}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {stock.name}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium" data-testid={`price-${stock.symbol}`}>
                      {formatPrice(stock.currentPrice)}
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
                        <span className="font-medium" data-testid={`change-${stock.symbol}`}>
                          {formatPrice(Math.abs(changeAmount))} ({Math.abs(stock.changePercent)}%)
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                      {formatVolume(stock.volume)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
      
      <StockSearchDialog 
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
      />
    </Card>
  );
}