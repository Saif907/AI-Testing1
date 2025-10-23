import yfinance as yf
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import pandas as pd
from typing import Optional, List

# This router will be automatically included by the app framework
router = APIRouter(prefix="/stock-data")


class IndicatorDataItem(BaseModel):
    time: float
    value: float


class IndicatorData(BaseModel):
    name: str
    data: list[IndicatorDataItem]


class StockDataItem(BaseModel):
    time: float
    open: float
    high: float
    low: float
    close: float


class StockDataResponse(BaseModel):
    data: list[StockDataItem]
    indicators: list[IndicatorData]


def calculate_sma(df: pd.DataFrame, period: int) -> pd.Series:
    """Calculate Simple Moving Average"""
    return df['close'].rolling(window=period).mean()


def calculate_ema(df: pd.DataFrame, period: int) -> pd.Series:
    """Calculate Exponential Moving Average"""
    return df['close'].ewm(span=period, adjust=False).mean()


def calculate_rsi(df: pd.DataFrame, period: int = 14) -> pd.Series:
    """Calculate Relative Strength Index"""
    delta = df['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi


def calculate_macd(df: pd.DataFrame, fast: int = 12, slow: int = 26, signal: int = 9) -> tuple:
    """Calculate MACD, Signal, and Histogram"""
    ema_fast = df['close'].ewm(span=fast, adjust=False).mean()
    ema_slow = df['close'].ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram


def parse_indicator(indicator_string: str) -> tuple:
    """Parse indicator string like 'SMA(20)' into type and parameters"""
    if '(' in indicator_string:
        ind_type = indicator_string.split('(')[0].upper()
        params_str = indicator_string.split('(')[1].rstrip(')')
        params = [int(p.strip()) for p in params_str.split(',') if p.strip()]
        return ind_type, params
    else:
        return indicator_string.upper(), []


@router.get("/", response_model=StockDataResponse)
def get_stock_data_and_indicators(
    symbol: str = "AAPL",
    period: str = "1y",
    interval: str = "1d",
    indicators: Optional[List[str]] = Query(None),
):
    """
    Fetches historical stock data and calculates technical indicators
    for a given symbol from Yahoo Finance.
    
    Supported indicators:
    - SMA(period) - Simple Moving Average
    - EMA(period) - Exponential Moving Average
    - RSI(period) - Relative Strength Index (default: 14)
    - MACD(fast,slow,signal) - MACD (default: 12,26,9)
    """
    try:
        ticker = yf.Ticker(symbol)
        history = ticker.history(period=period, interval=interval)

        if history.empty:
            raise HTTPException(
                status_code=404, detail="No data found for the given symbol."
            )

        # Reset index to make 'Date' or 'Datetime' a column
        history = history.reset_index()

        # yfinance uses 'Datetime' for intraday and 'Date' for daily+
        # The chart expects a UNIX timestamp (seconds)
        date_column = "Datetime" if "Datetime" in history.columns else "Date"
        history["time"] = history[date_column].astype("int64") // 10**9

        # Ensure required columns are present and named correctly for the chart
        history = history.rename(
            columns={
                "Open": "open",
                "High": "high",
                "Low": "low",
                "Close": "close",
                "Volume": "volume",
            }
        )

        required_columns = ["time", "open", "high", "low", "close"]
        data_for_response = history[required_columns].to_dict(orient="records")

        # Calculate indicators if requested
        indicator_data_response = []
        if indicators:
            for ind_string in indicators:
                try:
                    ind_type, params = parse_indicator(ind_string)
                    
                    if ind_type == "SMA":
                        period_param = params[0] if params else 20
                        values = calculate_sma(history, period_param)
                        col_name = f"SMA_{period_param}"
                        
                    elif ind_type == "EMA":
                        period_param = params[0] if params else 20
                        values = calculate_ema(history, period_param)
                        col_name = f"EMA_{period_param}"
                        
                    elif ind_type == "RSI":
                        period_param = params[0] if params else 14
                        values = calculate_rsi(history, period_param)
                        col_name = f"RSI_{period_param}"
                        
                    elif ind_type == "MACD":
                        fast = params[0] if len(params) > 0 else 12
                        slow = params[1] if len(params) > 1 else 26
                        signal = params[2] if len(params) > 2 else 9
                        macd_line, signal_line, histogram = calculate_macd(history, fast, slow, signal)
                        values = macd_line
                        col_name = f"MACD_{fast}_{slow}_{signal}"
                    else:
                        print(f"Unknown indicator type: {ind_type}")
                        continue
                    
                    # Create indicator data
                    indicator_df = pd.DataFrame({
                        'time': history['time'],
                        'value': values
                    }).dropna()
                    
                    indicator_points = [
                        IndicatorDataItem(time=row['time'], value=row['value'])
                        for _, row in indicator_df.iterrows()
                    ]
                    
                    indicator_data_response.append(
                        IndicatorData(name=ind_string, data=indicator_points)
                    )
                    
                except Exception as e:
                    print(f"Could not calculate indicator {ind_string}: {e}")
                    # Silently fail for individual indicators
                    pass

        return StockDataResponse(
            data=data_for_response, indicators=indicator_data_response
        )

    except Exception as e:
        print(f"Error fetching stock data for {symbol}: {e}")
        raise HTTPException(
            status_code=500, detail=f"An error occurred while fetching stock data: {e}"
        )
