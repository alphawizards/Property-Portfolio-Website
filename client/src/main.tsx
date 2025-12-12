import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import { injectSpeedInsights } from "@vercel/speed-insights";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";
import { ClerkProvider } from "@clerk/clerk-react";

// Initialize Vercel Speed Insights
injectSpeedInsights();

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const rootElement = document.getElementById("root");

if (rootElement) {
  if (!PUBLISHABLE_KEY) {
    createRoot(rootElement).render(
      <div style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f9fafb',
        color: '#1f2937',
        textAlign: 'center',
        padding: '20px'
      }}>
        <h1 style={{ marginBottom: '16px', fontSize: '24px', fontWeight: 'bold' }}>Configuration Error</h1>
        <p style={{ color: '#4b5563' }}>Missing Clerk Publishable Key. Please check Vercel Environment Variables.</p>
      </div>
    );
  } else {
    createRoot(rootElement).render(
      <StrictMode>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              <App />
            </QueryClientProvider>
          </trpc.Provider>
        </ClerkProvider>
      </StrictMode>
    );
  }
}
