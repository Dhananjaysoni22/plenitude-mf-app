# Plenitude Analytics - Graph & Data Engine Documentation

This document explains the internal mechanics of how the platform generates and plots historical data and analytics across the RM Dashboards and Client Profile views.

## 1. Client History & AUM Growth Graphs

### The Data Ingestion Mechanism (How the data is captured)
Every single time an Excel or CSV portfolio file is uploaded via the **Bulk Upload Dashboard**, the backend (`upload.service.ts`) does two things:
1. It updates the client's live current metrics (`Client` table) so the dashboards are immediately accurate today.
2. It takes a permanent, timestamped snapshot and inserts it into the `ClientHistory` database table.

This means if you upload a client's portfolio once a week, the system automatically builds a historical timeline of their wealth without any extra effort. The `ClientHistory` table captures:
- `date`
- `totalAum`, `equityAum`, `debtAum`
- `totalInvested`, `totalGain`
- `overallCagr`, `overallAbsoluteReturn`

### The API & Frontend Plotting
When an RM clicks on a specific client to view their profile (`ClientDetailView.tsx`):
1. The React frontend makes a network request to:
   `GET /api/data/clients/:id/history`
2. The backend (`data.controller.ts -> fetchClientHistory`) queries the `ClientHistory` table, grabs all historical snapshots for that specific client, and sorts them chronologically (`orderBy: { date: 'asc' }`).
3. The data is fed directly into a `recharts` `<LineChart>`. The X-Axis maps to the `date`, and the Y-Axis plots the `totalAum` or `totalGain`. 

Because it plots the exact snapshots taken from the Excel sheets over time, the graph is 100% mathematically accurate to what the client's portfolio was actually worth on those dates.

---

## 2. Flight Risk Tracker (RM Action Dashboard)

The **Flight Risk Bar Chart** on the RM Dashboard is designed to instantly highlight clients who are bleeding the most capital.

### The Formula
When the RM dashboard loads, it hits the `GET /api/rm/intelligence` API endpoint.
1. The engine looks at every client's `ClientHistory`.
2. It finds the client's current AUM (today).
3. It finds the client's AUM from exactly 30 days ago (or the closest available snapshot).
4. **Formula:** `30-Day Growth = Current AUM - AUM 30 Days Ago`
5. It filters for clients where this growth is *negative* (meaning they lost money or withdrew funds).
6. It sorts the list from worst to best, takes the **Bottom 5**, and sends them to the frontend.

The frontend (`RmActionDashboard.tsx`) uses a horizontal `<BarChart>` to plot these negative numbers as bright red bars, visually showing the RM exactly who needs a reassuring phone call the most.

---

## 3. Drawdown Strategy Graph (Admin View)

The Admin **Strategy** tab includes a historical chart of the Market Drawdown.

### The Mechanism
1. Every night at 1:00 AM, the `drawdown.cron.ts` script runs automatically.
2. It fetches the NIFTY 50 live data from Yahoo Finance.
3. **Formula:** `Drawdown = ((52-Week Peak - Current Price) / 52-Week Peak) * 100`
4. The exact Drawdown percentage is saved into the `MarketHistory` table with today's timestamp.
5. The `MarketStrategyWidget` on the dashboard hits `GET /api/data/drawdown` and pulls the last 30 days of this history, plotting it as an `<AreaChart>` so RMs can visually see if the market is recovering or falling further.
