import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "../../drizzle/schema";
import { sessions, users } from "@clerk/clerk-sdk-node";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: any | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  const { req, res } = opts;
  let user = null;

  try {
    // 1. Check for Clerk Token in Authorization header or Cookie
    // Clerk usually sends "Authorization: Bearer <token>"
    // or a "__session" cookie.

    // Explicitly cast to any to avoid TypeScript issues with Express Request types in some environments
    const safeReq = req as any;

    const authHeader = safeReq.headers?.authorization;
    const token = (typeof authHeader === 'string' ? authHeader.replace('Bearer ', '') : undefined) || safeReq.cookies?.__session;

    if (token) {
      const session = await sessions.verifySession(token, process.env.CLERK_SECRET_KEY || "");
      if (session) {
        user = await db.getUserByOpenId(session.userId); // Optimization: Try DB first

        if (!user) {
          // Fallback: Sync from Clerk if not in DB
          const clerkUser = await users.getUser(session.userId);
          const email = clerkUser.emailAddresses[0]?.emailAddress;
          await db.upsertUser({
            openId: session.userId,
            email: email,
            name: `${clerkUser.firstName} ${clerkUser.lastName}`,
            role: 'user',
            loginMethod: 'clerk'
          });
          user = await db.getUserByOpenId(session.userId);
        }
      }
    }
  } catch (err) {
    console.error("Auth verification failed:", err);
  }

  return {
    req,
    res,
    user,
  };
}

export async function createFetchContext(opts: FetchCreateContextFnOptions): Promise<TrpcContext> {
  const { req, resHeaders } = opts;
  let user = null;

  try {
    const authHeader = req.headers.get("authorization");
    const token = (authHeader ? authHeader.replace("Bearer ", "") : undefined);
    // Note: Generic Request doesn't give easy access to cookies without parsing.
    // For Vercel Edge/Serverless, Authorization header is preferred.

    if (token) {
      const session = await sessions.verifySession(token, process.env.CLERK_SECRET_KEY || "");
      if (session) {
        user = await db.getUserByOpenId(session.userId);

        if (!user) {
          const clerkUser = await users.getUser(session.userId);
          const email = clerkUser.emailAddresses[0]?.emailAddress;
          await db.upsertUser({
            openId: session.userId,
            email: email,
            name: `${clerkUser.firstName} ${clerkUser.lastName}`,
            role: 'user',
            loginMethod: 'clerk'
          });
          user = await db.getUserByOpenId(session.userId);
        }
      }
    }
  } catch (err) {
    console.error("Auth verification failed (fetch):", err);
  }

  return {
    req: req as any, // Cast generic Request to any to satisfy TrpcContext's likely Express requirement or update TrpcContext
    res: { setHeader: (k: string, v: string) => resHeaders.set(k, v) } as any, // Mock Response
    user,
  };
}
