import React, { useEffect, useRef, useState } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  LineData,
  CandlestickData,
} from "lightweight-charts";
import brain from "brain";
import { StockDataItem, IndicatorData } from "types";

interface ChartProps {
  symbol: string;
  timeframe: string;
  indicators: string[];
}

const Chart: React.FC<ChartProps> = ({ symbol, timeframe, indicators }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await brain.get_stock_data_and_indicators({
          symbol,
          period: "1y", // You might want to adjust this based on timeframe
          interval: timeframe,
          indicators,
        });
        const stockData = await response.json();

        // Set candlestick data
        if (candlestickSeriesRef.current) {
          candlestickSeriesRef.current.setData(stockData.data as CandlestickData[]);
        }

        // Clear old indicators
        indicatorSeriesRef.current.forEach((series) => chartRef.current?.removeSeries(series));
        indicatorSeriesRef.current.clear();

        // Add new indicators
        if (stockData.indicators && chartRef.current) {
          stockData.indicators.forEach((indicator: IndicatorData, index: number) => {
            const colors = ["#2962FF", "#FF6D00", "#FFD600", "#4CAF50"];
            const color = colors[index % colors.length];

            const lineSeries = chartRef.current?.addLineSeries({
              color,
              lineWidth: 2,
              title: indicator.name,
            });

            if (lineSeries) {
              lineSeries.setData(indicator.data as LineData[]);
              indicatorSeriesRef.current.set(indicator.name, lineSeries);
            }
          });
        }
        
        chartRef.current?.timeScale().fitContent();

      } catch (error) {
        console.error("Failed to fetch stock data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, timeframe, indicators]);

  useEffect(() => {
    if (chartContainerRef.current) {
      chartRef.current = createChart(chartContainerRef.current, {
        layout: {
          background: { color: "#0D1117" },
          textColor: "#C9D1D9",
        },
        grid: {
          vertLines: { color: "#2A2E39" },
          horzLines: { color: "#2A2E39" },
        },
        timeScale: {
          borderColor: "#444852",
        },
         rightPriceScale: {
          borderColor: "#444852",
        },
      });

      candlestickSeriesRef.current = chartRef.current.addCandlestickSeries({
        upColor: "#26A69A",
        downColor: "#EF5350",
        borderDownColor: "#EF5350",
        borderUpColor: "#26A69A",
        wickDownColor: "#EF5350",
        wickUpColor: "#26A69A",
      });
    }

    return () => {
      chartRef.current?.remove();
    };
  }, []);

  return (
    <div className="h-full w-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <p className="text-foreground">Loading Chart...</p>
        </div>
      )}
      <div ref={chartContainerRef} className="h-full w-full" />
    </div>
  );
};

export default Chart;
