# Loops.so Setup Guide for PropEquityLab

**Purpose**: Send broadcast emails and marketing campaigns to your users  
**Cost**: Free tier (up to 2,000 contacts) → Paid ($49-149/month based on contacts)  
**Setup Time**: 20 minutes

---

## Step 1: Create Loops.so Account (5 minutes)

1. Go to https://loops.so/
2. Click **Sign up**
3. Sign up with email or Google
4. Verify your email
5. Complete onboarding:
   - Company name: PropEquityLab
   - Role: Founder / Product
   - Use case: Product updates & announcements

---

## Step 2: Connect Your Domain (10 minutes)

### A. Add Sending Domain

1. Loops Dashboard → **Settings** → **Sending**
2. Click **Add domain**
3. Enter: `propequitylab.com`
4. Loops will provide DNS records

### B. Add DNS Records in Cloudflare

Go to Cloudflare DNS settings and add these records:

```
Type: TXT
Name: @
Value: v=spf1 include:loops.so ~all

Type: TXT  
Name: loops._domainkey
Value: [Provided by Loops - unique DKIM key]

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:hello@propequitylab.com
```

### C. Verify Domain

1. After adding DNS records, wait 5-10 minutes
2. Go back to Loops → Click **Verify domain**
3. Once verified, you'll see ✅ green checkmark

### D. Set Default From Email

1. Settings → Sending
2. Default from email: `hello@propequitylab.com`
3. Default from name: `PropEquityLab Team`
4. Save

---

## Step 3: Import Your Contacts (5 minutes)

### Option A: Manual Import (For MVP)

1. Dashboard → **Contacts**
2. Click **Import contacts**
3. Upload CSV with columns:
   - `email` (required)
   - `firstName`
   - `subscriptionTier` (FREE, PREMIUM_MONTHLY, PREMIUM_ANNUAL)
   - `createdAt`

### Option B: API Integration (Recommended for Production)

Install Loops SDK:
```bash
npm install loops
```

Create a utility to sync users:

```typescript
// server/loops-sync.ts
import { LoopsClient } from "loops";

const loops = new LoopsClient(process.env.LOOPS_API_KEY!);

export async function syncUserToLoops(user: {
  email: string;
  name: string;
  subscriptionTier: string;
}) {
  try {
    await loops.createContact(user.email, {
      firstName: user.name?.split(" ")[0] || "",
      lastName: user.name?.split(" ")[1] || "",
      subscriptionTier: user.subscriptionTier,
      source: "app",
    });
  } catch (error) {
    console.error("Error syncing to Loops:", error);
  }
}
```

Call this function:
- When user signs up
- When user updates profile
- When subscription changes

---

## Step 4: Create Your First Campaign (10 minutes)

### A. Create Email Template

1. Dashboard → **Campaigns** → **New campaign**
2. Name: "Welcome to PropEquityLab"
3. Subject: "Welcome to PropEquityLab! 🏡"
4. From: hello@propequitylab.com

### B. Design Email

Use Loops' email editor:

```html
<h1>Welcome to PropEquityLab! 🏡</h1>

<p>Hi {{firstName}},</p>

<p>Thanks for joining PropEquityLab! We're excited to help you analyze and grow your property portfolio.</p>

<h2>Get Started</h2>

<ul>
  <li><a href="https://propequitylab.com/properties/new">Add your first property</a></li>
  <li><a href="https://propequitylab.com/dashboard">View your dashboard</a></li>
  <li><a href="https://propequitylab.com/subscription">Upgrade to Premium</a></li>
</ul>

<p>Need help? Reply to this email anytime!</p>

<p>
  Best,<br>
  The PropEquityLab Team
</p>

<hr>
<p style="font-size: 12px; color: #666;">
  PropEquityLab | <a href="https://propequitylab.com">Visit Website</a>
</p>
```

### C. Test Email

1. Click **Send test email**
2. Enter your email
3. Verify it looks good
4. Save draft

---

## Step 5: Integrate with Your App

### A. Install Loops Package

```bash
cd /home/user/webapp
npm install loops
```

### B. Add Environment Variables

In Vercel → Settings → Environment Variables:

```bash
LOOPS_API_KEY=your_loops_api_key_here
```

Get your API key from Loops: Settings → API Keys

### C. Create Loops Service

```typescript
// server/services/loops-service.ts
import { LoopsClient } from "loops";

const loops = new LoopsClient(process.env.LOOPS_API_KEY || "");

export const loopsService = {
  /**
   * Add or update contact
   */
  async upsertContact(email: string, data: {
    firstName?: string;
    lastName?: string;
    subscriptionTier?: string;
    userId?: number;
  }) {
    try {
      await loops.updateContact(email, data);
      console.log(`✅ Synced ${email} to Loops`);
    } catch (error) {
      console.error("❌ Loops sync error:", error);
    }
  },

  /**
   * Send transactional email
   */
  async sendEmail(email: string, transactionalId: string, data: any) {
    try {
      await loops.sendTransactionalEmail({
        email,
        transactionalId,
        dataVariables: data,
      });
      console.log(`✅ Sent email to ${email}`);
    } catch (error) {
      console.error("❌ Loops send error:", error);
    }
  },

  /**
   * Delete contact (when user deletes account)
   */
  async deleteContact(email: string) {
    try {
      await loops.deleteContact(email);
      console.log(`✅ Deleted ${email} from Loops`);
    } catch (error) {
      console.error("❌ Loops delete error:", error);
    }
  },
};
```

---

## Step 6: Create Broadcast System

### A. Add Loops Router

This is already done! Your feedback router will be extended for broadcasts.

### B. Create Admin Broadcast Page

Create a simple UI for admins to send emails:

**Admin Panel → Broadcasts → New Broadcast**

Fields:
- Recipient filter (All / Free / Premium)
- Subject line
- Email content (rich text editor)
- Schedule (Send now / Schedule for later)

---

## Pricing Tiers

| Contacts | Cost/Month | Notes |
|----------|------------|-------|
| 0 - 2,000 | **$0** | Free tier (perfect for MVP) |
| 2,001 - 5,000 | $49 | Includes all features |
| 5,001 - 10,000 | $99 | Includes all features |
| 10,001 - 25,000 | $149 | Includes all features |
| 25,000+ | Custom | Enterprise pricing |

**Unlimited emails** on all plans - you pay by contacts, not sends!

---

## Email Campaigns to Create

### 1. Welcome Series (Automated)
- **Email 1** (Day 0): Welcome + Get Started
- **Email 2** (Day 3): Did you add your first property?
- **Email 3** (Day 7): Upgrade to Premium (features overview)

### 2. Product Updates (Manual)
- Monthly product updates
- New feature announcements
- Tips & tricks

### 3. Engagement Campaigns
- Re-engagement for inactive users (last login >30 days)
- Upgrade reminders for free users
- Renewal reminders for premium users

### 4. Transactional Emails (via Loops)
- Welcome email
- Password reset
- Subscription confirmation
- Property added confirmation

---

## Segmentation Strategy

Create these segments in Loops:

### 1. **Free Users**
```
subscriptionTier = "FREE"
```

Use for: Upgrade campaigns, feature highlights

### 2. **Premium Users**
```
subscriptionTier IN ["PREMIUM_MONTHLY", "PREMIUM_ANNUAL"]
```

Use for: Advanced feature tutorials, renewal reminders

### 3. **New Users** (< 7 days)
```
createdAt >= now() - 7 days
```

Use for: Onboarding series

### 4. **Inactive Users** (> 30 days)
```
lastActive <= now() - 30 days
```

Use for: Re-engagement campaigns

---

## Best Practices

### ✅ Do's

1. **Personalize**: Use `{{firstName}}` in emails
2. **Segment**: Don't email everyone - target specific groups
3. **Test**: Always send test emails before campaigns
4. **Mobile**: Preview on mobile (50%+ opens are mobile)
5. **Clear CTA**: One primary action per email
6. **Unsubscribe**: Always include unsubscribe link (legal requirement)

### ❌ Don'ts

1. **Don't spam**: Max 2-3 marketing emails/week
2. **Don't buy lists**: Only email users who signed up
3. **Don't use "no-reply"**: Use hello@propequitylab.com
4. **Don't ignore metrics**: Track opens, clicks, unsubscribes
5. **Don't forget mobile**: Test on mobile devices

---

## Email Metrics to Track

Monitor these in Loops dashboard:

| Metric | Good | Average | Poor |
|--------|------|---------|------|
| **Open Rate** | >25% | 15-25% | <15% |
| **Click Rate** | >3% | 1-3% | <1% |
| **Unsubscribe Rate** | <0.5% | 0.5-1% | >1% |
| **Bounce Rate** | <2% | 2-5% | >5% |

**If metrics are poor**:
- Improve subject lines (A/B test)
- Segment better (send relevant content)
- Clean email list (remove bounces)
- Reduce email frequency

---

## Sample Email Templates

### 1. Welcome Email
```
Subject: Welcome to PropEquityLab! 🏡
From: PropEquityLab Team <hello@propequitylab.com>

Hi {{firstName}},

Welcome aboard! We're thrilled to have you at PropEquityLab.

Here's what you can do right now:
→ Add your first property
→ Explore the dashboard
→ See portfolio projections

Need help? Reply to this email anytime.

Best,
The PropEquityLab Team
```

### 2. Product Update
```
Subject: What's New at PropEquityLab - December 2025
From: PropEquityLab Team <hello@propequitylab.com>

Hi {{firstName}},

We've been busy building! Here's what's new:

🎨 New Dashboard Design
Your dashboard is now faster and more intuitive.

📊 Enhanced Analytics
View detailed property performance metrics.

📱 Mobile Improvements
Better experience on phones and tablets.

Try them out: https://propequitylab.com/dashboard

Have feedback? We'd love to hear it!

Best,
The PropEquityLab Team
```

### 3. Upgrade Reminder (Free → Premium)
```
Subject: {{firstName}}, unlock Premium features 🚀
From: PropEquityLab Team <hello@propequitylab.com>

Hi {{firstName}},

You've been using PropEquityLab for a while now!

Ready to unlock advanced features?

Premium includes:
✓ Unlimited properties
✓ 20-year forecasts
✓ Advanced analytics
✓ Scenario comparisons
✓ Export reports

Upgrade now and get 20% off: [CTA Button]

Questions? Reply to this email!

Best,
The PropEquityLab Team
```

---

## Testing Checklist

Before going live:

- [ ] Domain verified in Loops
- [ ] DNS records added in Cloudflare
- [ ] Test email sent successfully
- [ ] Email renders correctly on mobile
- [ ] Links work (click tracking enabled)
- [ ] Unsubscribe link works
- [ ] API integration tested
- [ ] Environment variables set in Vercel

---

## Maintenance

### Daily
- Check campaign performance (opens, clicks)
- Respond to email replies

### Weekly
- Review new contacts
- Clean bounced emails
- Plan next campaign

### Monthly
- Analyze engagement trends
- A/B test subject lines
- Update email templates

---

## Quick Links

After setup, save these:

- **Loops Dashboard**: https://loops.so/
- **Campaigns**: https://loops.so/campaigns
- **Contacts**: https://loops.so/contacts
- **Analytics**: https://loops.so/analytics
- **API Docs**: https://loops.so/docs

---

## Next Steps

1. ✅ Create Loops account
2. ✅ Add sending domain (propequitylab.com)
3. ✅ Verify DNS records
4. ✅ Create welcome email template
5. ✅ Test email sending
6. ✅ Install Loops package in app
7. ✅ Integrate with signup flow

**Estimated time**: 20 minutes  
**Cost**: $0/month (free tier up to 2,000 contacts)

---

**Need help?** Loops docs: https://loops.so/docs
