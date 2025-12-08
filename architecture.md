# System Architecture: Vercel & PlanetScale Edition

## 1. Core Strategic Decision
**We are strictly adhering to the "Hybrid" Architecture:**
- **Application Layer (The "Dashboard"):**
  - **Codebase:** Existing React + Vite Repo (No Rewrite).
  - **Host:** Vercel (Serverless).
  - **DB:** PlanetScale (MySQL via Vitess).
  - **Purpose:** Complex interactivity, loan modeling, secure user data.
- **Marketing Layer (Future Phase):**
  - **Codebase:** Astro (New/Separate Project).
  - **Purpose:** SEO, Blog, Public Landing Page.

## 2. Infrastructure Constraints (Strict)

### A. Database: PlanetScale (MySQL)
- **Driver:** Must use `@planetscale/database`.
- **ORM:** Drizzle ORM in **MySQL Mode** (`drizzle-orm/mysql-core`).
- **Constraint:** **No Foreign Key Constraints.** PlanetScale does not support foreign key *constraints* at the engine level.
  - *Rule:* All relations must be defined in `drizzle/relations.ts` (application level), NOT in the SQL schema definition.
- **Migration:** All existing PostgreSQL schema files (`pgTable`) must be refactored to MySQL (`mysqlTable`).

### B. Compute: Vercel Serverless
- **Runtime:** Edge or Node.js Serverless Functions.
- **Constraint:** **Statelessness.** You cannot use in-memory sessions or local file storage.
  - *Auth:* Must use HTTP-Only Cookies (via strict headers) or a 3rd party like Clerk (Recommended for Vercel).
  - *Storage:* Local `fs` uploads will FAIL. Must use **Vercel Blob** or AWS S3 for document storage.
- **Entry Point:** The existing `server/index.ts` (Express listener) must be refactored into a Vercel API Handler (`api/trpc/[trpc].ts`).

## 3. "Single Source of Truth" Policy
- **Financial Math:** MUST live in `shared/calculations.ts`.
- **Usage:** Frontend imports for UI; Backend imports for DB data.
- **Zero Duplication:** If a formula exists in two places, it is a bug.