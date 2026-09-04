# Plenitude Mutual Fund Analytics App

An enterprise-grade React & Node.js application designed for wealth management firms to automatically track, map, and analyze client mutual fund portfolios against internal research standards.

## 🚀 Key Features & Architecture

### 1. Smart Excel Ingestion Engine
Upload raw "AUM Clientwise" and "Portfolio Foliowise" Excel sheets directly into the system.
* **Auto-Staffing:** Automatically detects Relationship Managers (RMs) in the sheet and provisions new user accounts for them on the fly.
* **Smart Parsing:** Dynamically detects columns (Total, Equity, Debt, Units) and handles messy spreadsheet data.
* **Time-Series History [NEW]:** Every upload takes a permanent, timestamped snapshot of Client AUM and individual fund holdings. This `ClientHistory` and `HoldingHistory` data vault allows for exact calculation of Profit/Loss and Month-over-Month growth by tracking unit changes!

### 2. The Alert & Escalation Engine
A specialized dashboard built to ensure no client is left sitting in a bad mutual fund.
* **Q3 / Q4 Triggers:** Automatically flags clients who own Bottom Quartile or Below Average funds.
* **Dual-Role Dashboard:** 
  * **Super Admin View:** Sees a firm-wide overview of all alerts across all RMs.
  * **RM View:** Sees a personalized "To-Do" list of alerts for their specific clients with a "Mark as Resolved" action.
* **7-Day Auto-Escalation:** If an RM ignores an alert for more than 7 days, the system automatically flags it as `ESCALATED` for the Super Admin to review.

### 3. Manual Fund Mapping (Fuzzy Search)
* When a client's holding does not perfectly match your Research database spelling, it goes to the "Unmapped" queue.
* Powered by `react-select`, Admins can instantly fuzzy-search thousands of research funds and map them with a single click.
* **Memory Engine:** Mappings are saved permanently to `FundMappingRule`. Next time you upload an Excel sheet, the system remembers the mapping automatically!

### 4. Full-Screen Data Views
* **Maximized Real Estate:** The UI has been heavily optimized for massive datasets. Data tables intelligently stretch to `98%` width and calculate exact viewport height (`100vh - 280px`) to prevent dual-scrollbars.
* **Centralized Pagination:** Fast, client-side pagination with dynamic page sizing (10, 50, 100 rows).

### 5. Staff Management (Super Admin Exclusive)
* A dedicated dashboard for Super Admins to oversee their team of RMs.
* **Soft Deletes:** Deleting a staff member flips their `isActive` flag to false. They vanish from the UI but their historical client data and alerts are perfectly preserved in the database.

---

## 🛠️ Tech Stack & Architecture

### Frontend (React + Vite + Tailwind CSS)
* **Centralized API Layer:** The frontend utilizes a strict `api/` folder architecture (`data.api.ts`, `auth.api.ts`, etc.).
* **Interceptor Pattern:** `axiosClient.ts` automatically manages JWT authentication tokens, seamlessly injecting them into every network request.
* **Icons:** Lucide React

### Backend (Node.js + Express + Prisma + PostgreSQL)
* **Architecture:** Strict Controller-Service-DAL (Data Access Layer) separation.
* **Data Models:**
  - `User` (Staff / RMs)
  - `Client` & `ClientHistory`
  - `ClientHolding` & `HoldingHistory`
  - `ResearchFund` & `FundMappingRule`
  - `Notification` (Alerts)

---

## 💻 Running the App

**1. Start the PostgreSQL Database**
Ensure your local Postgres server is running and matches the `.env` URL.

**2. Start the Backend**
\`\`\`bash
cd backend
npm install
npx prisma db push
npm run dev
\`\`\`

**3. Start the Frontend**
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
