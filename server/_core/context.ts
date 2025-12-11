import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "../../drizzle/schema";
import { sessions, users } from "@clerk/clerk-sdk-node";
import * as db from "../db";

// Common context interface
export type TrpcContext = {
  req: CreateExpressContextOptions["req"] | Request;
  res?: CreateExpressContextOptions["res"];
  user: any | null;
};

// Logic to extract token from various request types
function getToken(req: any): string | undefined {
  // 1. Authorization Header
  const authHeader = req.headers.authorization || req.headers.get?.("authorization");
  if (authHeader && typeof authHeader === 'string') {
    return authHeader.replace('Bearer ', '');
  }

  // 2. Cookie
  // Express: req.cookies.__session
  if (req.cookies && req.cookies.__session) {
    return req.cookies.__session;
  }

  // Standard Request: parse Cookie header
  const cookieHeader = req.headers.cookie || req.headers.get?.("cookie");
  if (cookieHeader && typeof cookieHeader === 'string') {
    const match = cookieHeader.match(/__session=([^;]+)/);
    return match ? match[1] : undefined;
  }

  return undefined;
}

async function getUserFromRequest(req: any) {
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
    } else if (process.env.NODE_ENV === "test" || process.env.ENABLE_MOCK_AUTH === "true") {
      // Mock Auth for Testing/Dev
      const mockOpenId = "user_mock_123";
      let dbUser = await db.getUserByOpenId(mockOpenId);

      if (!dbUser) {
        await db.upsertUser({
          openId: mockOpenId,
          email: "mock@example.com",
          name: "Mock User",
          role: "user",
          loginMethod: "mock",
        });
        dbUser = await db.getUserByOpenId(mockOpenId);
      }
      user = dbUser;
    }
  } catch (err) {
    console.error("Auth verification failed:", err);
  }
  return user;
}

// For Express (Node)
export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  const { req, res } = opts;
  const user = await getUserFromRequest(req);
  return { req, res, user };
}

// For Fetch (Vercel Edge/Serverless)
export async function createFetchContext(opts: FetchCreateContextFnOptions): Promise<TrpcContext> {
  const { req, resHeaders } = opts;
  const user = await getUserFromRequest(req);
  return { req, user };
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
