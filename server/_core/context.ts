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
    const authHeader = req.headers.authorization;
    const token = (typeof authHeader === 'string' ? authHeader.replace('Bearer ', '') : undefined) || (req.cookies as any)?.__session;

    if (token) {
      // 2. Verify the session
      const session = await sessions.verifySession(token, process.env.CLERK_SECRET_KEY || "");

      if (session) {
        // 3. Sync with your local DB
        // We use Clerk's User ID (sub) to match your DB's openId
        const dbUser = await db.getUserByOpenId(session.userId);

        if (dbUser) {
          user = dbUser;
        } else {
          // Optional: Just-in-time creation if they don't exist in your DB yet
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
