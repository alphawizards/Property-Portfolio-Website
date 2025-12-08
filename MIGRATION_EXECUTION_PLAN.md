# Migration Execution Plan - Property Portfolio Website
## Methodical Phase-by-Phase Implementation

**Date Started:** December 7, 2025  
**Objective:** Migrate Property Portfolio SaaS from standalone React app to Astro + React Islands hybrid architecture  
**Constraint:** Preserve all existing tRPC backend logic, Shadcn UI components, and PlanetScale database

---

## 🎯 Phase 1: Foundation & tRPC Bridge (Week 1)
**Goal:** Establish working connection between Astro and existing tRPC backend  
**Success Criteria:** One test island successfully calls tRPC endpoint and displays data

### Phase 1 Logical Dependencies Analysis

**Prerequisites (MUST be completed first):**
1. ✅ property-astro folder exists with AstroWind template
2. ✅ Property-Portfolio-Website has working tRPC server
3. ✅ PlanetScale database is accessible
4. ✅ Node.js 18+ and pnpm are installed

**Constraints:**
- Cannot modify existing `server/routers.ts` (838 lines - too risky)
- Must preserve all Shadcn UI components exactly as-is
- Database schema in `drizzle/` must remain unchanged
- OAuth flow must continue working with existing credentials

**Order of Operations (Dependency Chain):**
```
1. Install dependencies
   ↓ (Required for: Config files)
2. Configure Astro for SSR + React
   ↓ (Required for: tRPC bridge)
3. Copy backend directories (server/, drizzle/, shared/)
   ↓ (Required for: Bridge imports)
4. Create tRPC API bridge
   ↓ (Required for: Client setup)
5. Create tRPC client utilities
   ↓ (Required for: Provider)
6. Create TRPCProvider component
   ↓ (Required for: Test island)
7. Create test island
   ↓ (Required for: Validation)
8. Verify data flows end-to-end
```

### Phase 1 Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| tRPC version mismatch | Medium | High | Use exact versions from Property-Portfolio-Website package.json |
| Path alias conflicts | Medium | Medium | Test imports immediately after setup |
| Shadcn CSS variables missing | High | Medium | Copy globals.css first, verify button renders |
| PlanetScale connection fails in SSR | Low | High | Test connection in API route before React island |
| CORS issues with tRPC | Medium | Medium | Add credentials: 'include' to httpBatchLink |

---

## 📋 Phase 1 Detailed Execution Steps

### Step 1.1: Install Required Dependencies (30 minutes)
**Reasoning:** Must install packages before configuring, as config files reference them.

```bash
cd property-astro

# Core Astro dependencies
pnpm add @astrojs/node@^9.5.1
pnpm add @astrojs/react@^4.4.2
pnpm add react@^18.2.0 react-dom@^18.2.0

# tRPC stack (EXACT versions from original app)
pnpm add @trpc/client@^11.6.0
pnpm add @trpc/react-query@^11.6.0
pnpm add @trpc/server@^11.6.0
pnpm add @tanstack/react-query@^5.90.2

# Database
pnpm add drizzle-orm@^0.44.5
pnpm add @planetscale/database@^1.19.0

# Shadcn UI dependencies (copy from original package.json)
pnpm add @radix-ui/react-dialog@^1.1.15
pnpm add @radix-ui/react-dropdown-menu@^2.1.16
pnpm add @radix-ui/react-label@^2.1.7
pnpm add @radix-ui/react-select@^2.2.6
pnpm add @radix-ui/react-slot@^1.2.3
pnpm add @radix-ui/react-tabs@^1.1.13
pnpm add class-variance-authority@^0.7.1
pnpm add clsx@^2.1.1
pnpm add tailwind-merge@^2.7.1
pnpm add lucide-react@^0.472.0

# Utilities
pnpm add zod@^3.24.1
pnpm add jose@^5.9.6

# Dev dependencies
pnpm add -D @types/react@^18.2.0
pnpm add -D @types/react-dom@^18.2.0
```

**Verification Checkpoint:**
```bash
# Check installations succeeded
pnpm list @trpc/server
pnpm list drizzle-orm
pnpm list react

# Expected: All show correct versions, no peer dependency warnings
```

**Risk Check:** If peer dependency warnings appear, resolve before proceeding.

---

### Step 1.2: Configure Astro for SSR + React (20 minutes)
**Reasoning:** Config must be correct before any code will run.

**File: `astro.config.mjs`**

```javascript
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'server', // CRITICAL: Enable SSR
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [
    react(), // Enable React islands
    tailwind({
      applyBaseStyles: false, // Use custom globals.css
    })
  ],
  vite: {
    resolve: {
      alias: {
        '@': '/src',
        '@/server': '/server',      // Point to copied server directory
        '@/shared': '/shared',       // Point to copied shared directory
        '@/drizzle': '/drizzle'      // Point to copied drizzle directory
      }
    },
    ssr: {
      // Bundle these for serverless environments
      noExternal: ['@radix-ui/*', '@planetscale/database'],
    },
    optimizeDeps: {
      exclude: ['@planetscale/database']
    }
  }
});
```

**Verification Checkpoint:**
```bash
pnpm dev
# Expected: Server starts without errors
# Visit http://localhost:4321
# Expected: AstroWind homepage renders
```

**Risk Check:** If build fails, check for typos in adapter or integration names.

---

### Step 1.3: Copy Backend Directories (15 minutes)
**Reasoning:** Bridge needs these files to import routers. Must preserve structure exactly.

```bash
# From property-astro directory

# Copy server/ directory (ENTIRE, no modifications)
cp -r ../Property-Portfolio-Website/server ./server

# Copy drizzle/ directory
cp -r ../Property-Portfolio-Website/drizzle ./drizzle

# Copy shared/ directory (if exists)
cp -r ../Property-Portfolio-Website/shared ./shared

# Copy Shadcn UI components
mkdir -p src/components/ui
cp -r ../Property-Portfolio-Website/client/src/components/ui/* src/components/ui/
```

**Verification Checkpoint:**
```bash
# Check files copied correctly
ls server/routers.ts          # Should exist
ls drizzle/schema.ts           # Should exist
ls src/components/ui/button.tsx # Should exist

# Verify no modifications were made
diff ../Property-Portfolio-Website/server/routers.ts ./server/routers.ts
# Expected: No differences
```

**Risk Check:** If files are missing, re-copy. If modifications occurred, revert.

---

### Step 1.4: Copy Shadcn CSS Variables (20 minutes)
**Reasoning:** Shadcn components will render incorrectly without CSS variables. Must happen before creating any React components.

**File: `src/styles/globals.css`** (Create new file)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**Source:** Copy exact values from `Property-Portfolio-Website/client/src/index.css`

**Verification Checkpoint:**
Create test page to verify CSS loaded:

```astro
---
// src/pages/test-styles.astro
import '@/styles/globals.css';
import { Button } from '@/components/ui/button';
---

<html>
  <body>
    <Button>Test Button</Button>
  </body>
</html>
```

```bash
pnpm dev
# Visit http://localhost:4321/test-styles
# Expected: Button renders with correct Shadcn styling
```

**Risk Check:** If button has no styling, CSS variables not loaded. Check import path.

---

### Step 1.5: Create tRPC API Bridge (45 minutes)
**Reasoning:** This is the CRITICAL component. Without this, React islands cannot communicate with backend.

**File: `src/pages/api/trpc/[trpc].ts`**

```typescript
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { APIRoute } from 'astro';

// Import existing router - DO NOT MODIFY
import { appRouter } from '@/server/routers';

// Import context creator - may need adjustment
import { createContext } from '@/server/_core/context';

/**
 * tRPC Bridge Handler
 * Routes all /api/trpc/* requests to existing tRPC backend
 */
export const ALL: APIRoute = async ({ request, locals, cookies }) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext: async () => {
      // IMPORTANT: Adjust based on your context.ts structure
      // Pass Astro.locals.user to tRPC context
      return createContext({
        user: locals.user || null,
        userId: locals.userId || null,
      });
    },
    onError: ({ error, type, path }) => {
      // Log errors for debugging
      console.error('tRPC Error:', {
        type,
        path,
        message: error.message,
        code: error.code,
      });
    },
  });
};
```

**Potential Issue:** `server/_core/context.ts` may expect Express request object. Check current implementation:

```bash
cat ../Property-Portfolio-Website/server/_core/context.ts
```

**If context expects Express req:** Modify `server/_core/context.ts` (MINIMAL change):

```typescript
// server/_core/context.ts (ONLY if needed)
export function createContext({ user, userId }: { user: any; userId: number | null }) {
  return {
    user,
    userId,
    // Add other context properties
  };
}

export type Context = ReturnType<typeof createContext>;
```

**Verification Checkpoint:**
```bash
pnpm dev

# Test tRPC endpoint directly
curl http://localhost:4321/api/trpc/system.health
# Expected: tRPC response (not 404)
```

**Risk Check:** If 404, check file name is exactly `[trpc].ts`. If 500 error, check context creation logic.

---

### Step 1.6: Create tRPC Client Utilities (30 minutes)
**Reasoning:** Client must be configured before Provider can use it.

**File: `src/utils/trpc.ts`**

```typescript
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@/server/routers';

// Create typed tRPC client
export const trpc = createTRPCReact<AppRouter>();

/**
 * Create tRPC client instance
 * Used by TRPCProvider
 */
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: '/api/trpc',
        
        // CRITICAL: Include credentials for cookies
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: 'include',
          });
        },
        
        // Optional: Add headers (e.g., CSRF token)
        headers() {
          return {
            // Add custom headers if needed
          };
        },
      }),
    ],
  });
}
```

**Type Export:** Ensure `server/routers.ts` exports `AppRouter` type:

```bash
# Check if AppRouter is exported
grep "export.*AppRouter" ../Property-Portfolio-Website/server/routers.ts
```

**If not exported:** Add to `server/routers.ts`:

```typescript
// At end of server/routers.ts
export type AppRouter = typeof appRouter;
```

**Verification Checkpoint:**
```bash
# Check TypeScript compilation
pnpm astro check
# Expected: No errors related to AppRouter type
```

**Risk Check:** If type errors, ensure path aliases are correct in tsconfig.json.

---

### Step 1.7: Create TRPCProvider Component (25 minutes)
**Reasoning:** Islands need this provider to wrap them. Must initialize QueryClient properly.

**File: `src/components/providers/TRPCProvider.tsx`**

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { trpc, createTRPCClient } from '@/utils/trpc';

interface TRPCProviderProps {
  children: ReactNode;
}

/**
 * tRPC + React Query Provider
 * Wraps React islands to enable tRPC hooks
 */
export function TRPCProvider({ children }: TRPCProviderProps) {
  // Create clients once per component instance
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  }));
  
  const [trpcClient] = useState(() => createTRPCClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

**Verification Checkpoint:**
```bash
# Check component compiles
pnpm astro check
# Expected: No TypeScript errors in TRPCProvider.tsx
```

---

### Step 1.8: Create Test Island (30 minutes)
**Reasoning:** Need simple component to verify entire chain works before migrating complex pages.

**File: `src/components/islands/TestIsland.tsx`**

```tsx
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';

/**
 * Test Island - Verifies tRPC Bridge Works
 * Should display data from backend
 */
export default function TestIsland() {
  // Test query - adjust based on your actual router
  const { data, isLoading, error } = trpc.portfolios.getAll.useQuery();
  
  if (isLoading) {
    return <div className="p-4">Loading portfolios...</div>;
  }
  
  if (error) {
    return (
      <div className="p-4 border border-destructive rounded">
        <h3 className="font-bold text-destructive">Error:</h3>
        <p>{error.message}</p>
      </div>
    );
  }
  
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-3xl font-bold">tRPC Bridge Test</h1>
      
      <div className="space-y-2">
        <p className="text-muted-foreground">
          Portfolios from backend: {data?.length || 0}
        </p>
        
        {data && data.length > 0 && (
          <div className="space-y-2">
            {data.map((portfolio: any) => (
              <div key={portfolio.id} className="border p-3 rounded">
                <p className="font-semibold">{portfolio.name}</p>
                <p className="text-sm text-muted-foreground">{portfolio.type}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <Button>Shadcn Button Test</Button>
    </div>
  );
}
```

**Note:** Adjust `trpc.portfolios.getAll` to match an actual query from your `server/routers.ts`.

---

### Step 1.9: Create Test Page (15 minutes)
**Reasoning:** Need Astro page to mount the island with provider.

**File: `src/pages/test-trpc.astro`**

```astro
---
import '@/styles/globals.css';
import { TRPCProvider } from '@/components/providers/TRPCProvider';
import TestIsland from '@/components/islands/TestIsland';
---

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>tRPC Bridge Test</title>
</head>
<body class="bg-background text-foreground">
  <TRPCProvider client:only="react">
    <TestIsland client:only="react" />
  </TRPCProvider>
</body>
</html>
```

**CRITICAL:** Use `client:only="react"` to prevent SSR issues during testing.

---

### Step 1.10: End-to-End Verification (30 minutes)
**Reasoning:** Must verify complete data flow before proceeding to Phase 2.

**Test Sequence:**

1. **Start Development Server:**
```bash
pnpm dev
```

2. **Open Browser DevTools:**
   - Navigate to: http://localhost:4321/test-trpc
   - Open Network tab
   - Filter by: "trpc"

3. **Expected Behavior:**
   - ✅ Page loads without errors
   - ✅ "Loading portfolios..." appears briefly
   - ✅ Network tab shows POST to `/api/trpc/portfolios.getAll`
   - ✅ Response status: 200
   - ✅ Response body: JSON with portfolio data
   - ✅ UI updates with portfolio list
   - ✅ Shadcn button has correct styling

4. **Failure Scenarios & Solutions:**

| Symptom | Cause | Solution |
|---------|-------|----------|
| 404 on /api/trpc | Bridge file not found | Check filename is exactly `[trpc].ts` |
| 500 error | Context creation failed | Check createContext parameters |
| No data displayed | Query not defined in router | Check router method name |
| Unstyled button | CSS variables not loaded | Check globals.css import |
| "window is not defined" | SSR issue | Ensure using `client:only="react"` |
| CORS error | Credentials not sent | Check httpBatchLink fetch config |

5. **Database Connection Test:**
```bash
# In separate terminal, check PlanetScale connection
node -e "
import('@planetscale/database').then(({ Client }) => {
  const client = new Client({ url: process.env.DATABASE_URL });
  client.execute('SELECT 1').then(() => console.log('✅ DB Connected'));
});
"
```

---

## Phase 1 Completion Criteria

**Before proceeding to Phase 2, ALL must be true:**

- [ ] ✅ Test page loads without errors
- [ ] ✅ tRPC query successfully fetches data from PlanetScale
- [ ] ✅ Data displays in React island
- [ ] ✅ Shadcn button has correct styling
- [ ] ✅ Network tab shows successful POST to /api/trpc
- [ ] ✅ No console errors in browser
- [ ] ✅ No build errors in terminal
- [ ] ✅ TypeScript compilation passes (`pnpm astro check`)
- [ ] ✅ Can refresh page and data persists

**Documentation:**
```bash
# Take screenshot of working test page
# Save network tab HAR file
# Document any deviations from plan

# Commit Phase 1
git add .
git commit -m "Phase 1: tRPC bridge working - Test island verified"
```

---

## Phase 1 Rollback Plan

**If Phase 1 fails after 4 hours of debugging:**

1. **Identify Breaking Change:**
   ```bash
   git diff HEAD
   ```

2. **Revert to Clean State:**
   ```bash
   git reset --hard HEAD
   ```

3. **Alternative Approach:**
   - Consider using REST API wrapper around tRPC instead
   - Use Astro API routes to proxy to Express server
   - Keep original app running, use Astro only for marketing pages

4. **Document Blocker:**
   - Create GitHub issue with error logs
   - Note specific error messages
   - Include package versions

---

## Next: Phase 2 Preview

**Only proceed when Phase 1 is 100% working.**

**Phase 2 Scope:**
- Add authentication middleware
- Create protected `/app` routes
- Test authenticated tRPC calls
- Migrate one simple dashboard page

**Phase 2 Entry Criteria:**
- Phase 1 completion criteria met
- Team reviewed Phase 1 results
- No critical bugs in Phase 1
- PlanetScale connection stable (>99% uptime in past 24h)

---

**Status:** Phase 1 Ready to Execute  
**Estimated Time:** 4-5 hours (with verification)  
**Risk Level:** Medium (tRPC bridge is new pattern)  
**Reversibility:** High (no changes to original app)
