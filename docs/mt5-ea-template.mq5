//+------------------------------------------------------------------+
//| MTA Trader — MT5 Expert Advisor Webhook Template                  |
//| Purpose: Send trade events to mta-trader API                     |
//| How to use:                                                       |
//|   1. Set API_URL and MT5_SECRET in the inputs below              |
//|   2. Compile in MetaEditor (F7)                                   |
//|   3. Attach to any chart in MT5                                   |
//+------------------------------------------------------------------+
#property copyright "MTA Trader"
#property version   "1.00"
#property strict

#include <Trade\Trade.mqh>

//--- Inputs (set in MT5 EA settings panel)
input string API_URL   = "https://your-api.workers.dev";  // API base URL
input string MT5_SECRET = "your-secret-here";             // X-MT5-Secret value

//--- Track which tickets we've already reported
ulong g_reported_tickets[];

//+------------------------------------------------------------------+
//| Expert initialization                                             |
//+------------------------------------------------------------------+
int OnInit() {
   ArrayResize(g_reported_tickets, 0);
   // Start heartbeat timer (every 60 seconds)
   EventSetTimer(60);
   Print("[MTA] EA initialized — API: ", API_URL);
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Timer event — send heartbeat                                      |
//+------------------------------------------------------------------+
void OnTimer() {
   SendHeartbeat("RUNNING");
}

//+------------------------------------------------------------------+
//| Expert deinitialization                                           |
//+------------------------------------------------------------------+
void OnDeinit(const int reason) {
   EventKillTimer();
   SendHeartbeat("STOPPED");
}

//+------------------------------------------------------------------+
//| Trade event — fires when a position opens or closes              |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction &trans,
                        const MqlTradeRequest    &request,
                        const MqlTradeResult     &result) {

   // New position opened
   if (trans.type == TRADE_TRANSACTION_DEAL_ADD) {
      ulong deal_ticket = trans.deal;
      CDealInfo deal;
      if (!deal.SelectByTicket(deal_ticket)) return;

      if (deal.Entry() == DEAL_ENTRY_IN) {
         // Trade opened
         ulong position_id = deal.PositionId();
         if (!AlreadyReported(position_id)) {
            string direction = (deal.DealType() == DEAL_TYPE_BUY) ? "BUY" : "SELL";
            SendTradeOpen(
               position_id,
               deal.Symbol(),
               direction,
               deal.Price(),
               deal.Volume(),
               TimeToString(deal.Time(), TIME_DATE | TIME_MINUTES | TIME_SECONDS)
            );
            AddReported(position_id);
         }
      }
      else if (deal.Entry() == DEAL_ENTRY_OUT) {
         // Trade closed
         ulong position_id = deal.PositionId();
         SendTradeClose(
            position_id,
            deal.Price(),
            TimeToString(deal.Time(), TIME_DATE | TIME_MINUTES | TIME_SECONDS),
            deal.Profit()
         );
      }
   }
}

//+------------------------------------------------------------------+
//| Send POST /api/mt5/trade-open                                     |
//+------------------------------------------------------------------+
void SendTradeOpen(ulong ticket, string symbol, string direction,
                   double openPrice, double volume, string openTime) {

   string payload = StringFormat(
      "{\"ticket\":%I64u,\"symbol\":\"%s\",\"direction\":\"%s\","
      "\"openPrice\":%.5f,\"volume\":%.2f,\"openTime\":\"%s\"}",
      ticket, symbol, direction, openPrice, volume, openTime
   );

   PostToAPI("/api/mt5/trade-open", payload);
   Print("[MTA] trade-open sent — ticket:", ticket, " ", direction, " ", symbol);
}

//+------------------------------------------------------------------+
//| Send POST /api/mt5/trade-close                                    |
//+------------------------------------------------------------------+
void SendTradeClose(ulong ticket, double closePrice, string closeTime, double profit) {

   string payload = StringFormat(
      "{\"ticket\":%I64u,\"closePrice\":%.5f,\"closeTime\":\"%s\",\"profit\":%.2f}",
      ticket, closePrice, closeTime, profit
   );

   PostToAPI("/api/mt5/trade-close", payload);
   Print("[MTA] trade-close sent — ticket:", ticket, " profit:", profit);
}

//+------------------------------------------------------------------+
//| Send POST /api/mt5/heartbeat                                      |
//+------------------------------------------------------------------+
void SendHeartbeat(string status) {
   datetime now = TimeCurrent();
   string ts = TimeToString(now, TIME_DATE | TIME_MINUTES | TIME_SECONDS);

   string payload = StringFormat(
      "{\"status\":\"%s\",\"timestamp\":\"%s\"}",
      status, ts
   );

   PostToAPI("/api/mt5/heartbeat", payload);
}

//+------------------------------------------------------------------+
//| HTTP POST helper                                                  |
//+------------------------------------------------------------------+
void PostToAPI(string path, string body) {
   string url = API_URL + path;

   string headers = "Content-Type: application/json\r\n"
                  + "X-MT5-Secret: " + MT5_SECRET + "\r\n";

   char req_body[];
   StringToCharArray(body, req_body, 0, StringLen(body));

   char response[];
   string response_headers;

   int status = WebRequest("POST", url, headers, 5000, req_body, response, response_headers);

   if (status < 0) {
      Print("[MTA] WebRequest error — ", GetLastError(),
            " — Make sure to allow URL in MT5: Tools > Options > Expert Advisors");
   }
   else if (status >= 400) {
      Print("[MTA] API error ", status, " — ", CharArrayToString(response));
   }
}

//+------------------------------------------------------------------+
//| Track already-reported tickets to avoid duplicates               |
//+------------------------------------------------------------------+
bool AlreadyReported(ulong ticket) {
   for (int i = 0; i < ArraySize(g_reported_tickets); i++) {
      if (g_reported_tickets[i] == ticket) return true;
   }
   return false;
}

void AddReported(ulong ticket) {
   int n = ArraySize(g_reported_tickets);
   ArrayResize(g_reported_tickets, n + 1);
   g_reported_tickets[n] = ticket;
}
