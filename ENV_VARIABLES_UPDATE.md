# Update Environment Variables for Production

**Your domain is live!** Now update environment variables in Vercel.

---

## Step 1: Go to Vercel Settings

1. **Vercel Dashboard**: https://vercel.com/dashboard
2. Click your **property-portfolio-analyzer** project
3. Click **Settings** (top navigation)
4. Click **Environment Variables** (left sidebar)

---

## Step 2: Add/Update These Variables

### **Required Variables**

#### 1. APP_URL
```
Name: APP_URL
Value: https://propequitylab.com
Environment: Production, Preview, Development
```

#### 2. VERCEL_URL (if not already set)
```
Name: VERCEL_URL
Value: propequitylab.com
Environment: Production
```

### **Optional But Recommended**

#### 3. FROM_EMAIL (for Resend - when you setup email)
```
Name: FROM_EMAIL
Value: hello@propequitylab.com
Environment: Production, Preview, Development
```

#### 4. REPLY_TO (for Resend)
```
Name: REPLY_TO
Value: hello@propequitylab.com
Environment: Production, Preview, Development
```

#### 5. TALLY_WEBHOOK_SECRET (we'll add this later)
```
Name: TALLY_WEBHOOK_SECRET
Value: [Generate with: openssl rand -hex 32]
Environment: Production, Preview, Development
```

#### 6. LOOPS_API_KEY (when you setup Loops.so)
```
Name: LOOPS_API_KEY
Value: [Get from Loops.so dashboard]
Environment: Production, Preview, Development
```

---

## Step 3: Redeploy Your App

After adding variables:

1. Go to **Deployments** tab (top navigation)
2. Find the latest deployment
3. Click **⋯** (three dots) → **Redeploy**
4. Click **Redeploy** to confirm

This applies the new environment variables.

---

## Current Environment Variables Checklist

Your app should already have these (from PostgreSQL migration):

- [ ] DATABASE_URL (PlanetScale PostgreSQL connection string)
- [ ] NODE_ENV (production)
- [ ] RESEND_API_KEY (if you have Resend account)
- [ ] STRIPE_SECRET_KEY (for subscriptions)
- [ ] STRIPE_WEBHOOK_SECRET (for Stripe webhooks)

**New ones to add**:

- [ ] APP_URL (https://propequitylab.com)
- [ ] VERCEL_URL (propequitylab.com)
- [ ] FROM_EMAIL (hello@propequitylab.com)

---

## Verification

After redeployment:

1. Visit https://propequitylab.com
2. Check browser console (F12 → Console tab)
3. Should see no errors related to environment variables
4. Test all features work correctly

---

**Ready for next step?** After updating env variables, we'll set up your Tally webhook!
