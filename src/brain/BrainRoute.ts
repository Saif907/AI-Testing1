import { ChatRequest, CheckHealthData, GetStockDataAndIndicatorsData, StreamChatData } from "./data-contracts";

export namespace Brain {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthData;
  }

  /**
   * @description Endpoint to stream chat responses from the Gemini API. Uses Server-Sent Events (SSE) to stream data.
   * @tags stream, dbtn/module:gemini
   * @name stream_chat
   * @summary Stream Chat
   * @request POST:/routes/gemini/chat
   */
  export namespace stream_chat {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ChatRequest;
    export type RequestHeaders = {};
    export type ResponseBody = StreamChatData;
  }

  /**
   * @description Fetches historical stock data and calculates technical indicators for a given symbol from Yahoo Finance. Supported indicators: - SMA(period) - Simple Moving Average - EMA(period) - Exponential Moving Average - RSI(period) - Relative Strength Index (default: 14) - MACD(fast,slow,signal) - MACD (default: 12,26,9)
   * @tags dbtn/module:stock_data
   * @name get_stock_data_and_indicators
   * @summary Get Stock Data And Indicators
   * @request GET:/routes/stock-data/
   */
  export namespace get_stock_data_and_indicators {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Symbol
       * @default "AAPL"
       */
      symbol?: string;
      /**
       * Period
       * @default "1y"
       */
      period?: string;
      /**
       * Interval
       * @default "1d"
       */
      interval?: string;
      /** Indicators */
      indicators?: string[] | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetStockDataAndIndicatorsData;
  }
}
