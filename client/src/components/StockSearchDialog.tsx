import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Plus, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SearchResult {
  symbol: string;
  name: string;
}

interface StockSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StockSearchDialog({ open, onOpenChange }: StockSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Search stocks query - only run if search query is at least 2 chars
  const { 
    data: searchResults, 
    isLoading: isSearching, 
    error: searchError 
  } = useQuery<{ results: SearchResult[] }>({
    queryKey: ['/api/stocks/search', searchQuery],
    enabled: searchQuery.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1
  });

  // Add stock to watchlist mutation
  const addStockMutation = useMutation({
    mutationFn: async (symbol: string) => {
      return apiRequest('POST', `/api/stocks/${symbol}/add-to-watchlist`);
    },
    onSuccess: (data, symbol) => {
      toast({
        title: "Stock Added",
        description: `${symbol} has been added to your watchlist`
      });
      
      // Invalidate stocks query to refresh the watchlist
      queryClient.invalidateQueries({ queryKey: ['/api/stocks'] });
      
      // Close dialog
      onOpenChange(false);
      setSearchQuery("");
    },
    onError: (error: any, symbol) => {
      toast({
        title: "Failed to Add Stock",
        description: error.message || `Could not add ${symbol} to watchlist`,
        variant: "destructive"
      });
    }
  });

  const handleAddStock = (symbol: string) => {
    addStockMutation.mutate(symbol);
  };

  const handleInputChange = (value: string) => {
    setSearchQuery(value.toUpperCase());
  };

  const handleDialogClose = () => {
    onOpenChange(false);
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Stock to Watchlist</DialogTitle>
          <DialogDescription>
            Search for stocks by symbol or company name to add them to your watchlist.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search stocks (e.g., AAPL, Tesla, Microsoft)..."
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              className="pl-9"
              data-testid="input-stock-search"
            />
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-hidden">
            {searchQuery.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Start typing to search for stocks</p>
              </div>
            )}

            {searchQuery.length > 0 && searchQuery.length < 2 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Type at least 2 characters to search</p>
              </div>
            )}

            {searchQuery.length >= 2 && (
              <div className="space-y-3 overflow-y-auto max-h-96">
                {isSearching ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                          <Skeleton className="h-8 w-16" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : searchError ? (
                  <div className="text-center py-8">
                    <p className="text-destructive mb-2">Failed to search stocks</p>
                    <p className="text-sm text-muted-foreground">
                      Please try again with a different search term
                    </p>
                  </div>
                ) : searchResults?.results.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No stocks found for "{searchQuery}"</p>
                    <p className="text-sm">Try a different search term</p>
                  </div>
                ) : (
                  searchResults?.results.map((stock) => (
                    <Card key={stock.symbol} className="hover-elevate">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="font-mono text-sm">
                                {stock.symbol}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {stock.name}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddStock(stock.symbol)}
                            disabled={addStockMutation.isPending}
                            data-testid={`button-add-${stock.symbol}`}
                          >
                            {addStockMutation.isPending && 
                             addStockMutation.variables === stock.symbol ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4 mr-2" />
                            )}
                            Add
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}