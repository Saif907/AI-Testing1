import React, { useState } from "react";
import {
  TrendingUp,
  Clock,
  X,
  Search,
  Send,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import Chart from "components/Chart";
import brain from "brain";
import { ChatMessage } from "types";

export default function App() {
  const [symbol, setSymbol] = useState("AAPL");
  const [symbolInput, setSymbolInput] = useState("");
  const [timeframe, setTimeframe] = useState("1d");
  const [indicators, setIndicators] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    { role: "ai", content: "Hello! I'm your AI trading assistant. Ask me about stocks, request indicators, or change timeframes using natural language." }
  ]);

  const timeframes = ["1m", "5m", "15m", "1h", "4h", "1d", "1w", "1mo"];
  const availableIndicators = ["SMA(20)", "SMA(50)", "EMA(50)", "RSI(14)", "MACD"];

  const handleSymbolSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbolInput.trim()) {
      setSymbol(symbolInput.toUpperCase());
      setSymbolInput("");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newUserMessage: ChatMessage = { role: "user", content: chatInput };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setChatInput("");

    // Add a placeholder for the AI response
    setMessages((prev) => [...prev, { role: "ai", content: "" }]);

    try {
      const stream = brain.stream_chat({ messages: updatedMessages });
      for await (const chunk of stream) {
        if (chunk.chunk) {
          setMessages((prev) =>
            prev.map((msg, index) =>
              index === prev.length - 1
                ? { ...msg, content: msg.content + chunk.chunk }
                : msg,
            ),
          );
        }
        if (chunk.error) {
           setMessages((prev) =>
            prev.map((msg, index) =>
              index === prev.length - 1
                ? { ...msg, content: `Error: ${chunk.error}` }
                : msg,
            ),
          );
          console.error("Error from stream:", chunk.error);
        }
      }
    } catch (error) {
      console.error("Failed to fetch chat stream:", error);
       setMessages((prev) =>
        prev.map((msg, index) =>
          index === prev.length - 1
            ? { ...msg, content: "Error: Could not connect to the AI assistant." }
            : msg,
        ),
      );
    }
  };

  const toggleIndicator = (indicator: string) => {
    setIndicators((prev) =>
      prev.includes(indicator)
        ? prev.filter(i => i !== indicator)
        : [...prev, indicator]
    );
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Left Panel - Chart */}
      <div className="flex-1 flex flex-col border-r border-border">
        {/* Chart Header */}
        <div className="border-b border-border p-4 space-y-4">
          <div className="flex items-center gap-4">
            <form onSubmit={handleSymbolSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={symbolInput}
                  onChange={(e) => setSymbolInput(e.target.value)}
                  placeholder="Search symbol..."
                  className="w-full pl-10 pr-4 py-2 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </form>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span className="text-2xl font-semibold tabular-nums">{symbol}</span>
            </div>
          </div>

          {/* Timeframe Selection */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-1">
              {timeframes.map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    timeframe === tf
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Indicators */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Indicators:</span>
            {availableIndicators.map(ind => (
              <button
                key={ind}
                onClick={() => toggleIndicator(ind)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  indicators.includes(ind)
                    ? "bg-blue-600 dark:bg-blue-500 text-white"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {indicators.includes(ind) ? (
                  <X className="w-3 h-3" />
                ) : (
                  <Plus className="w-3 h-3" />
                )}
                {ind}
              </button>
            ))}
          </div>

          {/* Active Indicators Display */}
          {indicators.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">Active:</span>
              {indicators.map(ind => (
                <span key={ind} className="px-2 py-1 bg-blue-600/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 rounded text-xs font-mono">
                  {ind}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Chart Area */}
        <div className="flex-1 bg-card">
          <Chart symbol={symbol} timeframe={timeframe} indicators={indicators} />
        </div>
      </div>

      {/* Right Panel - AI Chat */}
      <div className="w-96 flex flex-col bg-card">
        {/* Chat Header */}
        <div className="border-b border-border p-4">
          <h2 className="text-lg font-semibold">AI Assistant</h2>
          <p className="text-xs text-muted-foreground mt-1">Powered by Gemini API</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2.5 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className="border-t border-border p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about stocks or control chart..."
              className="flex-1 px-4 py-2.5 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            Try: "Add EMA(50)", "Remove RSI", "Switch to 1h chart"
          </p>
        </div>
      </div>
    </div>
  );
}
