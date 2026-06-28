//+------------------------------------------------------------------+
//| ATP Bot Trader — MT5 Expert Advisor                              |
//| Version: 2.0                                                      |
//| Flow: Read settings from API → Open positions → Close → Report   |
//+------------------------------------------------------------------+
#property copyright "ATP Bot Trader"
#property version   "2.00"
#property strict

#include <Trade\Trade.mqh>
#include <Trade\PositionInfo.mqh>

//--- Inputs
input string API_URL    = "https://atp-bot-trader-api.onebluesky882.workers.dev";
input string MT5_SECRET = "";   // ใส่ค่าเดียวกับ MT5_WEBHOOK_SECRET ใน Cloudflare

//--- EA magic number (ใช้แยก positions ของ EA นี้)
input int    MAGIC_NUMBER = 20240001;

//--- Settings fetched from API (updated every 5 min)
string g_symbol    = "EURUSD";
string g_direction = "BUY";   // BUY | SELL | BOTH
int    g_maxTrades = 1;
double g_lotSize   = 0.01;
int    g_stopLoss  = 50;      // pips
int    g_takeProfit = 100;    // pips
int    g_settingsVersion = 0;

datetime g_lastSettingsFetch = 0;

CTrade g_trade;

//+------------------------------------------------------------------+
//| Init                                                              |
//+------------------------------------------------------------------+
int OnInit() {
   g_trade.SetExpertMagicNumber(MAGIC_NUMBER);
   FetchSettings();
   EventSetTimer(60);
   SendHeartbeat("RUNNING");
   Print("[ATP] EA started — Symbol:", g_symbol, " MaxTrades:", g_maxTrades);
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Deinit                                                            |
//+------------------------------------------------------------------+
void OnDeinit(const int reason) {
   EventKillTimer();
   SendHeartbeat("STOPPED");
}

//+------------------------------------------------------------------+
//| Timer — heartbeat + re-fetch settings every 5 min               |
//+------------------------------------------------------------------+
void OnTimer() {
   SendHeartbeat("RUNNING");
   if (TimeCurrent() - g_lastSettingsFetch >= 300) {
      FetchSettings();
   }
}

//+------------------------------------------------------------------+
//| Tick — check signal and manage positions                         |
//+------------------------------------------------------------------+
void OnTick() {
   int openCount = CountOpenPositions();

   // Open new positions if below maxTrades
   if (openCount < g_maxTrades) {
      if (g_direction == "BUY" || g_direction == "BOTH") {
         if (CheckBuySignal()) OpenPosition(ORDER_TYPE_BUY);
      }
      if (g_direction == "SELL" || g_direction == "BOTH") {
         if (CheckSellSignal()) OpenPosition(ORDER_TYPE_SELL);
      }
   }
}

//+------------------------------------------------------------------+
//| Trade event — send open/close to API                             |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction &trans,
                        const MqlTradeRequest    &request,
                        const MqlTradeResult     &result) {

   if (trans.type != TRADE_TRANSACTION_DEAL_ADD) return;

   CDealInfo deal;
   if (!deal.SelectByTicket(trans.deal)) return;

   // Only handle our EA's deals
   if (deal.Magic() != MAGIC_NUMBER) return;

   if (deal.Entry() == DEAL_ENTRY_IN) {
      string dir = (deal.DealType() == DEAL_TYPE_BUY) ? "BUY" : "SELL";
      SendTradeOpen(
         (long)deal.PositionId(),
         deal.Symbol(),
         dir,
         deal.Price(),
         deal.Volume(),
         TimeToString(deal.Time(), TIME_DATE | TIME_MINUTES | TIME_SECONDS)
      );
   }
   else if (deal.Entry() == DEAL_ENTRY_OUT) {
      string reason = GetCloseReason(deal.Reason());
      SendTradeClose(
         (long)deal.PositionId(),
         deal.Price(),
         TimeToString(deal.Time(), TIME_DATE | TIME_MINUTES | TIME_SECONDS),
         deal.Profit(),
         reason
      );
   }
}

//+------------------------------------------------------------------+
//| Count open positions by this EA                                   |
//+------------------------------------------------------------------+
int CountOpenPositions() {
   int count = 0;
   for (int i = PositionsTotal() - 1; i >= 0; i--) {
      if (PositionGetSymbol(i) == g_symbol &&
          PositionGetInteger(POSITION_MAGIC) == MAGIC_NUMBER) {
         count++;
      }
   }
   return count;
}

//+------------------------------------------------------------------+
//| Open a position with SL/TP from settings                        |
//+------------------------------------------------------------------+
void OpenPosition(ENUM_ORDER_TYPE type) {
   double point = SymbolInfoDouble(g_symbol, SYMBOL_POINT);
   int digits   = (int)SymbolInfoInteger(g_symbol, SYMBOL_DIGITS);
   double pipSize = (digits == 3 || digits == 5) ? point * 10 : point;

   double ask = SymbolInfoDouble(g_symbol, SYMBOL_ASK);
   double bid = SymbolInfoDouble(g_symbol, SYMBOL_BID);

   double sl, tp;
   double price;

   if (type == ORDER_TYPE_BUY) {
      price = ask;
      sl    = NormalizeDouble(price - g_stopLoss  * pipSize, digits);
      tp    = NormalizeDouble(price + g_takeProfit * pipSize, digits);
   } else {
      price = bid;
      sl    = NormalizeDouble(price + g_stopLoss  * pipSize, digits);
      tp    = NormalizeDouble(price - g_takeProfit * pipSize, digits);
   }

   bool ok = g_trade.PositionOpen(g_symbol, type, g_lotSize, price, sl, tp,
                                   "ATP v" + IntegerToString(g_settingsVersion));

   if (!ok) {
      Print("[ATP] Failed to open position: ", g_trade.ResultRetcodeDescription());
   }
}

//+------------------------------------------------------------------+
//| BUY signal: RSI oversold (< 30)                                  |
//+------------------------------------------------------------------+
bool CheckBuySignal() {
   int rsiHandle = iRSI(g_symbol, PERIOD_CURRENT, 14, PRICE_CLOSE);
   if (rsiHandle == INVALID_HANDLE) return false;
   double rsiVal[];
   if (CopyBuffer(rsiHandle, 0, 1, 1, rsiVal) < 1) return false;
   IndicatorRelease(rsiHandle);
   return rsiVal[0] < 30.0;
}

//+------------------------------------------------------------------+
//| SELL signal: RSI overbought (> 70)                               |
//+------------------------------------------------------------------+
bool CheckSellSignal() {
   int rsiHandle = iRSI(g_symbol, PERIOD_CURRENT, 14, PRICE_CLOSE);
   if (rsiHandle == INVALID_HANDLE) return false;
   double rsiVal[];
   if (CopyBuffer(rsiHandle, 0, 1, 1, rsiVal) < 1) return false;
   IndicatorRelease(rsiHandle);
   return rsiVal[0] > 70.0;
}

//+------------------------------------------------------------------+
//| Fetch settings from API                                          |
//+------------------------------------------------------------------+
void FetchSettings() {
   string headers = "X-MT5-Secret: " + MT5_SECRET + "\r\n";
   char req[], resp[];
   string respHeaders;

   int status = WebRequest("GET", API_URL + "/api/settings/active",
                           headers, 5000, req, resp, respHeaders);

   if (status != 200) {
      Print("[ATP] FetchSettings failed — HTTP:", status);
      return;
   }

   string json = CharArrayToString(resp);

   // Parse key values from JSON (simple extraction)
   string sym = JsonGetString(json, "symbol");
   if (sym != "") g_symbol = sym;

   string dir = JsonGetString(json, "direction");
   if (dir != "") g_direction = dir;

   int mt = (int)JsonGetNumber(json, "maxTrades");
   if (mt > 0) g_maxTrades = mt;

   double lot = JsonGetNumber(json, "lotSize");
   if (lot > 0) g_lotSize = lot;

   int sl = (int)JsonGetNumber(json, "stopLoss");
   if (sl > 0) g_stopLoss = sl;

   int tp = (int)JsonGetNumber(json, "takeProfit");
   if (tp > 0) g_takeProfit = tp;

   int ver = (int)JsonGetNumber(json, "version");
   if (ver > 0) g_settingsVersion = ver;

   g_lastSettingsFetch = TimeCurrent();
   Print("[ATP] Settings loaded v", g_settingsVersion,
         " — ", g_direction, " ", g_symbol,
         " max:", g_maxTrades, " lot:", g_lotSize,
         " SL:", g_stopLoss, " TP:", g_takeProfit);
}

//+------------------------------------------------------------------+
//| Send trade-open to API                                           |
//+------------------------------------------------------------------+
void SendTradeOpen(long ticket, string symbol, string direction,
                   double openPrice, double volume, string openTime) {
   string body = StringFormat(
      "{\"ticket\":%d,\"symbol\":\"%s\",\"direction\":\"%s\","
      "\"openPrice\":%.5f,\"volume\":%.2f,\"openTime\":\"%s\"}",
      ticket, symbol, direction, openPrice, volume, openTime
   );
   PostToAPI("/api/mt5/trade-open", body);
   Print("[ATP] trade-open: #", ticket, " ", direction, " ", symbol, " @", openPrice);
}

//+------------------------------------------------------------------+
//| Send trade-close to API                                          |
//+------------------------------------------------------------------+
void SendTradeClose(long ticket, double closePrice, string closeTime,
                    double profit, string reason) {
   string body = StringFormat(
      "{\"ticket\":%d,\"closePrice\":%.5f,\"closeTime\":\"%s\","
      "\"profit\":%.2f,\"reason\":\"%s\"}",
      ticket, closePrice, closeTime, profit, reason
   );
   PostToAPI("/api/mt5/trade-close", body);
   string pnlSign = profit >= 0 ? "+" : "";
   Print("[ATP] trade-close: #", ticket, " P&L:", pnlSign, DoubleToString(profit, 2),
         " reason:", reason);
}

//+------------------------------------------------------------------+
//| Send heartbeat to API                                            |
//+------------------------------------------------------------------+
void SendHeartbeat(string status) {
   string body = StringFormat("{\"status\":\"%s\",\"timestamp\":\"%s\"}",
      status, TimeToString(TimeCurrent(), TIME_DATE | TIME_MINUTES | TIME_SECONDS));
   PostToAPI("/api/mt5/heartbeat", body);
}

//+------------------------------------------------------------------+
//| Get close reason text                                            |
//+------------------------------------------------------------------+
string GetCloseReason(ENUM_DEAL_REASON reason) {
   switch(reason) {
      case DEAL_REASON_TP: return "Take Profit";
      case DEAL_REASON_SL: return "Stop Loss";
      case DEAL_REASON_EXPERT: return "EA Close";
      default: return "Manual";
   }
}

//+------------------------------------------------------------------+
//| HTTP POST helper                                                  |
//+------------------------------------------------------------------+
void PostToAPI(string path, string body) {
   string url = API_URL + path;
   string headers = "Content-Type: application/json\r\n"
                  + "X-MT5-Secret: " + MT5_SECRET + "\r\n";
   char req[], resp[];
   string respHeaders;
   StringToCharArray(body, req, 0, StringLen(body));
   int status = WebRequest("POST", url, headers, 5000, req, resp, respHeaders);
   if (status < 0) {
      Print("[ATP] WebRequest error:", GetLastError(),
            " — Add URL to: Tools > Options > Expert Advisors");
   }
}

//+------------------------------------------------------------------+
//| Simple JSON string extractor                                     |
//+------------------------------------------------------------------+
string JsonGetString(string json, string key) {
   string search = "\"" + key + "\":\"";
   int start = StringFind(json, search);
   if (start < 0) return "";
   start += StringLen(search);
   int end = StringFind(json, "\"", start);
   if (end < 0) return "";
   return StringSubstr(json, start, end - start);
}

double JsonGetNumber(string json, string key) {
   string search = "\"" + key + "\":";
   int start = StringFind(json, search);
   if (start < 0) return 0;
   start += StringLen(search);
   string rest = StringSubstr(json, start, 20);
   return StringToDouble(rest);
}
