/** ChatMessage */
export interface ChatMessage {
  /** Role */
  role: string;
  /** Content */
  content: string;
}

/** ChatRequest */
export interface ChatRequest {
  /** Messages */
  messages: ChatMessage[];
}

/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/** HealthResponse */
export interface HealthResponse {
  /** Status */
  status: string;
}

/** IndicatorData */
export interface IndicatorData {
  /** Name */
  name: string;
  /** Data */
  data: IndicatorDataItem[];
}

/** IndicatorDataItem */
export interface IndicatorDataItem {
  /** Time */
  time: number;
  /** Value */
  value: number;
}

/** StockDataItem */
export interface StockDataItem {
  /** Time */
  time: number;
  /** Open */
  open: number;
  /** High */
  high: number;
  /** Low */
  low: number;
  /** Close */
  close: number;
}

/** StockDataResponse */
export interface StockDataResponse {
  /** Data */
  data: StockDataItem[];
  /** Indicators */
  indicators: IndicatorData[];
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}

export type CheckHealthData = HealthResponse;

export type StreamChatData = any;

export type StreamChatError = HTTPValidationError;

export interface GetStockDataAndIndicatorsParams {
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
}

export type GetStockDataAndIndicatorsData = StockDataResponse;

export type GetStockDataAndIndicatorsError = HTTPValidationError;
