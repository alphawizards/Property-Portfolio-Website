import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "../../drizzle/schema-postgres";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"] | Request;
  res: CreateExpressContextOptions["res"] | null;
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // DEMO MODE: Auto-login as demo user if no authentication
  // This allows viewing the seeded data without OAuth setup
  if (!user && process.env.NODE_ENV === 'development' && process.env.DEMO_MODE === 'true') {
    const { getUserByOpenId } = await import('../db');
    const demoUser = await getUserByOpenId('demo_golden_master_12345');
    if (demoUser) {
      console.log('[DEMO MODE] Auto-authenticated as demo user');
      user = demoUser;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}

export async function createFetchContext(
  opts: FetchCreateContextFnOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: null,
    user,
  };
}
