# Data Import Guide

This document explains exactly how the Excel/CSV import system works in the Plenitude MF Manager, and provides a step-by-step guide on how you can modify it in the future if your Excel templates change.

---

## 🌊 The Import Flow
When a user uploads a file on the frontend, the following sequence occurs:
1. **React Frontend:** The `UploadDashboard.tsx` component packages the file into a `FormData` object and sends it via an HTTP POST request to the backend.
2. **Express Routes:** The request hits `src/routes/upload.routes.ts`.
3. **Multer Middleware:** The `src/middlewares/upload.ts` file intercepts the upload. Instead of saving the file to your hard drive, it stores the file temporarily in **Memory (Buffer)**. This makes the upload blazing fast.
4. **XLSX Parser:** The request reaches `src/controllers/upload.controller.ts`. The `xlsx` library reads the memory buffer and converts the Excel rows into an array of JSON objects.
5. **Prisma DB Insert:** The controller loops through the JSON objects, maps the Excel columns to database fields, and uses `prisma.upsert()` to either update existing records or create new ones securely.

---

## 🧠 How Column Mapping Works (Fuzzy Matching)
If you look inside `backend/src/controllers/upload.controller.ts`, you will see code like this:
```typescript
const keyEquity = keys.find(k => k.toLowerCase().includes('equity'));
const keyDebt = keys.find(k => k.toLowerCase().includes('debt'));
```

**Why do we do this?** 
Excel sheets are notorious for having hidden spaces in headers (e.g., `" EQUITY "` instead of `"EQUITY"`). If we used an exact match, the import would fail. By using `.toLowerCase().includes('equity')`, the code automatically finds the correct column no matter how it is capitalized or if it has trailing spaces.

---

## 💰 How Currency Parsing Works
In the same controller, there is a helper function called `parseCurrency`:
```typescript
const parseCurrency = (val: any) => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[₹, ]/g, '');
  return parseFloat(cleaned) || 0;
};
```
**Why do we do this?**
If a cell contains `1,25,000` or `₹5,00,000`, standard JavaScript will fail to read it as a number and save it as `1` or `0`. This function mathematically strips out all Rupees symbols (`₹`) and commas (`,`) so that it can be safely saved into the PostgreSQL database as a clean float (`125000`).

---

## 🛠️ How to Add a New Column to the Import

If your business requirements change and you add a new column to your Excel sheet (for example: **"Brokerage Fees"**), follow these 3 steps to import it into the system:

### Step 1: Add it to the Database Schema
Open `backend/prisma/schema.prisma` and add the new field to the `Client` model:
```prisma
model Client {
  // ... existing fields
  brokerageFees    Float?    @default(0)
}
```

### Step 2: Push the Schema to PostgreSQL
Open your terminal in the backend folder and run:
```bash
npx prisma db push
npx prisma generate
```
*(Note: If the backend server is running during this, you may need to stop it (`Ctrl + C`) before running the generate command on Windows to unlock the files).*

### Step 3: Map the column in the Controller
Open `backend/src/controllers/upload.controller.ts`, go to the `uploadClients` function, and find the new key dynamically:
```typescript
// 1. Find the key in the Excel row
const keyBrokerage = keys.find(k => k.toLowerCase().includes('brokerage'));

// 2. Add it to BOTH the 'update' and 'create' blocks of prisma.client.upsert:
await prisma.client.upsert({
  where: { pan: pan },
  update: {
    // ... existing fields
    brokerageFees: parseCurrency(row[keyBrokerage || ''])
  },
  create: {
    // ... existing fields
    brokerageFees: parseCurrency(row[keyBrokerage || ''])
  }
});
```

That's it! Your new Excel column will now be parsed, sanitized, and saved to the database automatically.
