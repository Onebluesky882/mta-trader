//+------------------------------------------------------------------+
//| ATP Bot Trader - MT5 Expert Advisor                              |
//| Version: 3.0                                                     |
//| Flow: Fetch settings -> Check RSI -> Ask AI -> Open if approved |
//+------------------------------------------------------------------+
#property copyright "ATP Bot Trader"
#property version   "3.00"
#property strict

#include <Trade\Trade.mqh>
#include <Trade\PositionInfo.mqh>
#include <Trade\DealInfo.mqh>

//--- Inputs
input string API_URL      = "https://atp-bot-trader-api.onebluesky882.workers.dev";
input string MT5_SECRET   = "";
input int    MAGIC_NUMBER = 20240001;

//--- Settings from API
string g_symbol      = "EURUSD";
string g_direction   = "BUY";
int    g_maxTrades   = 1;
double g_lotSize     = 0.01;
int    g_stopLoss    = 50;
int    g_takeProfit  = 100;
int    g_settingsVersion = 0;

//--- AI Config from API
bool   g_aiEnabled     = false;
int    g_confidenceMin = 70;
double g_rrMin         = 1.5;

//--- Strategy config from API (text-parsed by AI, applied by EA)
bool   g_strategyEnabled   = false;
string g_strategyId        = "";
string g_timeframe         = "H1";
int    g_minWickTouches    = 3;
int    g_lookbackBars      = 100;
int    g_proximityPoints   = 20;
string g_biasToday         = "MIXED";
int    g_tpPoints          = 100;
int    g_slPoints          = 50;

datetime g_lastSettingsFetch = 0;
datetime g_lastAiConfig      = 0;
datetime g_lastStrategyFetch = 0;

CTrade    g_trade;
CDealInfo g_deal;

struct ZoneResult {
   bool   found;
   double level;
   double zoneMin;
   double zoneMax;
   int    touches;
};

//+------------------------------------------------------------------+
int OnInit() {
   g_trade.SetExpertMagicNumber(MAGIC_NUMBER);
   FetchSettings();
   FetchAiConfig();
   FetchStrategy();
   EventSetTimer(60);
   SendHeartbeat("RUNNING");
   Print("[ATP v3] Started AI:", (g_aiEnabled ? "ON" : "OFF"),
         " MinConf:", g_confidenceMin, "%",
         " Strategy:", (g_strategyEnabled ? g_strategyId : "none"));
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason) {
   EventKillTimer();
   SendHeartbeat("STOPPED");
}

void OnTimer() {
   SendHeartbeat("RUNNING");
   if(TimeCurrent() - g_lastSettingsFetch >= 300) FetchSettings();
   if(TimeCurrent() - g_lastAiConfig      >= 300) FetchAiConfig();
   if(TimeCurrent() - g_lastStrategyFetch >= 300) FetchStrategy();
}

//+------------------------------------------------------------------+
void OnTick() {
   int openCount = CountOpenPositions();
   if(openCount >= g_maxTrades) return;

   if(g_strategyEnabled) {
      CheckStrategyEntry();
      return;
   }

   if(g_direction == "BUY" || g_direction == "BOTH") {
      if(CheckBuySignal()) {
         if(AiApproves("BUY")) OpenPosition(ORDER_TYPE_BUY);
      }
   }
   if(g_direction == "SELL" || g_direction == "BOTH") {
      if(CheckSellSignal()) {
         if(AiApproves("SELL")) OpenPosition(ORDER_TYPE_SELL);
      }
   }
}

//+------------------------------------------------------------------+
// Text-strategy engine: EA finds the wick-cluster zone itself from real
// H1 history and enters on config's bias/TP/SL - no AI call per tick.
void CheckStrategyEntry() {
   double ask = SymbolInfoDouble(g_symbol, SYMBOL_ASK);
   double bid = SymbolInfoDouble(g_symbol, SYMBOL_BID);

   if(g_biasToday == "BUY" || g_biasToday == "MIXED") {
      ZoneResult zone = FindWickClusterZone(true);
      if(zone.found && bid >= zone.zoneMin && bid <= zone.zoneMax) {
         Print("[ATP] Demand zone hit @", zone.level, " touches:", zone.touches, " -> BUY");
         OpenStrategyPosition(ORDER_TYPE_BUY);
         return;
      }
   }
   if(g_biasToday == "SELL" || g_biasToday == "MIXED") {
      ZoneResult zone = FindWickClusterZone(false);
      if(zone.found && ask >= zone.zoneMin && ask <= zone.zoneMax) {
         Print("[ATP] Supply zone hit @", zone.level, " touches:", zone.touches, " -> SELL");
         OpenStrategyPosition(ORDER_TYPE_SELL);
      }
   }
}

//+------------------------------------------------------------------+
// MQL5's switch only works on ordinal types (int/enum), not strings —
// this if/else ladder is the standard MQL5 equivalent for a string key.
ENUM_TIMEFRAMES TimeframeFromString(string tf) {
   if(tf == "M15") return PERIOD_M15;
   if(tf == "M30") return PERIOD_M30;
   if(tf == "H1")  return PERIOD_H1;
   if(tf == "H4")  return PERIOD_H4;
   if(tf == "D1")  return PERIOD_D1;
   return PERIOD_H1;
}

//+------------------------------------------------------------------+
// demand=true -> cluster candle lows (support/demand zone for BUY)
// demand=false -> cluster candle highs (resistance/supply zone for SELL)
ZoneResult FindWickClusterZone(bool demand) {
   ZoneResult result;
   result.found = false; result.touches = 0;
   result.level = 0; result.zoneMin = 0; result.zoneMax = 0;

   double point     = SymbolInfoDouble(g_symbol, SYMBOL_POINT);
   double tolerance = g_proximityPoints * point;
   ENUM_TIMEFRAMES tf = TimeframeFromString(g_timeframe);

   double prices[];
   int copied = demand
      ? CopyLow(g_symbol, tf, 1, g_lookbackBars, prices)
      : CopyHigh(g_symbol, tf, 1, g_lookbackBars, prices);
   if(copied < g_minWickTouches) return result;

   int    bestTouches = 0;
   double bestSum      = 0;
   for(int i = 0; i < copied; i++) {
      int    touches = 0;
      double sum     = 0;
      for(int j = 0; j < copied; j++) {
         if(MathAbs(prices[j] - prices[i]) <= tolerance) { touches++; sum += prices[j]; }
      }
      if(touches > bestTouches) { bestTouches = touches; bestSum = sum; }
   }

   if(bestTouches < g_minWickTouches) return result;

   result.found   = true;
   result.touches = bestTouches;
   result.level   = bestSum / bestTouches;
   result.zoneMin = result.level - tolerance;
   result.zoneMax = result.level + tolerance;
   return result;
}

//+------------------------------------------------------------------+
void OpenStrategyPosition(ENUM_ORDER_TYPE type) {
   double point  = SymbolInfoDouble(g_symbol, SYMBOL_POINT);
   int    digits = (int)SymbolInfoInteger(g_symbol, SYMBOL_DIGITS);
   double ask    = SymbolInfoDouble(g_symbol, SYMBOL_ASK);
   double bid    = SymbolInfoDouble(g_symbol, SYMBOL_BID);
   double price, sl, tp;

   if(type == ORDER_TYPE_BUY) {
      price = ask;
      sl = NormalizeDouble(price - g_slPoints * point, digits);
      tp = NormalizeDouble(price + g_tpPoints * point, digits);
   } else {
      price = bid;
      sl = NormalizeDouble(price + g_slPoints * point, digits);
      tp = NormalizeDouble(price - g_tpPoints * point, digits);
   }

   bool ok = g_trade.PositionOpen(g_symbol, type, g_lotSize, price, sl, tp,
                                   "STRAT:" + g_strategyId);
   if(!ok) Print("[ATP] Strategy open failed: ", g_trade.ResultRetcodeDescription());
}

//+------------------------------------------------------------------+
bool AiApproves(string direction) {
   if(!g_aiEnabled) return true;

   double ask   = SymbolInfoDouble(g_symbol, SYMBOL_ASK);
   double bid   = SymbolInfoDouble(g_symbol, SYMBOL_BID);
   double price = (direction == "BUY") ? ask : bid;

   double rsiH4  = GetRSI(g_symbol, PERIOD_H4, 14);
   double rsiH1  = GetRSI(g_symbol, PERIOD_H1, 14);
   double macdH4 = GetMACDHistogram(g_symbol, PERIOD_H4, 12, 26, 9);
   double macdH1 = GetMACDHistogram(g_symbol, PERIOD_H1, 12, 26, 9);
   double ema50  = GetEMA(g_symbol, PERIOD_H4, 50);
   double ema200 = GetEMA(g_symbol, PERIOD_H4, 200);
   double ema21  = GetEMA(g_symbol, PERIOD_H1, 21);

   string body = StringFormat(
      "{\"symbol\":\"%s\","
      "\"currentPrice\":%.5f,"
      "\"h4Indicators\":{\"rsi\":%.2f,\"macdHistogram\":%.5f,\"ema50\":%.5f,\"ema200\":%.5f},"
      "\"h1Indicators\":{\"rsi\":%.2f,\"macdHistogram\":%.5f,\"ema21\":%.5f}}",
      g_symbol, price,
      rsiH4, macdH4, ema50, ema200,
      rsiH1, macdH1, ema21
   );

   string resp = PostToAPIWithResponse("/api/ai-signal/analyze", body);
   if(resp == "") {
      Print("[ATP] AI failed - allowing trade");
      return true;
   }

   string aiSignal     = JsonGetString(resp, "signal");
   int    aiConfidence = (int)JsonGetNumber(resp, "confidence");

   Print("[ATP] AI signal:", aiSignal, " conf:", aiConfidence, "% min:", g_confidenceMin, "%");

   if(aiConfidence < g_confidenceMin) { Print("[ATP] Confidence too low - skip"); return false; }
   if(aiSignal == "HOLD")             { Print("[ATP] AI says HOLD - skip");        return false; }
   if(aiSignal != direction)          { Print("[ATP] Direction mismatch - skip");   return false; }

   Print("[ATP] AI approved ", direction, " conf:", aiConfidence, "%");
   return true;
}

//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction &trans,
                        const MqlTradeRequest     &request,
                        const MqlTradeResult      &result) {
   if(trans.type != TRADE_TRANSACTION_DEAL_ADD) return;
   g_deal.Ticket(trans.deal);
   if(g_deal.Magic() != MAGIC_NUMBER)           return;

   if(g_deal.Entry() == DEAL_ENTRY_IN) {
      string dir     = (g_deal.DealType() == DEAL_TYPE_BUY) ? "BUY" : "SELL";
      string comment = g_deal.Comment();
      string stratId = (StringFind(comment, "STRAT:") == 0) ? StringSubstr(comment, 6) : "";
      SendTradeOpen(
         (long)g_deal.PositionId(),
         g_deal.Symbol(), dir,
         g_deal.Price(), g_deal.Volume(),
         TimeToString(g_deal.Time(), TIME_DATE|TIME_MINUTES|TIME_SECONDS),
         stratId
      );
   }
   else if(g_deal.Entry() == DEAL_ENTRY_OUT) {
      ENUM_DEAL_REASON dealReason = (ENUM_DEAL_REASON)HistoryDealGetInteger(g_deal.Ticket(), DEAL_REASON);
      SendTradeClose(
         (long)g_deal.PositionId(),
         g_deal.Price(),
         TimeToString(g_deal.Time(), TIME_DATE|TIME_MINUTES|TIME_SECONDS),
         g_deal.Profit(),
         GetCloseReason(dealReason)
      );
   }
}

//+------------------------------------------------------------------+
int CountOpenPositions() {
   int count = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      if(PositionGetSymbol(i) == g_symbol &&
         PositionGetInteger(POSITION_MAGIC) == MAGIC_NUMBER) count++;
   }
   return count;
}

//+------------------------------------------------------------------+
void OpenPosition(ENUM_ORDER_TYPE type) {
   double point   = SymbolInfoDouble(g_symbol, SYMBOL_POINT);
   int    digits  = (int)SymbolInfoInteger(g_symbol, SYMBOL_DIGITS);
   double pipSize = (digits == 3 || digits == 5) ? point * 10 : point;

   double ask = SymbolInfoDouble(g_symbol, SYMBOL_ASK);
   double bid = SymbolInfoDouble(g_symbol, SYMBOL_BID);
   double price, sl, tp;

   if(type == ORDER_TYPE_BUY) {
      price = ask;
      sl = NormalizeDouble(price - g_stopLoss  * pipSize, digits);
      tp = NormalizeDouble(price + g_takeProfit * pipSize, digits);
   } else {
      price = bid;
      sl = NormalizeDouble(price + g_stopLoss  * pipSize, digits);
      tp = NormalizeDouble(price - g_takeProfit * pipSize, digits);
   }

   bool ok = g_trade.PositionOpen(g_symbol, type, g_lotSize, price, sl, tp,
                                   "ATP v" + IntegerToString(g_settingsVersion));
   if(!ok) Print("[ATP] Open failed: ", g_trade.ResultRetcodeDescription());
}

//+------------------------------------------------------------------+
bool CheckBuySignal()  { return GetRSI(g_symbol, PERIOD_CURRENT, 14) < 30.0; }
bool CheckSellSignal() { return GetRSI(g_symbol, PERIOD_CURRENT, 14) > 70.0; }

//+------------------------------------------------------------------+
double GetRSI(string sym, ENUM_TIMEFRAMES tf, int period) {
   int handle = iRSI(sym, tf, period, PRICE_CLOSE);
   if(handle == INVALID_HANDLE) return 50;
   double buf[];
   if(CopyBuffer(handle, 0, 1, 1, buf) < 1) { IndicatorRelease(handle); return 50; }
   IndicatorRelease(handle);
   return buf[0];
}

double GetMACDHistogram(string sym, ENUM_TIMEFRAMES tf, int fast, int slow, int sig) {
   int handle = iMACD(sym, tf, fast, slow, sig, PRICE_CLOSE);
   if(handle == INVALID_HANDLE) return 0;
   double buf[];
   if(CopyBuffer(handle, 2, 1, 1, buf) < 1) { IndicatorRelease(handle); return 0; }
   IndicatorRelease(handle);
   return buf[0];
}

double GetEMA(string sym, ENUM_TIMEFRAMES tf, int period) {
   int handle = iMA(sym, tf, period, 0, MODE_EMA, PRICE_CLOSE);
   if(handle == INVALID_HANDLE) return 0;
   double buf[];
   if(CopyBuffer(handle, 0, 1, 1, buf) < 1) { IndicatorRelease(handle); return 0; }
   IndicatorRelease(handle);
   return buf[0];
}

//+------------------------------------------------------------------+
void FetchSettings() {
   string headers = "X-MT5-Secret: " + MT5_SECRET + "\r\n";
   char req[], resp[];
   string respHeaders;
   int status = WebRequest("GET", API_URL + "/api/settings/active",
                           headers, 5000, req, resp, respHeaders);
   if(status != 200) { Print("[ATP] FetchSettings failed HTTP:", status); return; }

   string json       = CharArrayToString(resp);
   string paramsJson = JsonGetObject(json, "params");

   string sym = JsonGetString(paramsJson, "symbol");    if(sym != "") g_symbol = sym;
   string dir = JsonGetString(paramsJson, "direction"); if(dir != "") g_direction = dir;
   int mt = (int)JsonGetNumber(paramsJson, "maxTrades"); if(mt > 0) g_maxTrades = mt;
   double lot = JsonGetNumber(paramsJson, "lotSize");    if(lot > 0) g_lotSize = lot;
   int sl = (int)JsonGetNumber(paramsJson, "stopLoss");  if(sl > 0) g_stopLoss = sl;
   int tp = (int)JsonGetNumber(paramsJson, "takeProfit");if(tp > 0) g_takeProfit = tp;
   int ver = (int)JsonGetNumber(json, "version");        if(ver > 0) g_settingsVersion = ver;

   g_lastSettingsFetch = TimeCurrent();
   Print("[ATP] Settings v", g_settingsVersion, " ", g_direction, " ", g_symbol,
         " max:", g_maxTrades, " lot:", g_lotSize, " SL:", g_stopLoss, " TP:", g_takeProfit);
}

//+------------------------------------------------------------------+
void FetchAiConfig() {
   string headers = "X-MT5-Secret: " + MT5_SECRET + "\r\n";
   char req[], resp[];
   string respHeaders;
   int status = WebRequest("GET", API_URL + "/api/ai-config/active",
                           headers, 5000, req, resp, respHeaders);
   if(status != 200) { Print("[ATP] FetchAiConfig failed HTTP:", status); return; }

   string json       = CharArrayToString(resp);
   string paramsJson = JsonGetObject(json, "params");

   string aiStr = JsonGetString(paramsJson, "aiEnabled");
   g_aiEnabled = (aiStr == "true" || JsonGetNumber(paramsJson, "aiEnabled") == 1);

   int conf = (int)JsonGetNumber(paramsJson, "confidenceMin");
   if(conf > 0) g_confidenceMin = conf;

   double rr = JsonGetNumber(paramsJson, "rrMin");
   if(rr > 0) g_rrMin = rr;

   g_lastAiConfig = TimeCurrent();
   Print("[ATP] AI Config enabled:", (g_aiEnabled ? "YES" : "NO"),
         " minConf:", g_confidenceMin, "% RR:", g_rrMin);
}

//+------------------------------------------------------------------+
void FetchStrategy() {
   string headers = "X-MT5-Secret: " + MT5_SECRET + "\r\n";
   char req[], resp[];
   string respHeaders;
   int status = WebRequest("GET", API_URL + "/api/strategy/active",
                           headers, 5000, req, resp, respHeaders);
   if(status != 200) { Print("[ATP] FetchStrategy failed HTTP:", status); return; }

   string json = CharArrayToString(resp);
   if(StringFind(json, "\"strategy\":null") >= 0) {
      g_strategyEnabled = false;
      g_lastStrategyFetch = TimeCurrent();
      return;
   }

   string strategyJson = JsonGetObject(json, "strategy");
   string id           = JsonGetString(strategyJson, "id");
   string paramsJson   = JsonGetObject(strategyJson, "params");
   if(id == "" || paramsJson == "{}") {
      g_strategyEnabled = false;
      g_lastStrategyFetch = TimeCurrent();
      return;
   }

   g_strategyId      = id;
   string tf = JsonGetString(paramsJson, "timeframe");         if(tf != "") g_timeframe    = tf;
   int wt = (int)JsonGetNumber(paramsJson, "minWickTouches");  if(wt > 0) g_minWickTouches  = wt;
   int lb = (int)JsonGetNumber(paramsJson, "lookbackBars");    if(lb > 0) g_lookbackBars    = lb;
   int px = (int)JsonGetNumber(paramsJson, "proximityPoints"); if(px > 0) g_proximityPoints = px;
   string bias = JsonGetString(paramsJson, "biasToday");       if(bias != "") g_biasToday   = bias;
   int tp = (int)JsonGetNumber(paramsJson, "tpPoints");        if(tp > 0) g_tpPoints        = tp;
   int sl = (int)JsonGetNumber(paramsJson, "slPoints");        if(sl > 0) g_slPoints        = sl;

   g_strategyEnabled   = true;
   g_lastStrategyFetch = TimeCurrent();
   Print("[ATP] Strategy ", g_strategyId, " tf:", g_timeframe, " bias:", g_biasToday,
         " minTouches:", g_minWickTouches, " lookback:", g_lookbackBars,
         " proximity:", g_proximityPoints, " TP:", g_tpPoints, " SL:", g_slPoints);
}

//+------------------------------------------------------------------+
void SendTradeOpen(long ticket, string symbol, string direction,
                   double openPrice, double volume, string openTime, string strategyId) {
   string strategyJson = (strategyId == "") ? "null" : ("\"" + strategyId + "\"");
   string body = StringFormat(
      "{\"ticket\":%d,\"symbol\":\"%s\",\"direction\":\"%s\","
      "\"openPrice\":%.5f,\"volume\":%.2f,\"openTime\":\"%s\",\"strategyId\":%s}",
      ticket, symbol, direction, openPrice, volume, openTime, strategyJson
   );
   PostToAPI("/api/mt5/trade-open", body);
   Print("[ATP] trade-open #", ticket, " ", direction, " ", symbol, " @", openPrice,
         (strategyId == "" ? "" : (" strategy:" + strategyId)));
}

//+------------------------------------------------------------------+
void SendTradeClose(long ticket, double closePrice, string closeTime,
                    double profit, string reason) {
   string body = StringFormat(
      "{\"ticket\":%d,\"closePrice\":%.5f,\"closeTime\":\"%s\","
      "\"profit\":%.2f,\"reason\":\"%s\"}",
      ticket, closePrice, closeTime, profit, reason
   );
   PostToAPI("/api/mt5/trade-close", body);
   string sign = profit >= 0 ? "+" : "";
   Print("[ATP] trade-close #", ticket, " PnL:", sign, DoubleToString(profit, 2), " ", reason);
}

//+------------------------------------------------------------------+
void SendHeartbeat(string status) {
   string body = StringFormat("{\"status\":\"%s\",\"timestamp\":\"%s\"}",
      status, TimeToString(TimeCurrent(), TIME_DATE|TIME_MINUTES|TIME_SECONDS));
   PostToAPI("/api/mt5/heartbeat", body);
}

//+------------------------------------------------------------------+
void PostToAPI(string path, string body) {
   string url     = API_URL + path;
   string headers = "Content-Type: application/json\r\nX-MT5-Secret: " + MT5_SECRET + "\r\n";
   char req[], resp[];
   string respHeaders;
   StringToCharArray(body, req, 0, StringLen(body));
   int status = WebRequest("POST", url, headers, 5000, req, resp, respHeaders);
   if(status < 0)
      Print("[ATP] WebRequest error:", GetLastError(),
            " Add URL in: Tools > Options > Expert Advisors");
}

//+------------------------------------------------------------------+
string PostToAPIWithResponse(string path, string body) {
   string url     = API_URL + path;
   string headers = "Content-Type: application/json\r\nX-MT5-Secret: " + MT5_SECRET + "\r\n";
   char req[], resp[];
   string respHeaders;
   StringToCharArray(body, req, 0, StringLen(body));
   int status = WebRequest("POST", url, headers, 8000, req, resp, respHeaders);
   if(status != 200) { Print("[ATP] AI HTTP:", status); return ""; }
   return CharArrayToString(resp);
}

//+------------------------------------------------------------------+
string GetCloseReason(ENUM_DEAL_REASON reason) {
   if(reason == DEAL_REASON_TP)     return "Take Profit";
   if(reason == DEAL_REASON_SL)     return "Stop Loss";
   if(reason == DEAL_REASON_EXPERT) return "EA Close";
   return "Manual";
}

//+------------------------------------------------------------------+
string JsonGetString(string json, string key) {
   string search = "\"" + key + "\":\"";
   int start = StringFind(json, search);
   if(start < 0) return "";
   start += StringLen(search);
   int end = StringFind(json, "\"", start);
   if(end < 0) return "";
   return StringSubstr(json, start, end - start);
}

double JsonGetNumber(string json, string key) {
   string search = "\"" + key + "\":";
   int start = StringFind(json, search);
   if(start < 0) return 0;
   start += StringLen(search);
   return StringToDouble(StringSubstr(json, start, 20));
}

string JsonGetObject(string json, string key) {
   string search = "\"" + key + "\":{";
   int start = StringFind(json, search);
   if(start < 0) return "{}";
   start += StringLen(search) - 1;
   int depth = 0, i = start;
   while(i < StringLen(json)) {
      ushort c = StringGetCharacter(json, i);
      if(c == '{') depth++;
      else if(c == '}') {
         depth--;
         if(depth == 0) return StringSubstr(json, start, i - start + 1);
      }
      i++;
   }
   return "{}";
}
