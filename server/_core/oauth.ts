// @ts-nocheck
import { getRedisClient } from '../redis';
import { createSession } from '../sessions';
import { TRPCError } from '@trpc/server';
import { db } from '../db';
import { users, subscriptionTiers, userSubscriptions } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export async function handleOAuthCallback(code: string, state: string) {
  try {
    // Validate state to prevent CSRF
    const storedState = await validateOAuthState(state);
    if (!storedState) {
      throw new Error('Invalid OAuth state');
    }

    // Exchange code for token
    const tokenResponse = await exchangeCodeForToken(code);
    const userInfo = await getUserInfo(tokenResponse.access_token);

    // Check if user exists
    const existingUser = await db.getUserByOpenId(userInfo.sub);

    if (existingUser) {
      // Returning user - refresh session
      return createSession(existingUser.id);
    }

    // New user registration with transaction
    const userId = await db.transaction(async (tx) => {
      try {
        // Step 1: Create user record
        const [newUser] = await tx.insert(users).values({
          openId: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name,
          role: 'user', // Default role
          isActive: true,
          createdAt: new Date(),
        });

        if (!newUser || !newUser.insertId) {
          throw new Error('Failed to create user record');
        }

        const userId = newUser.insertId;

        // Step 2: Get or verify Basic tier exists
        const basicTier = await tx.query.subscriptionTiers.findFirst({
          where: eq(subscriptionTiers.name, 'basic'),
        });

        if (!basicTier) {
          throw new Error('Basic subscription tier not found in database');
        }

        // Step 3: Assign default subscription
        const [subscription] = await tx.insert(userSubscriptions).values({
          userId,
          tierId: basicTier.id,
          status: 'active',
          startDate: new Date(),
          endDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        if (!subscription || !subscription.insertId) {
          throw new Error('Failed to create user subscription');
        }

        return userId;
      } catch (txError) {
        console.error('User creation transaction failed:', txError);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to complete user registration',
          cause: txError,
        });
      }
    });

    // Create session for new user
    const session = createSession(userId);
    
    return {
      session,
      isNewUser: true,
      redirectUrl: '/dashboard?welcome=true',
    };
  } catch (error) {
    console.error('OAuth callback error:', error);
    
    if (error instanceof TRPCError) {
      throw error;
    }

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'OAuth authentication failed',
      cause: error,
    });
  }
}

/**
 * Validate OAuth state token to prevent CSRF attacks
 */
async function validateOAuthState(state: string): Promise<boolean> {
  const redis = await getRedisClient();
  const isValid = await redis.get(`oauth_state_${state}`);
  if (isValid) {
    await redis.del(`oauth_state_${state}`);
    return true;
  }
  return false;
}

/**
 * Exchange OAuth code for access token
 */
async function exchangeCodeForToken(code: string) {
  const response = await fetch('https://oauth.manus.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: process.env.OAUTH_CLIENT_SECRET,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    throw new Error(`OAuth token exchange failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get user info from OAuth provider
 */
async function getUserInfo(accessToken: string) {
  const response = await fetch('https://oauth.manus.com/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user info: ${response.statusText}`);
  }

  return response.json();
}