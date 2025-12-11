# Comprehensive Code Review Report

## Executive Summary

The codebase has a solid modern foundation using React, Express, tRPC, and Drizzle. However, it suffers from significant "dependency hell" (specifically around Vite versions), fragile environment configuration that breaks testing and development workflows, and potential inconsistencies in package management (`pnpm` vs `npm`).

The "dual schema" issue mentioned in previous context appears to be resolved, but documentation and scripts still reference the old structure.

## Key Findings

### 1. Critical: Dependency & Build Conflicts
*   **Vite Version Mismatch:** The project specifies `vite: ^7.1.7` in `devDependencies`, but `@builder.io/vite-plugin-jsx-loc` requires `vite@^4.0.0 || ^5.0.0`. This forces users to use `--legacy-peer-deps` to install packages, which risks runtime instability.
*   **Package Manager Confusion:** The project specifies `pnpm` in `package.json`, but `package-lock.json` (npm) files are being generated and committed. This leads to "split brain" dependencies where different developers or CI environments might install different trees.
*   **Recommendation:** Downgrade Vite to v5 (stable and widely supported) or remove the conflicting plugin. Enforce `pnpm` usage by adding `preinstall` scripts or engines checks.

### 2. High: Fragile Environment & Testing
*   **Hard Crashes on Missing Env Vars:** `server/_core/env.ts` calls `process.exit(1)` if environment variables (like `DATABASE_URL` or `CLERK_SECRET_KEY`) are missing. This makes it impossible to run unit tests or even start the app in a "mock" mode without a fully configured environment.
*   **Broken Test Suite:** Running `npm test` currently fails 100% of the time because the test runner hits the environment validation crash before running any tests.
*   **Recommendation:** Modify `env.ts` to allow missing variables in `NODE_ENV=test` or warn instead of exit during development. Implement a `setupFiles` in Vitest to mock these variables.

### 3. Medium: Database Schema Documentation Drift
*   **Resolved but Confusing:** The codebase previously had `schema.ts` (MySQL) and `schema-postgres.ts`. Now, `schema.ts` *is* the Postgres schema, and `schema-postgres.ts` is gone. However, several scripts (`test-drizzle-query.mjs`, documentation files) still import or reference `schema-postgres.ts`, which will cause them to fail.
*   **Recommendation:** Grep for `schema-postgres` and update all references to `schema.ts`. Update documentation to reflect the single-schema reality.

### 4. Low: Frontend/Backend Coupling
*   **Clerk Integration:** The frontend `LandingPage.tsx` relies on `ClerkProvider`. If the keys are invalid, the entire app (or at least the auth parts) fails to render or throws errors visible in the console, as seen during verification.
*   **Recommendation:** Ensure `ErrorBoundary` components are robust enough to handle auth service failures gracefully, perhaps showing a "Maintenance Mode" or simpler UI if auth is unreachable.

## Architecture Review

*   **Backend (`server/`):** Clean separation of concerns with `routers`, `core`, and `db`. tRPC usage provides good type safety.
*   **Frontend (`client/`):** Standard React + Vite structure. Component organization is reasonable.
*   **Database (`drizzle/`):** Schema is well-defined with relations. Migration history is present.

## Action Plan Recommendations

1.  **Fix Dependencies:** Align Vite versions and standardise on `pnpm`.
2.  **Fix Test Environment:** Update `server/_core/env.ts` to be lenient in `test` environment or provide a `.env.test` file.
3.  **Cleanup:** Remove all references to `schema-postgres.ts`.
4.  **CI/CD:** Add a CI step that strictly checks `pnpm-lock.yaml` and runs `pnpm install --frozen-lockfile`.
