# 🔐 Login & Admin Guide

This guide explains how to log in to the application, access the seed data in development, and promote users to Admin status.

## 1. Development Mode (Seed Data)

In development mode, you can bypass the login screen to view the **Golden Master** seed data (3 properties, mixed portfolio).

### How to use it:
1.  Ensure `DEMO_MODE=true` is set in your `.env` file (it should be by default in dev).
2.  Start the dev server: `npm run dev`
3.  Visit `http://localhost:3000`
4.  You will be automatically logged in as **Demo Golden Master**.

> **Note**: This only works if `seed-golden-master.mjs` has been run locally.

## 2. Production / Standard Login

For the production environment (or if you disable Demo Mode), we use passwordless email login (Magic Links) or Social Login.

### How to log in:
1.  Visit the login page.
2.  Enter your email address.
3.  Click "Continue with Email".
4.  Check your inbox for the magic link.
5.  Click the link to be logged in.

## 3. Creating an Admin User

By default, new users are **Standard Users**. To access the Admin Dashboard, you must promote a user to the Admin role using the provided script.

### Steps to promote a user:
1.  **Log in** (or sign up) with the email you want to promote (e.g., `yourname@example.com`).
    *   *You must exist in the database first!*
2.  Open your terminal in the project root.
3.  Run the following command:

```bash
node scripts/make-admin.mjs yourname@example.com
```

### Expected Output:
```text
🔍 Looking for user with email: yourname@example.com...
found user: Your Name (ID: 15)
Current Role: user
✅ SUCCESS! User 'Your Name' is now an Admin.
```

## 4. Admin Features

Once promoted, you can access:
-   **Admin Dashboard**: View all users and system stats.
-   **Feedback Management**: View and reply to user feedback.
-   **System Settings**: Configure global application settings.

## Troubleshooting

**"User not found" error**:
-   Ensure you have actually logged in at least once so the user record is created in the database.
-   Check for typos in the email address.

**"Connection failed"**:
-   Ensure your `.env` file has the correct `DATABASE_URL`.
