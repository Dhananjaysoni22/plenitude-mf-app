# Plenitude Mutual Fund Analytics App

An enterprise-grade React & Node.js application designed for wealth management firms to automatically track, map, and analyze client mutual fund portfolios against internal research standards.

## 🚀 Key Features & Architecture

### 1. Automated Bulk Portfolio Upload Engine
The legacy upload system is powered by a high-performance bulk processing engine.
* **Drag-and-Drop Interface:** Super Admins can drag and drop entire folders of client portfolio Excel sheets for batch processing.
* **Vertical Parsing Algorithm:** Intelligently iterates through vertically-stacked Investwell reports, safely ignoring category headers (Equity/Debt) and skipping invalid rows to prevent dummy holdings.
* **Regex Entity Extraction:** Built strict regex matchers to perfectly extract the Client Name and PAN number out of merged string formats (e.g., `Client: AADHYAA UDAWAT (ACQPU8551J)`).
* **Time-Series History:** Every upload takes a permanent snapshot of Client AUM and individual fund holdings, allowing for exact calculation of Profit/Loss and Month-over-Month growth!

### 2. Automated Drawdown Strategy Engine [NEW]
A completely automated, intelligent engine that dictates Equity/Debt allocation based on live market conditions.
* **Live Market Scraping:** A daily Node.js Cron Job connects to the Yahoo Finance API, fetching the live NIFTY 50 (`^NSEI`) price, finding its 52-week peak, and calculating the exact Market Drawdown percentage.
* **31-Step Strategy Grid:** The system maps the live drawdown against a highly specific 31-step grid (managed by the Admin) to find the Target Equity and Debt allocations for the day.
* **Market History Vault:** Every day's peak, price, and drawdown are permanently stored in the `MarketHistory` table to allow trend tracking over time.
* **Dashboard Intelligence:** Injects a "Market Strategy Widget" into the RM Dashboards displaying the live drawdown, the trendline, and the actionable recommended strategy.

### 3. The Smart Alert & Escalation Engine
A specialized dashboard built to ensure no client is left in a bad position.
* **Q3 / Q4 Triggers:** Automatically flags clients who own Bottom Quartile or Below Average funds.
* **Drawdown Rebalance Alerts:** The engine continuously scans client portfolios. If a client's actual Equity Allocation deviates from the Target Equity (dictated by the live drawdown) by more than **5%**, it generates an urgent `DRAWDOWN_ALERT` telling the RM to rebalance!
* **Deduplication:** The engine strictly validates the database to prevent duplicate alerts from being generated during batch uploads.
* **7-Day Auto-Escalation:** If an RM ignores an alert for more than 7 days, the system automatically flags it as `ESCALATED` for the Super Admin to review.

### 4. Advanced AI Fund Matcher (Similarity Engine)
* When a client's holding does not perfectly match your Research database spelling, the AI Similarity Engine kicks in.
* **Stop-Word Filtering:** Understands mutual fund nomenclature. Automatically strips out confusing filler words like `Reg`, `Direct`, `Growth`, `(G)`, and `Dividend` before comparing funds.
* **First-Word AMC Penalty:** The algorithm strictly evaluates the first word of the fund name (e.g., `Tata`, `Edelweiss`). If the AMC names do not match, the confidence score is slashed by 90%, preventing absurd mismatches.
* **Restored Editing:** Admins can easily edit and re-map funds that were previously mapped directly from the UI.

### 5. Client Financial Profile
* **Financial Analytics:** Displays `Total Invested Amount`, `Total Gain`, `Absolute Return`, and `Overall CAGR` across the entire portfolio.
* **Holding Metrics:** Tracks granular data points per holding, including `Purchase NAV`, `Current NAV`, and `Holding Days`.
* **Strategy Gauge:** Visually compares the client's actual Equity/Debt ratio against the market's current Recommended Target Ratio.

### 6. Security & Authentication
* **JWT Auth:** The entire platform is secured using JSON Web Tokens (`jsonwebtoken`).
* **Middleware Route Protection:** Every backend API route is locked behind strict middleware that decodes the user's Role and ID.
* **Axios Interceptors:** The React frontend automatically manages token injection on every network request.

---

## 🛠️ Tech Stack & Architecture

### Frontend (React + Vite + Tailwind CSS)
* **Centralized API Layer:** The frontend utilizes a strict `api/` folder architecture (`data.api.ts`, `auth.api.ts`, etc.).
* **Icons & Charts:** Lucide React, Recharts

### Backend (Node.js + Express + Prisma + PostgreSQL)
* **Architecture:** Strict Controller-Service-DAL (Data Access Layer) separation.
* **Data Models:**
  - `User`, `Client`, `ClientHistory`
  - `ClientHolding`, `HoldingHistory`
  - `ResearchFund`, `FundMappingRule`
  - `Notification`
  - `DrawdownRule`, `MarketHistory` (Strategy Engine)

---

## 💻 Running the App

**1. Start the PostgreSQL Database**
Ensure your local Postgres server is running and matches the `.env` URL.

**2. Start the Backend**
```bash
cd backend
npm install
npx prisma db push
npm run dev
```

**3. Start the Frontend**
```bash
cd frontend
npm install
npm run dev
```
