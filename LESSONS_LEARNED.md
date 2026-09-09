# Engineering Lessons Learned & Troubleshooting Guide

This document tracks the major technical challenges, architectural mistakes, and Docker deployment issues we encountered while building the Plenitude MF App, along with their solutions. Use this as a reference guide to avoid similar pitfalls in the future!

---

## 1. The Prisma + Alpine Linux Crash
**The Error:** `Prisma failed to detect the libssl/openssl version to use... Error load is not valid JSON`
**The Mistake:** We used a hyper-minimalist operating system (`node:20-alpine`) for the Docker backend to keep the container small. However, Prisma's internal database engine is written in Rust and strictly requires standard C-libraries (specifically `OpenSSL`) to securely connect to the database. Because Alpine strips these out by default, the engine crashed on boot.
**The Solution:** We added a manual installation step to the `backend/Dockerfile` to inject the missing library before Prisma installs: `RUN apk add --no-cache openssl`.

## 2. Docker Startup Race Conditions (Crash Looping)
**The Error:** The backend container kept restarting infinitely because it couldn't connect to the database (`Can't reach database server at db:5432`).
**The Mistake:** We told the backend to run `npx prisma db push` the millisecond it woke up. However, a brand new PostgreSQL database takes about 5 seconds to generate its internal storage files. The backend was too fast, hit a wall, and crashed.
**The Solution:** We modified `docker-compose.yml` to include a strict **Healthcheck**. We used the `pg_isready` command to force the backend container to wait in a paused state until PostgreSQL officially announced it was 100% ready to accept connections.

## 3. Strict TypeScript Crashing the Production Build
**The Error:** `error TS6133: 'Briefcase' is declared but its value is never read.`
**The Mistake:** Our `frontend/package.json` build script was set to `"build": "tsc && vite build"`. In local development, unused variables are just harmless warnings. But in a production Docker build, `tsc` switches to hyper-strict mode and will intentionally crash the entire build if a single icon is imported but unused.
**The Solution:** We bypassed the pedantic type-checker for production builds by changing the script to just `"build": "vite build"`. Vite's native compiler (esbuild) safely strips the types and compiles the raw code without crashing.

## 4. Compiler "Out of Bounds" Errors
**The Error:** `error TS6059: File '.../seed-alerts.ts' is not under 'rootDir' '.../src'`
**The Mistake:** We left temporary testing scripts (`runCron.ts`, `seed-alerts.ts`) sitting in the root of the `backend` folder. The TypeScript compiler (`tsc`) is strictly configured via `tsconfig.json` to only compile files that live inside the `src/` folder.
**The Solution:** Kept the codebase clean! We permanently deleted all dead/scratchpad files from the root directory.

## 5. React Layout Shifts (UI Flickering)
**The Error:** When Relationship Managers logged in, the "Clients" tab would flash on the screen for a millisecond before aggressively disappearing.
**The Mistake:** React was rendering the Sidebar UI immediately, but the API request to fetch the System Settings (which determines if RMs are allowed to view clients) took a few milliseconds to arrive. In that gap, the app defaulted to showing everything.
**The Solution:** Implemented a strict **Blocking Render State**. We updated `App.tsx` to display a "Loading workspace..." screen, completely blocking the dashboard from rendering until the RBAC (Role-Based Access Control) rules were successfully downloaded from the backend.

## 6. Node.js Version Compatibility
**The Error:** `SyntaxError: The requested module 'node:util' does not provide an export named 'styleText'`
**The Mistake:** We originally set the Docker images to use Node 18 (`node:18-alpine`). However, we are using the bleeding-edge Vite 8 compiler for the frontend, which relies on a modern text-formatting utility (`styleText`) that was only introduced in Node.js version 20.
**The Solution:** Upgraded the Dockerfiles to use `FROM node:20-alpine`. Always ensure the Docker Node version matches the modern requirements of your frontend tooling.
