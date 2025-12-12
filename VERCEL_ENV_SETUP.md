# Deployment Configuration Guide

This application requires specific environment variables to function correctly. If you are seeing a "Configuration Error" screen or a blank page, it is likely due to missing configuration.

## Root Cause: Missing Clerk Key

The application performs a check at startup for the `VITE_CLERK_PUBLISHABLE_KEY`. If this key is missing, the application will display a "Configuration Error" message to prevent a hard crash.

## Vercel Deployment Setup

To fix this issue in your Vercel deployment:

1.  **Go to Vercel Dashboard:** Navigate to your project in Vercel.
2.  **Settings:** Click on the **Settings** tab.
3.  **Environment Variables:** Select **Environment Variables** from the left sidebar.
4.  **Add New Variable:**
    *   **Key:** `VITE_CLERK_PUBLISHABLE_KEY`
    *   **Value:** `pk_test_...` (or `pk_live_...` for production). You can find this in your [Clerk Dashboard](https://dashboard.clerk.com/) under **API Keys**.
5.  **Save:** Click **Save**.
6.  **Redeploy:** **Crucial Step!** You must redeploy your application for the new environment variable to take effect during the build process. Go to the **Deployments** tab and redeploy the latest commit.

## Local Development Setup

To avoid this issue locally:

1.  **Check for `.env`:** Ensure you have a `.env` file in the root directory.
2.  **Copy Example:** If you don't have one, copy the provided example:
    ```bash
    cp .env.example .env
    ```
3.  **Fill Values:** Open the `.env` file and populate the `VITE_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` with your Clerk credentials.

## Validation

After applying the fix and redeploying:

1.  Visit your application URL.
2.  The "Configuration Error" message should be gone.
3.  You should see the application load correctly (e.g., the Login button or Dashboard).
