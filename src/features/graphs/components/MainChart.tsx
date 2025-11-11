/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  createChart,
  IChartApi,
  SeriesType,
  ISeriesApi,
  ITimeScaleApi,
  Time,
  BarData,
  LineData,
  HistogramData,
  MouseEventParams,
  LineSeries,
  IPriceLine,
  SeriesMarker,
} from 'lightweight-charts';

import { useAppSelector } from 'src/app/hooks';
import { selectAutoRefresh, selectChartType } from '../graphSlice';
import { getBaseChartOptions } from '../lib/chartOptions';
import { createSeriesForType } from '../lib/createSeries';
import { useResizeObserver } from '../hooks/useResizeObserver';
import { useIsMobile } from '@/hooks/useMobile';

interface Trade {
  id: number;
  direction: 'LONG' | 'SHORT';
  entry_price: number;
  stop_loss?: number;
  take_profit?: number;
  quantity: number;
  asset_symbol: string;
  status: 'OPEN' | 'CLOSED';
  unrealized_pl?: number;
  entry_time?: string;
}

interface MainChartProps {
  seriesData: (BarData | LineData | HistogramData)[];
  mode: boolean;
  setTimeScale: (timeScale: ITimeScaleApi<Time>) => void;
  emaData: LineData[];
  bollingerBandsData: {
    time: Time;
    upper: number;
    middle: number;
    lower: number;
  }[];
  onLoadMoreData: () => void;
  isLoadingMore: boolean;
  hasMoreData: boolean;
  
  // Trade management props
  openTrades?: Trade[];
  onUpdateTrade?: (tradeId: number, updates: { stop_loss?: number; take_profit?: number }) => void;
  onCloseTrade?: (tradeId: number, exitPrice: number) => void;
}

// Helper function to safely convert to number
const toNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  return 0;
};

const MainChart: React.FC<MainChartProps> = ({
  seriesData,
  mode,
  setTimeScale,
  emaData,
  bollingerBandsData,
  onLoadMoreData,
  isLoadingMore,
  hasMoreData,
  openTrades = [],
  onUpdateTrade,
  onCloseTrade,
}) => {
  const chartType = useAppSelector(selectChartType);
  const autoRefresh = useAppSelector(selectAutoRefresh);
  const isMobile = useIsMobile();
  const mainChartContainerRef = useRef<HTMLDivElement | null>(null);
  const mainChartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bollingerBandsSeriesRefs = useRef<{
    upper: ISeriesApi<'Line'> | null;
    middle: ISeriesApi<'Line'> | null;
    lower: ISeriesApi<'Line'> | null;
  }>({
    upper: null,
    middle: null,
    lower: null,
  });
  const prevChartTypeRef = useRef<SeriesType>(chartType);
  const legendContainerRef = useRef<HTMLDivElement | null>(null);
  const loadingIndicatorRef = useRef<HTMLDivElement | null>(null);
  const onLoadMoreDataRef = useRef(onLoadMoreData);

  // Track price lines for trades - keep reference stable
  const tradePriceLinesRef = useRef<Map<number, {
    entry: IPriceLine;
    stopLoss?: IPriceLine;
    takeProfit?: IPriceLine;
  }>>(new Map());

  // Track currently dragging price line
  const [draggingLine, setDraggingLine] = useState<{
    tradeId: number;
    type: 'stopLoss' | 'takeProfit';
    originalPrice: number;
  } | null>(null);

  useEffect(() => {
    onLoadMoreDataRef.current = onLoadMoreData;
  }, [onLoadMoreData]);

  const createSeries = useCallback(
    (chart: IChartApi, type: SeriesType): ISeriesApi<SeriesType> =>
      createSeriesForType(chart, type, mode, seriesData as any),
    [mode, seriesData]
  );

  // Create trade markers for entry points
  const createTradeMarkers = useCallback((trades: Trade[]): SeriesMarker<Time>[] => {
    return trades
      .filter(trade => trade.entry_time)
      .map(trade => {
        const entryTime = new Date(trade.entry_time!).getTime() / 1000;
        const entryPrice = toNumber(trade.entry_price);
        
        return {
          time: entryTime as Time,
          position: trade.direction === 'LONG' ? 'belowBar' : 'aboveBar',
          color: trade.direction === 'LONG' ? '#22c55e' : '#ef4444',
          shape: trade.direction === 'LONG' ? 'arrowUp' : 'arrowDown',
          text: `${trade.direction} ${trade.quantity} @ $${entryPrice.toFixed(2)}`,
        } as SeriesMarker<Time>;
      });
  }, []);

  // Clear all price lines
  const clearAllPriceLines = useCallback(() => {
    if (!seriesRef.current) return;
    
    tradePriceLinesRef.current.forEach((lines) => {
      try {
        seriesRef.current?.removePriceLine(lines.entry);
        if (lines.stopLoss) seriesRef.current?.removePriceLine(lines.stopLoss);
        if (lines.takeProfit) seriesRef.current?.removePriceLine(lines.takeProfit);
      } catch (error) {
        // Line may already be removed
        console.debug('Price line removal error:', error);
      }
    });
    tradePriceLinesRef.current.clear();
  }, []);

  // Update price lines for open trades - FIXED: More stable updates
  const updateTradePriceLines = useCallback(() => {
    if (!seriesRef.current || !mainChartRef.current) return;

    // Create a set of current trade IDs
    const currentTradeIds = new Set(openTrades.map(t => t.id));
    
    // Remove price lines for trades that are no longer open
    const tradesToRemove: number[] = [];
    tradePriceLinesRef.current.forEach((lines, tradeId) => {
      if (!currentTradeIds.has(tradeId)) {
        tradesToRemove.push(tradeId);
      }
    });

    tradesToRemove.forEach(tradeId => {
      const lines = tradePriceLinesRef.current.get(tradeId);
      if (lines) {
        try {
          seriesRef.current?.removePriceLine(lines.entry);
          if (lines.stopLoss) seriesRef.current?.removePriceLine(lines.stopLoss);
          if (lines.takeProfit) seriesRef.current?.removePriceLine(lines.takeProfit);
        } catch (error) {
          console.debug('Error removing price line:', error);
        }
        tradePriceLinesRef.current.delete(tradeId);
      }
    });

    // Add or update price lines for open trades
    openTrades.forEach(trade => {
      const existing = tradePriceLinesRef.current.get(trade.id);
      
      // Convert prices safely
      const entryPrice = toNumber(trade.entry_price);
      const stopLossPrice = trade.stop_loss ? toNumber(trade.stop_loss) : null;
      const takeProfitPrice = trade.take_profit ? toNumber(trade.take_profit) : null;
      
      if (!existing) {
        // Create new price lines
        try {
          const entryLine = seriesRef.current!.createPriceLine({
            price: entryPrice,
            color: trade.direction === 'LONG' ? '#22c55e' : '#ef4444',
            lineWidth: 2,
            lineStyle: 0, // Solid
            axisLabelVisible: true,
            title: `Entry: ${trade.asset_symbol} ${trade.direction}`,
          });

          const lines: any = { entry: entryLine };

          if (stopLossPrice !== null) {
            lines.stopLoss = seriesRef.current!.createPriceLine({
              price: stopLossPrice,
              color: '#ef4444',
              lineWidth: 2,
              lineStyle: 2, // Dashed
              axisLabelVisible: true,
              title: `SL: $${stopLossPrice.toFixed(2)}`,
            });
          }

          if (takeProfitPrice !== null) {
            lines.takeProfit = seriesRef.current!.createPriceLine({
              price: takeProfitPrice,
              color: '#22c55e',
              lineWidth: 2,
              lineStyle: 2, // Dashed
              axisLabelVisible: true,
              title: `TP: $${takeProfitPrice.toFixed(2)}`,
            });
          }

          tradePriceLinesRef.current.set(trade.id, lines);
        } catch (error) {
          console.error('Error creating price lines:', error);
        }
      } else {
        // Update existing price lines only if values changed
        try {
          // Update or create stop loss
          if (stopLossPrice !== null) {
            const currentSL = trade.stop_loss ? toNumber(trade.stop_loss) : null;
            const existingSL = existing.stopLoss;
            
            if (!existingSL) {
              existing.stopLoss = seriesRef.current!.createPriceLine({
                price: stopLossPrice,
                color: '#ef4444',
                lineWidth: 2,
                lineStyle: 2,
                axisLabelVisible: true,
                title: `SL: $${stopLossPrice.toFixed(2)}`,
              });
            } else {
              existing.stopLoss.applyOptions({ 
                price: stopLossPrice,
                title: `SL: $${stopLossPrice.toFixed(2)}`,
              });
            }
          } else if (existing.stopLoss) {
            seriesRef.current!.removePriceLine(existing.stopLoss);
            existing.stopLoss = undefined;
          }

          // Update or create take profit
          if (takeProfitPrice !== null) {
            if (!existing.takeProfit) {
              existing.takeProfit = seriesRef.current!.createPriceLine({
                price: takeProfitPrice,
                color: '#22c55e',
                lineWidth: 2,
                lineStyle: 2,
                axisLabelVisible: true,
                title: `TP: $${takeProfitPrice.toFixed(2)}`,
              });
            } else {
              existing.takeProfit.applyOptions({ 
                price: takeProfitPrice,
                title: `TP: $${takeProfitPrice.toFixed(2)}`,
              });
            }
          } else if (existing.takeProfit) {
            seriesRef.current!.removePriceLine(existing.takeProfit);
            existing.takeProfit = undefined;
          }
        } catch (error) {
          console.error('Error updating price lines:', error);
        }
      }
    });
  }, [openTrades]);

  // Handle price line click detection
  const handleChartClick = useCallback((param: MouseEventParams<Time>) => {
    if (!param.point || !onUpdateTrade) return;
    
    const price = seriesRef.current?.coordinateToPrice(param.point.y);
    if (!price) return;

    const priceScale = seriesRef.current?.priceScale();
    const visibleRange = priceScale?.getVisibleRange();
    const tolerance = visibleRange 
      ? Math.abs(visibleRange.from - visibleRange.to) * 0.01
      : 0.5;
    
    openTrades.forEach(trade => {
      const stopLossPrice = trade.stop_loss ? toNumber(trade.stop_loss) : null;
      const takeProfitPrice = trade.take_profit ? toNumber(trade.take_profit) : null;
      
      if (stopLossPrice !== null && Math.abs(price - stopLossPrice) < tolerance) {
        setDraggingLine({
          tradeId: trade.id,
          type: 'stopLoss',
          originalPrice: stopLossPrice,
        });
      } else if (takeProfitPrice !== null && Math.abs(price - takeProfitPrice) < tolerance) {
        setDraggingLine({
          tradeId: trade.id,
          type: 'takeProfit',
          originalPrice: takeProfitPrice,
        });
      }
    });
  }, [openTrades, onUpdateTrade]);

  // Initialize chart only once
  const initializeChart = useCallback(() => {
    if (!mainChartContainerRef.current || mainChartRef.current) return;

    mainChartContainerRef.current.innerHTML = '';

    const chart = createChart(
      mainChartContainerRef.current,
      getBaseChartOptions(mode)
    );

    mainChartRef.current = chart;
    setTimeScale(chart.timeScale());

    const rect = mainChartContainerRef.current.getBoundingClientRect();
    chart.applyOptions({ width: rect.width, height: rect.height });

    // Create legend
    const legendContainer = document.createElement('div');
    legendContainer.className =
      'absolute px-2 py-1 border rounded-lg shadow-lg top-2 left-2 bg-card/95 backdrop-blur-xl border-border/40';

    mainChartContainerRef.current.appendChild(legendContainer);
    legendContainerRef.current = legendContainer;

    const priceSection = document.createElement('div');
    priceSection.className = 'flex items-center gap-2 text-xs font-bold';
    legendContainer.appendChild(priceSection);

    const updateLegend = (data: any | null) => {
      if (!priceSection) return;

      if (data) {
        priceSection.innerHTML = '';
        if (
          (chartType === 'Candlestick' || chartType === 'Bar') &&
          'open' in data
        ) {
          const { open, high, low, close } = data as BarData;

          if (isMobile) {
            const priceItems = [
              { label: 'O', value: open.toFixed(2), color: '#3B82F6' },
              { label: 'H', value: high.toFixed(2), color: '#10B981' },
              { label: 'L', value: low.toFixed(2), color: '#EF4444' },
              { label: 'C', value: close.toFixed(2), color: '#F59E0B' },
            ];

            priceItems.forEach(({ label, value, color }) => {
              const item = document.createElement('div');
              item.className = 'flex items-center gap-0.5';

              const labelSpan = document.createElement('span');
              labelSpan.className = 'text-xs font-bold tracking-wide uppercase';
              labelSpan.style.color = color;
              labelSpan.textContent = label;

              const valueSpan = document.createElement('span');
              valueSpan.className = 'text-xs font-bold';
              valueSpan.style.color = color;
              valueSpan.textContent = value;

              item.appendChild(labelSpan);
              item.appendChild(valueSpan);
              priceSection.appendChild(item);
            });
          } else {
            const priceItems = [
              { label: 'O', value: open.toFixed(2) },
              { label: 'H', value: high.toFixed(2) },
              { label: 'L', value: low.toFixed(2) },
              { label: 'C', value: close.toFixed(2) },
            ];

            priceItems.forEach(({ label, value }) => {
              const item = document.createElement('div');
              item.className = 'flex items-center gap-1';

              const labelSpan = document.createElement('span');
              labelSpan.className =
                'font-bold tracking-wide uppercase text-muted-foreground';
              labelSpan.textContent = label;

              const valueSpan = document.createElement('span');
              valueSpan.className = 'font-bold text-foreground';
              valueSpan.textContent = value;

              item.appendChild(labelSpan);
              item.appendChild(valueSpan);
              priceSection.appendChild(item);
            });
          }
        } else if ('value' in data) {
          const { value } = data as LineData;
          const item = document.createElement('div');
          item.className = 'flex items-center gap-1';

          const labelSpan = document.createElement('span');
          labelSpan.className = isMobile
            ? 'font-bold tracking-wide uppercase text-xs text-primary'
            : 'font-bold tracking-wide uppercase text-muted-foreground';
          labelSpan.textContent = 'Price';

          const valueSpan = document.createElement('span');
          valueSpan.className = isMobile
            ? 'font-bold text-xs text-primary'
            : 'font-bold text-foreground';
          valueSpan.textContent = (value as number).toFixed(2);

          item.appendChild(labelSpan);
          item.appendChild(valueSpan);
          priceSection.appendChild(item);
        }
      }
    };

    chart.subscribeCrosshairMove((param: MouseEventParams<Time>) => {
      if (param.time && seriesRef.current) {
        const data = param.seriesData.get(seriesRef.current);
        if (data && ('open' in data || 'value' in data)) {
          updateLegend(data as any);
        } else {
          updateLegend(null);
        }
      } else {
        if (seriesData.length > 0) {
          updateLegend(seriesData[seriesData.length - 1]);
        }
      }
    });

    chart.subscribeClick(handleChartClick);

    if (seriesData.length > 0) {
      const mainSeries = createSeries(chart, chartType);
      mainSeries.setData(seriesData as any);
      seriesRef.current = mainSeries;
      prevChartTypeRef.current = chartType;

      updateLegend(seriesData[seriesData.length - 1]);
    }

    // Create loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className =
      'absolute hidden px-4 py-2.5 rounded-xl shadow-lg top-16 left-3 bg-card/95 backdrop-blur-xl border border-border/40';
    loadingIndicator.innerHTML = `
      <div class="flex items-center gap-2.5 text-sm">
        <div class="animate-spin rounded-full h-4 w-4 border-2 border-primary/30 border-t-primary"></div>
        <span class="text-foreground font-semibold">Loading historical data...</span>
      </div>
    `;
    mainChartContainerRef.current.appendChild(loadingIndicator);
    loadingIndicatorRef.current = loadingIndicator;

    chart.timeScale().subscribeVisibleLogicalRangeChange(logicalRange => {
      if (!logicalRange) return;
      const threshold = 10;
      if (logicalRange.from < threshold && hasMoreData && !isLoadingMore) {
        onLoadMoreDataRef.current();
      }
    });
  }, [
    isMobile,
    setTimeScale,
    chartType,
    mode,
    seriesData,
    createSeries,
    hasMoreData,
    isLoadingMore,
    handleChartClick,
  ]);

  // Initialize chart on mount
  useEffect(() => {
    initializeChart();
  }, [initializeChart]);

  // Keep chart sized to container
  useResizeObserver(mainChartContainerRef, rect => {
    if (mainChartRef.current) {
      mainChartRef.current.applyOptions({
        width: rect.width,
        height: rect.height,
      });
    }
  });

  // Update chart styling when mode changes
  useEffect(() => {
    if (!mainChartRef.current) return;
    mainChartRef.current.applyOptions(getBaseChartOptions(mode));

    if (seriesRef.current && mainChartRef.current) {
      // Clear old price lines before removing series
      clearAllPriceLines();
      
      mainChartRef.current.removeSeries(seriesRef.current);
      const newSeries = createSeries(mainChartRef.current, chartType);
      newSeries.setData(seriesData as any);
      seriesRef.current = newSeries;
      
      // Re-create price lines after new series is created
      setTimeout(() => updateTradePriceLines(), 100);
    }
  }, [mode, createSeries, chartType, seriesData, clearAllPriceLines, updateTradePriceLines]);

  // Handle series creation/update and data changes
  useEffect(() => {
    if (!mainChartRef.current || !seriesData.length) return;

    if (prevChartTypeRef.current !== chartType) {
      // Clear price lines before changing series type
      clearAllPriceLines();
      
      if (seriesRef.current) {
        mainChartRef.current.removeSeries(seriesRef.current);
      }
      const mainSeries = createSeries(mainChartRef.current, chartType);
      mainSeries.setData(seriesData as any);
      seriesRef.current = mainSeries;
      prevChartTypeRef.current = chartType;
      
      // Re-create price lines after series change
      setTimeout(() => updateTradePriceLines(), 100);
    } else {
      if (seriesRef.current) {
        seriesRef.current.setData(seriesData as any);
      }
    }

    // Update trade markers
    if (seriesRef.current && 'setMarkers' in seriesRef.current) {
      if (openTrades.length > 0) {
        const markers = createTradeMarkers(openTrades);
        seriesRef.current.setMarkers(markers);
      } else {
        seriesRef.current.setMarkers([]);
      }
    }
  }, [seriesData, chartType, createSeries, openTrades, createTradeMarkers, clearAllPriceLines, updateTradePriceLines]);

  // Update trade price lines when trades change - DEBOUNCED
  useEffect(() => {
    const timer = setTimeout(() => {
      updateTradePriceLines();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [updateTradePriceLines]);

  // Add/Remove EMA series
  useEffect(() => {
    if (!mainChartRef.current) return;

    if (emaData && emaData.length > 0) {
      if (!emaSeriesRef.current) {
        emaSeriesRef.current = mainChartRef.current.addSeries(LineSeries, {
          color: mode ? '#FBBF24' : '#F59E0B',
          lineWidth: 1,
          lineStyle: 0,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
        });
      }
      emaSeriesRef.current.setData(emaData);
    } else {
      if (emaSeriesRef.current) {
        mainChartRef.current.removeSeries(emaSeriesRef.current);
        emaSeriesRef.current = null;
      }
    }
  }, [emaData, mode]);

  // Add/Remove Bollinger Bands series
  useEffect(() => {
    if (!mainChartRef.current) return;

    if (bollingerBandsData && bollingerBandsData.length > 0) {
      if (!bollingerBandsSeriesRefs.current.upper) {
        bollingerBandsSeriesRefs.current.upper = mainChartRef.current.addSeries(
          LineSeries,
          {
            color: mode ? '#FBBF24' : '#F59E0B',
            lineWidth: 1,
            lineStyle: 2,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
          }
        );
        bollingerBandsSeriesRefs.current.middle =
          mainChartRef.current.addSeries(LineSeries, {
            color: mode ? '#60A5FA' : '#3B82F6',
            lineWidth: 1,
            lineStyle: 1,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
          });
        bollingerBandsSeriesRefs.current.lower = mainChartRef.current.addSeries(
          LineSeries,
          {
            color: mode ? '#EF4444' : '#DC2626',
            lineWidth: 1,
            lineStyle: 2,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
          }
        );
      }
      bollingerBandsSeriesRefs.current.upper?.setData(
        bollingerBandsData.map(d => ({ time: d.time, value: d.upper }))
      );
      bollingerBandsSeriesRefs.current.middle?.setData(
        bollingerBandsData.map(d => ({ time: d.time, value: d.middle }))
      );
      bollingerBandsSeriesRefs.current.lower?.setData(
        bollingerBandsData.map(d => ({ time: d.time, value: d.lower }))
      );
    } else {
      if (bollingerBandsSeriesRefs.current.upper) {
        mainChartRef.current.removeSeries(
          bollingerBandsSeriesRefs.current.upper
        );
        bollingerBandsSeriesRefs.current.upper = null;
      }
      if (bollingerBandsSeriesRefs.current.middle) {
        mainChartRef.current.removeSeries(
          bollingerBandsSeriesRefs.current.middle
        );
        bollingerBandsSeriesRefs.current.middle = null;
      }
      if (bollingerBandsSeriesRefs.current.lower) {
        mainChartRef.current.removeSeries(
          bollingerBandsSeriesRefs.current.lower
        );
        bollingerBandsSeriesRefs.current.lower = null;
      }
    }
  }, [bollingerBandsData, mode]);

  // Show/hide loading indicator
  useEffect(() => {
    if (loadingIndicatorRef.current && !autoRefresh) {
      loadingIndicatorRef.current.style.display = isLoadingMore
        ? 'block'
        : 'none';
    }
  }, [isLoadingMore, autoRefresh]);

  // Cleanup effect
  useEffect(() => {
    const currentBollingerRefs = bollingerBandsSeriesRefs.current;
    return () => {
      clearAllPriceLines();
      if (mainChartRef.current) {
        mainChartRef.current.remove();
        mainChartRef.current = null;
      }
      legendContainerRef.current = null;
      seriesRef.current = null;
      emaSeriesRef.current = null;
      currentBollingerRefs.upper = null;
      currentBollingerRefs.middle = null;
      currentBollingerRefs.lower = null;
    };
  }, [clearAllPriceLines]);

  return (
    <div ref={mainChartContainerRef} className="relative w-full h-full">
      {/* Chart will be rendered here */}
    </div>
  );
};

export default MainChart;