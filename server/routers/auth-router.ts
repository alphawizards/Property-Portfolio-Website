import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { sdk } from "../_core/sdk";
import * as db from "../db";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { sendWelcomeEmail } from "../_core/email";

export const authRouter = router({
    devLogin: publicProcedure
        .input(
            z.object({
                tier: z.enum(["FREE", "PREMIUM_MONTHLY", "PREMIUM_ANNUAL"]),
                role: z.enum(["user", "admin", "admin_readonly"]).default("user"),
                email: z.string().email().optional(),
                name: z.string().optional(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            // 1. Generate stable/deterministic mock identity
            const tierSuffix = input.tier.toLowerCase().replace("_", "-");
            const roleSuffix = input.role;
            const openId = `dev-${roleSuffix}-${tierSuffix}-${input.email?.split("@")[0] || "user"}`;

            const name = input.name || `Dev ${input.tier} ${input.role}`;
            const email = input.email || `${openId}@example.com`;

            // 2. Ensure User exists in DB with correct subscription settings
            // We explicitly set subscription fields to match the requested tier
            let stripeSubscriptionId = null;
            let subscriptionStatus: "active" | null = null;
            let subscriptionEndDate = null;

            if (input.tier !== "FREE") {
                stripeSubscriptionId = `sub_mock_${tierSuffix}`;
                subscriptionStatus = "active";
                // expiry in 1 year
                const date = new Date();
                date.setFullYear(date.getFullYear() + 1);
                subscriptionEndDate = date;
            }

            // First upsert the basic user record
            await db.upsertUser({
                openId,
                name,
                email,
                loginMethod: "dev-mock",
                lastSignedIn: new Date(),
                role: input.role === "admin" ? "admin" : "user",
            });

            // Then update subscription details specifically (as upsertUser might not cover all fields or logic differs)
            // We need to get the user ID first
            const user = await db.getUserByOpenId(openId);
            if (!user) throw new Error("Failed to create mock user");

            await db.updateUserSubscription(user.id, {
                subscriptionTier: input.tier,
                stripeSubscriptionId,
                subscriptionStatus,
                subscriptionEndDate,
            });

            // 3. Create Session Token
            const sessionToken = await sdk.createSessionToken(openId, {
                name,
                expiresInMs: ONE_YEAR_MS,
            });

            // 4. Set Cookie
            if (ctx.res) {
                const cookieOptions = getSessionCookieOptions(ctx.req as any);
                (ctx.res as any).cookie(COOKIE_NAME, sessionToken, {
                    ...cookieOptions,
                    maxAge: ONE_YEAR_MS,
                });
            }

            return { success: true, user };
        }),

    handleOAuthCallback: publicProcedure
        .input(z.object({
            code: z.string(),
            state: z.string(),
        }))
        .mutation(async ({ input, ctx }) => {
            const { code, state } = input;

            // Exchange code for token
            const tokenResponse = await sdk.exchangeCodeForToken(code, state);
            const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

            if (!userInfo.openId) {
                throw new Error("openId missing from user info");
            }

            // Check if new user
            const existingUser = await db.getUserByOpenId(userInfo.openId);
            const isNewUser = !existingUser;

            // Upsert User
            await db.upsertUser({
                openId: userInfo.openId,
                name: userInfo.name || null,
                email: userInfo.email ?? null,
                loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
                lastSignedIn: new Date(),
            });

            // Send welcome email
            if (isNewUser && userInfo.email) {
                try {
                    await sendWelcomeEmail(userInfo.name || 'there', userInfo.email);
                } catch (emailError) {
                    console.error('[OAuth] Failed to send welcome email:', emailError);
                }
            }

            // Create Session Token
            const sessionToken = await sdk.createSessionToken(userInfo.openId, {
                name: userInfo.name || "",
                expiresInMs: ONE_YEAR_MS,
            });

            // Return token so the caller (API route) can set the cookie
            return { success: true, token: sessionToken };
        }),

    me: publicProcedure.query(async ({ ctx }) => {
        return ctx.user || null;
    }),

    logout: publicProcedure.mutation(async ({ ctx }) => {
        if (ctx.res) {
            const cookieOptions = getSessionCookieOptions(ctx.req as any);
            (ctx.res as any).clearCookie(COOKIE_NAME, {
                ...cookieOptions,
                maxAge: -1,
            });
        }
        return { success: true };
    }),
});
