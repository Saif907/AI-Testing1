import {
  ChatRequest,
  CheckHealthData,
  GetStockDataAndIndicatorsData,
  GetStockDataAndIndicatorsError,
  GetStockDataAndIndicatorsParams,
  StreamChatData,
  StreamChatError,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Brain<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   *
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  /**
   * @description Endpoint to stream chat responses from the Gemini API. Uses Server-Sent Events (SSE) to stream data.
   *
   * @tags stream, dbtn/module:gemini
   * @name stream_chat
   * @summary Stream Chat
   * @request POST:/routes/gemini/chat
   */
  stream_chat = (data: ChatRequest, params: RequestParams = {}) =>
    this.requestStream<StreamChatData, StreamChatError>({
      path: `/routes/gemini/chat`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });

  /**
   * @description Fetches historical stock data and calculates technical indicators for a given symbol from Yahoo Finance. Supported indicators: - SMA(period) - Simple Moving Average - EMA(period) - Exponential Moving Average - RSI(period) - Relative Strength Index (default: 14) - MACD(fast,slow,signal) - MACD (default: 12,26,9)
   *
   * @tags dbtn/module:stock_data
   * @name get_stock_data_and_indicators
   * @summary Get Stock Data And Indicators
   * @request GET:/routes/stock-data/
   */
  get_stock_data_and_indicators = (query: GetStockDataAndIndicatorsParams, params: RequestParams = {}) =>
    this.request<GetStockDataAndIndicatorsData, GetStockDataAndIndicatorsError>({
      path: `/routes/stock-data/`,
      method: "GET",
      query: query,
      ...params,
    });
}
