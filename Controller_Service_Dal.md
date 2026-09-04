# Backend Architecture Refactor (Controller-Service-DAL)

We will restructure the backend codebase to strictly follow a multi-tier enterprise architecture. This ensures a clear separation of concerns, making the codebase highly testable, scalable, and maintainable.

## Goal
Extract all business logic and database queries from the `Controllers` into dedicated `Services` and Data Access Layers (`DAL`). 

* **DAL (Data Access Layer)**: The only place where `Prisma` is imported. It performs raw database operations (CRUD).
* **Services**: Contains core business logic (e.g., parsing Excel data, validating passwords, formatting outputs). It relies entirely on the DAL for data.
* **Controllers**: Stripped down to simply handle Express HTTP requests (`req`, `res`), parse parameters, call the Service, and return HTTP status codes.

---

## User Review Required

> [!WARNING]  
> This is a **massive structural refactor**. It will modify almost every file in the backend. 
> I will ensure that the frontend remains completely untouched and that all APIs retain their exact same JSON payload structures so the app doesn't break. 
> 
> Please review the proposed layer separation below and click **Proceed** if you approve.

---

## Proposed Changes

### 1. Data Access Layer (DAL)
We will create a new `src/dal` directory to isolate all Prisma database queries.

#### [NEW] `src/dal/user.dal.ts`
* `findUserByEmail(email)`
* `findUserById(id)`
* `findUserByNameAndRole(name, role)`
* `createUser(data)`

#### [NEW] `src/dal/client.dal.ts`
* `upsertClient(data)`
* `getClientsByRm(rmId)`
* `getAllClients()`
* `getClientDetails(clientId)`

#### [NEW] `src/dal/research.dal.ts`
* `upsertResearchFund(data)`
* `getAllResearchFunds()`
* `findResearchFundByName(name)`

#### [NEW] `src/dal/holding.dal.ts`
* `createHolding(data)`
* `getUnmappedHoldingsGrouped()`
* `updateHoldingsMapping(fundNameRaw, researchFundId)`
* `deleteHoldings()`

---

### 2. Services Layer
We will expand the `src/services` directory to handle all business rules.

#### [NEW] `src/services/auth.service.ts`
* `login(email, password)`: Validates credentials, generates JWT.

#### [NEW] `src/services/data.service.ts`
* `fetchClients(user)`: Checks user role, fetches via DAL.
* `fetchClientDetails(clientId, user)`: Fetches via DAL, verifies RM ownership.
* `fetchResearchFunds()`
* `fetchUnmappedFunds()`
* `mapFunds(fundNameRaw, researchFundId)`

#### [NEW] `src/services/upload.service.ts`
* `processClientSheet(buffer)`: Uses XLSX to parse buffer, handles currency conversion, loops & calls `client.dal.ts`.
* `processResearchSheet(buffer)`
* `processHoldingsSheet(buffer)`

#### [MODIFY] `src/services/notification.service.ts`
* Refactor to use the new DAL instead of calling Prisma directly.

---

### 3. Controllers Layer
We will strip down the existing controllers. They will no longer import `Prisma` or `xlsx`.

#### [MODIFY] `src/controllers/auth.controller.ts`
* Extracts `email`, `password` from `req.body`, calls `authService.login()`, handles 401/200 responses.

#### [MODIFY] `src/controllers/data.controller.ts`
* Extracts `req.user`, calls `dataService`, handles 403/404/200 responses.

#### [MODIFY] `src/controllers/upload.controller.ts`
* Extracts `req.file.buffer`, passes to `uploadService`, returns success counts or 500 errors.

---

## Verification Plan

### Automated Tests
* Restart the backend development server (`tsx watch`) and ensure it compiles without any TypeScript errors.
* Re-run `npx prisma generate` to ensure no schema regressions.

### Manual Verification
* **Frontend Connectivity**: Ensure the UI can still hit the backend routes without any 500 errors.
* **Upload Test**: Perform a quick Excel upload test (since `upload.controller.ts` contains the bulk of the complex logic).
