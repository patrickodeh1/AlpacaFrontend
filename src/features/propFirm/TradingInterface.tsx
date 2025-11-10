import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, DollarSign, Target, Shield, Search, Star } from 'lucide-react';
import { useAppSelector } from 'src/app/hooks';
import {
  useGetPaperTradesQuery,
  useCreatePaperTradeMutation,
  useClosePaperTradeMutation,
} from 'src/features/paperTrading/paperTradingApi';

interface TradingInterfaceProps {
  account: any;
}

const TradingInterface: React.FC<TradingInterfaceProps> = ({ account }) => {
  const [searchSymbol, setSearchSymbol] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [quantity, setQuantity] = useState('1');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [notes, setNotes] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showWatchlist, setShowWatchlist] = useState(true);

  // Get auth token from Redux store
  const accessToken = useAppSelector((state) => state.auth.access);

  // Fetch ALL trades
  const { data: trades, refetch: refetchTrades } = useGetPaperTradesQuery(
    {},
    { pollingInterval: 5000 }
  );

  const [createTrade, { isLoading: isPlacingTrade }] = useCreatePaperTradeMutation();
  const [closeTrade, { isLoading: isClosingTrade }] = useClosePaperTradeMutation();

  const openTrades = trades?.filter((t: any) => t.status === 'OPEN') || [];
  const recentTrades = trades?.slice(0, 10) || [];

  // Parse account fields
  const currentBalance = Number(account?.current_balance) || 0;
  const startingBalance = Number(account?.starting_balance) || 0;
  const profitTarget = Number(account?.plan_details?.profit_target) || 0;
  const maxDailyLoss = Number(account?.plan_details?.max_daily_loss) || 0;
  const maxPositionSize = Number(account?.plan_details?.max_position_size) || 1.0;

  const pnl = currentBalance - startingBalance;
  const pnlPercent = startingBalance ? (pnl / startingBalance) * 100 : 0;

  // Fetch watchlist
  const [watchlistAssets, setWatchlistAssets] = useState<any[]>([]);

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!accessToken) return;

      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');

        const response = await fetch(`${baseUrl}/api/core/watchlist/`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          // Extract assets from watchlist items
          const assets = data.results?.map((item: any) => item.asset).filter(Boolean) || [];
          setWatchlistAssets(assets);
        }
      } catch (error) {
        console.error('Watchlist fetch error:', error);
      }
    };

    fetchWatchlist();
  }, [accessToken]);

  // Search for assets
  const handleSearch = async () => {
    if (!searchSymbol || searchSymbol.length < 2) {
      setSearchResults([]);
      setShowWatchlist(true);
      return;
    }

    if (!accessToken) {
      toast.error('Please log in to search assets');
      return;
    }

    setIsSearching(true);
    setShowWatchlist(false);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');

      const response = await fetch(
        `${baseUrl}/api/core/assets/?search=${encodeURIComponent(searchSymbol)}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search assets');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchSymbol) {
        handleSearch();
      } else {
        setSearchResults([]);
        setShowWatchlist(true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchSymbol]);

  // Fetch current price for selected asset
  useEffect(() => {
    if (!selectedAsset?.id || !accessToken) return;

    const fetchPrice = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');

        const response = await fetch(
          `${baseUrl}/api/core/assets/${selectedAsset.id}/candles_v2/?tf=1&limit=1`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }
        );

        if (!response.ok) return;

        const data = await response.json();
        if (data.candles && data.candles.length > 0) {
          setCurrentPrice(data.candles[0].close);
        }
      } catch (error) {
        console.error('Price fetch error:', error);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 2000);
    return () => clearInterval(interval);
  }, [selectedAsset?.id, accessToken]);

  // Calculate max quantity based on position size limit
  const maxQuantity = currentPrice && currentBalance > 0
    ? (currentBalance * (maxPositionSize / 100)) / currentPrice
    : 0;

  const positionValue = currentPrice && Number(quantity) > 0
    ? currentPrice * Number(quantity)
    : 0;

  const handleSelectAsset = (asset: any) => {
    setSelectedAsset(asset);
    setSearchSymbol(asset.symbol);
    setSearchResults([]);
    setShowWatchlist(false);
  };

  const handlePlaceTrade = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAsset) {
      toast.error('Please select an asset');
      return;
    }

    if (!currentPrice) {
      toast.error('Unable to fetch current price');
      return;
    }

    if (Number(quantity) <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    try {
      const payload: any = {
        asset: selectedAsset.id,
        direction,
        quantity,
        entry_price: currentPrice.toFixed(2),
        notes: notes || '',
      };

      if (stopLoss) {
        payload.stop_loss = stopLoss;
      }

      if (takeProfit) {
        payload.take_profit = takeProfit;
      }

      await createTrade(payload).unwrap();

      toast.success('Trade placed successfully');

      // Reset form
      setQuantity('1');
      setStopLoss('');
      setTakeProfit('');
      setNotes('');
      refetchTrades();
    } catch (error: any) {
      const errorMsg = error?.data?.msg || error?.data?.error || 'Failed to place trade';
      toast.error(errorMsg);
    }
  };

  const handleCloseTrade = async (trade: any) => {
    // Fetch current price for this specific asset
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');

      const response = await fetch(
        `${baseUrl}/api/core/assets/${trade.asset}/candles_v2/?tf=1&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        toast.error('Unable to fetch current price');
        return;
      }

      const data = await response.json();
      const exitPrice = data.candles?.[0]?.close;

      if (!exitPrice) {
        toast.error('Unable to determine exit price');
        return;
      }

      await closeTrade({
        id: trade.id,
        exit_price: exitPrice.toFixed(2),
      }).unwrap();

      toast.success('Trade closed successfully');
      refetchTrades();
    } catch (error: any) {
      const errorMsg = error?.data?.msg || 'Failed to close trade';
      toast.error(errorMsg);
    }
  };

  if (!account || !account.id) {
    return <p className="text-center text-muted-foreground">Loading account details...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Account Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className="text-2xl font-bold">${currentBalance.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className={`w-8 h-8 ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              <div>
                <p className="text-sm text-muted-foreground">P&L</p>
                <p className={`text-2xl font-bold ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ${pnl.toFixed(2)} ({pnlPercent.toFixed(2)}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Profit Target</p>
                <p className="text-2xl font-bold">${profitTarget.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Max Loss</p>
                <p className="text-2xl font-bold">${maxDailyLoss.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Entry */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Place Order</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePlaceTrade} className="space-y-4">
              {/* Asset Search */}
              <div className="relative">
                <Label>Symbol</Label>
                <div className="relative">
                  <Input
                    value={searchSymbol}
                    onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
                    placeholder="Search or select from watchlist..."
                  />
                  <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>

                {/* Watchlist or Search Results Dropdown */}
                {(showWatchlist ? watchlistAssets.length > 0 : searchResults.length > 0) && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {showWatchlist && (
                      <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Watchlist
                      </div>
                    )}
                    {(showWatchlist ? watchlistAssets : searchResults).map((asset: any) => (
                      <div
                        key={asset.id}
                        onClick={() => handleSelectAsset(asset)}
                        className="px-4 py-2 hover:bg-muted cursor-pointer"
                      >
                        <div className="font-medium">{asset.symbol}</div>
                        <div className="text-sm text-muted-foreground truncate">{asset.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedAsset && (
                <>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{selectedAsset.symbol}</span>
                      {currentPrice && (
                        <Badge variant="outline">
                          ${currentPrice.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Direction */}
                  <div>
                    <Label>Direction</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button
                        type="button"
                        variant={direction === 'LONG' ? 'default' : 'outline'}
                        onClick={() => setDirection('LONG')}
                        className="w-full"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Long
                      </Button>
                      <Button
                        type="button"
                        variant={direction === 'SHORT' ? 'default' : 'outline'}
                        onClick={() => setDirection('SHORT')}
                        className="w-full"
                      >
                        <TrendingDown className="w-4 h-4 mr-2" />
                        Short
                      </Button>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      min="0.0001"
                      step="0.0001"
                      required
                    />
                    {currentPrice && maxQuantity > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Max: {maxQuantity.toFixed(4)} ({maxPositionSize}% of balance)
                        <br />
                        Position value: ${positionValue.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Stop Loss */}
                  <div>
                    <Label>Stop Loss (Optional)</Label>
                    <Input
                      type="number"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>

                  {/* Take Profit */}
                  <div>
                    <Label>Take Profit (Optional)</Label>
                    <Input
                      type="number"
                      value={takeProfit}
                      onChange={(e) => setTakeProfit(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <Label>Notes (Optional)</Label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Trade rationale..."
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isPlacingTrade || !currentPrice}
                  >
                    {isPlacingTrade ? 'Placing...' : 'Place Order'}
                  </Button>
                </>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Open Positions & Recent Trades */}
        <Card className="lg:col-span-2">
          <Tabs defaultValue="open">
            <CardHeader>
              <TabsList>
                <TabsTrigger value="open">
                  Open Positions ({openTrades.length})
                </TabsTrigger>
                <TabsTrigger value="recent">Recent Trades</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="open" className="space-y-2">
                {openTrades.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    No open positions
                  </p>
                ) : (
                  openTrades.map((trade: any) => {
                    const unrealizedPL = Number(trade.unrealized_pl || 0);
                    const entryPrice = Number(trade.entry_price || 0);
                    const entryCost = Number(trade.entry_cost || 0);
                    const currentValue = Number(trade.current_value || 0);
                    
                    return (
                      <div
                        key={trade.id}
                        className="p-4 border rounded-lg space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{trade.asset_symbol}</span>
                            <Badge
                              variant={
                                trade.direction === 'LONG' ? 'default' : 'destructive'
                              }
                            >
                              {trade.direction}
                            </Badge>
                            <Badge variant="outline">{trade.status}</Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCloseTrade(trade)}
                            disabled={isClosingTrade}
                          >
                            {isClosingTrade ? 'Closing...' : 'Close'}
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Quantity:</span>
                            <span className="ml-2 font-medium">{trade.quantity}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Entry:</span>
                            <span className="ml-2 font-medium">${entryPrice.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Entry Cost:</span>
                            <span className="ml-2 font-medium">${entryCost.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Current Value:</span>
                            <span className="ml-2 font-medium">${currentValue.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Unrealized P&L:</span>
                            <span
                              className={`text-lg font-bold ${
                                unrealizedPL >= 0 ? 'text-green-500' : 'text-red-500'
                              }`}
                            >
                              ${unrealizedPL.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {(trade.stop_loss || trade.take_profit) && (
                          <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t">
                            {trade.stop_loss && (
                              <div>
                                <span>SL: </span>
                                <span className="font-medium">${Number(trade.stop_loss).toFixed(2)}</span>
                              </div>
                            )}
                            {trade.take_profit && (
                              <div>
                                <span>TP: </span>
                                <span className="font-medium">${Number(trade.take_profit).toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {trade.notes && (
                          <div className="text-sm text-muted-foreground pt-2 border-t">
                            {trade.notes}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </TabsContent>

              <TabsContent value="recent" className="space-y-2">
                {recentTrades.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    No trades yet
                  </p>
                ) : (
                  recentTrades.map((trade: any) => {
                    const realizedPL = Number(trade.realized_pl || 0);
                    return (
                      <div
                        key={trade.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{trade.asset_symbol}</span>
                            <Badge
                              variant={
                                trade.direction === 'LONG' ? 'default' : 'destructive'
                              }
                            >
                              {trade.direction}
                            </Badge>
                            <Badge variant="outline">{trade.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {trade.quantity} @ ${Number(trade.entry_price).toFixed(2)}
                          </p>
                        </div>
                        {trade.status === 'CLOSED' && (
                          <p
                            className={`font-bold ${
                              realizedPL >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}
                          >
                            ${realizedPL.toFixed(2)}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default TradingInterface;