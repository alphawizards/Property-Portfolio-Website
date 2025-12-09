# Tally.so Webhook Integration for PropEquityLab

**You have**: Tally API key ✅  
**Goal**: Connect Tally form submissions directly to your database

---

## What This Does

When someone submits feedback via your Tally form:
1. Tally sends data to your API webhook
2. Your API saves it to PostgreSQL database
3. You see it in your admin dashboard
4. No manual data entry needed! ✨

---

## Step 1: Create Webhook Endpoint (We'll do this together)

We need to create a public API endpoint that Tally can call.

### Option A: Use Existing tRPC Endpoint (Easiest)

Your app already has: `feedback.submitAnonymous` endpoint!

**Webhook URL will be**:
```
https://propequitylab.com/api/trpc/feedback.submitAnonymous
```

**But**: tRPC endpoints expect special format. We need a simple webhook handler.

### Option B: Create Dedicated Webhook Endpoint (Recommended)

Let's create a simple Express endpoint for Tally webhooks.

---

## Step 2: Add Tally Webhook Handler

I'll create the webhook handler for you:

```typescript
// server/webhooks/tally.ts
import { Router } from "express";
import { getDb } from "../db";
import { feedback } from "../../drizzle/schema-postgres";

export const tallyWebhookRouter = Router();

/**
 * Tally.so Webhook Handler
 * POST /api/webhooks/tally
 */
tallyWebhookRouter.post("/tally", async (req, res) => {
  try {
    const { data } = req.body;

    // Tally sends data in this format:
    // {
    //   eventId: "evt_...",
    //   eventType: "FORM_RESPONSE",
    //   createdAt: "2025-12-09T...",
    //   data: {
    //     respondentId: "resp_...",
    //     formId: "form_...",
    //     formName: "PropEquityLab Feedback",
    //     fields: [
    //       { key: "question_...", label: "Category", value: "Bug Report" },
    //       { key: "question_...", label: "Rating", value: "4" },
    //       { key: "question_...", label: "Title", value: "..." },
    //       { key: "question_...", label: "Details", value: "..." },
    //       { key: "question_...", label: "Email", value: "[email protected]" },
    //       { key: "question_...", label: "Name", value: "John Doe" }
    //     ]
    //   }
    // }

    if (!data || !data.fields) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    // Extract field values
    const fields = data.fields.reduce((acc: any, field: any) => {
      acc[field.label.toLowerCase()] = field.value;
      return acc;
    }, {});

    // Map category from Tally to database enum
    const categoryMap: { [key: string]: string } = {
      "🐛 Bug Report": "Bug",
      "💡 Feature Request": "Feature Request",
      "❤️ Praise": "Praise",
      "😕 Complaint": "Complaint",
      "💬 General Feedback": "General",
      "🔧 Other": "Other",
    };

    const category = categoryMap[fields.category] || "General";

    // Parse rating (convert string to number)
    const rating = fields.rating ? parseInt(fields.rating) : null;

    // Insert into database
    const db = await getDb();
    await db.insert(feedback).values({
      userId: null, // anonymous
      category: category as any,
      rating: rating,
      title: fields.title || fields["brief summary"] || "Untitled",
      message: fields.details || fields["please provide more details"] || "",
      userEmail: fields.email || fields["your email"] || null,
      userName: fields.name || fields["your name"] || null,
      source: "tally",
      status: "New",
      metadata: JSON.stringify({
        tallyEventId: data.eventId,
        tallyFormId: data.formId,
        tallyRespondentId: data.respondentId,
        submittedAt: data.createdAt,
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`✅ Tally webhook: Feedback saved from ${fields.email || "anonymous"}`);

    // Send success response to Tally
    res.status(200).json({
      success: true,
      message: "Feedback received",
    });
  } catch (error) {
    console.error("❌ Tally webhook error:", error);
    res.status(500).json({
      error: "Failed to process webhook",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
```

---

## Step 3: Register Webhook Router

Add this to your Express app:

```typescript
// server/_core/index.ts (or wherever your Express app is)

import { tallyWebhookRouter } from "../webhooks/tally";

// ... existing code ...

// Add webhook routes BEFORE tRPC handler
app.use("/api/webhooks", tallyWebhookRouter);

// ... rest of your routes ...
```

---

## Step 4: Test Webhook Locally (Before Setting Up in Tally)

### A. Install ngrok (to expose localhost to internet)

```bash
# Mac
brew install ngrok

# Windows
choco install ngrok

# Or download from: https://ngrok.com/download
```

### B. Start Your Dev Server

```bash
cd /home/user/webapp
npm run dev
```

Server should be running on http://localhost:5000

### C. Expose with ngrok

```bash
ngrok http 5000
```

You'll get a URL like:
```
https://abcd-1234-efgh.ngrok-free.app
```

Your webhook URL is:
```
https://abcd-1234-efgh.ngrok-free.app/api/webhooks/tally
```

### D. Test with curl

```bash
curl -X POST https://your-ngrok-url.ngrok-free.app/api/webhooks/tally \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "evt_test123",
    "eventType": "FORM_RESPONSE",
    "createdAt": "2025-12-09T10:00:00Z",
    "data": {
      "respondentId": "resp_test",
      "formId": "form_test",
      "formName": "Test Form",
      "fields": [
        { "key": "q1", "label": "Category", "value": "🐛 Bug Report" },
        { "key": "q2", "label": "Rating", "value": "4" },
        { "key": "q3", "label": "Title", "value": "Test Bug" },
        { "key": "q4", "label": "Details", "value": "This is a test bug report" },
        { "key": "q5", "label": "Email", "value": "[email protected]" },
        { "key": "q6", "label": "Name", "value": "Test User" }
      ]
    }
  }'
```

Should return:
```json
{
  "success": true,
  "message": "Feedback received"
}
```

---

## Step 5: Configure Webhook in Tally

Once your domain is live (https://propequitylab.com):

### A. Go to Tally Form Settings

1. **Tally Dashboard**: https://tally.so/
2. Click on your **PropEquityLab Feedback** form
3. Click **Integrations** (left sidebar)
4. Click **Webhooks**

### B. Add Webhook

1. Click **Add webhook**
2. **Webhook URL**: 
   ```
   https://propequitylab.com/api/webhooks/tally
   ```
3. **Events**: Select **Form submitted**
4. **Secret** (optional): Leave blank for now
5. Click **Save**

### C. Test Webhook in Tally

1. Click **Test webhook**
2. Tally will send a test payload
3. Check your server logs:
   ```
   ✅ Tally webhook: Feedback saved from [email protected]
   ```
4. Check your database:
   ```bash
   # In your database
   SELECT * FROM feedback WHERE source = 'tally' ORDER BY "createdAt" DESC LIMIT 5;
   ```

---

## Step 6: Add Webhook Security (Optional but Recommended)

Add a simple secret token to verify requests are from Tally:

### A. Generate Secret

```bash
# Generate random secret
openssl rand -hex 32
```

Copy the output (e.g., `abc123def456...`)

### B. Add to Environment Variables

In Vercel → Settings → Environment Variables:
```
TALLY_WEBHOOK_SECRET=abc123def456...
```

### C. Update Webhook Handler

Add verification at the top of webhook handler:

```typescript
// Verify webhook secret
const secret = req.headers["x-tally-signature"];
if (secret !== process.env.TALLY_WEBHOOK_SECRET) {
  return res.status(401).json({ error: "Unauthorized" });
}
```

### D. Update Tally Webhook Config

In Tally webhook settings:
- Add custom header: `X-Tally-Signature: abc123def456...`

---

## Field Mapping Reference

When creating your Tally form, use these exact field labels for automatic mapping:

| Tally Form Field Label | Database Column | Type |
|------------------------|-----------------|------|
| "Category" | category | Enum |
| "Rating" | rating | Integer (1-5) |
| "Title" or "Brief summary" | title | VARCHAR(255) |
| "Details" or "Please provide more details" | message | TEXT |
| "Email" or "Your email" | userEmail | VARCHAR(320) |
| "Name" or "Your name" | userName | VARCHAR(255) |

---

## Monitoring & Debugging

### View Webhook Logs in Vercel

1. Vercel Dashboard → Your project
2. Click **Logs** (top navigation)
3. Filter by `/api/webhooks/tally`
4. See all webhook requests and responses

### View in Tally Dashboard

1. Tally → Your form → Integrations → Webhooks
2. Click on your webhook
3. See **Recent deliveries** tab
4. View request/response for each submission

### Common Issues

#### Webhook Returns 404
- **Cause**: Route not registered
- **Fix**: Check `server/_core/index.ts` has `app.use("/api/webhooks", tallyWebhookRouter)`

#### Webhook Returns 500
- **Cause**: Database error or invalid data
- **Fix**: Check server logs in Vercel, verify field mapping

#### Data Not Saving
- **Cause**: Field labels don't match
- **Fix**: Update `categoryMap` and field extraction logic

---

## Testing Checklist

Before going live:

- [ ] Webhook endpoint responds to POST requests
- [ ] Test payload from Tally saves to database
- [ ] Field mapping is correct (category, rating, etc)
- [ ] Email and name are captured correctly
- [ ] Source is set to "tally"
- [ ] Metadata includes Tally event IDs
- [ ] Webhook returns 200 OK to Tally
- [ ] Logs show successful processing

---

## What Happens When User Submits Feedback

```
1. User fills out Tally form
   └─→ Clicks "Submit"

2. Tally receives submission
   └─→ Sends POST to https://propequitylab.com/api/webhooks/tally

3. Your API receives webhook
   └─→ Extracts fields from payload
   └─→ Maps category to enum
   └─→ Parses rating to integer
   └─→ Inserts into PostgreSQL database

4. Database stores feedback
   └─→ Feedback table gets new row
   └─→ Status: "New"
   └─→ Source: "tally"

5. You get notified
   └─→ Tally sends you email notification
   └─→ You can view in admin dashboard
   └─→ You can respond to user

6. User receives confirmation
   └─→ Tally shows "Thank you" message
```

---

## Next Steps After Integration

1. **Monitor first submissions**:
   - Watch webhook logs
   - Check database for new feedback
   - Verify field mapping is correct

2. **Build admin UI**:
   - View Tally submissions
   - Update status
   - Respond to feedback

3. **Setup email notifications**:
   - Get notified when new Tally feedback arrives
   - Use Resend to email admin

4. **Add to footer**:
   - Add Tally form link to website footer
   - Link text: "Send Feedback" or "Contact Us"

---

## Tally Form Public URL

After creating your form, you'll get a URL like:
```
https://tally.so/r/YOUR-FORM-ID
```

Add this to your website footer:

```tsx
// In Footer component
<a 
  href="https://tally.so/r/YOUR-FORM-ID" 
  target="_blank" 
  rel="noopener noreferrer"
  className="text-muted-foreground hover:text-primary transition-colors"
>
  📝 Send Feedback
</a>
```

---

## Summary

✅ **Created**: Tally webhook handler at `/api/webhooks/tally`  
✅ **Maps**: Tally form fields → PostgreSQL feedback table  
✅ **Handles**: Anonymous submissions from public form  
✅ **Stores**: All data + metadata (Tally event IDs)  
✅ **Secure**: Optional secret token verification  

**Time to setup**: 30 minutes (after domain is connected)  
**Cost**: $0 (free tier: 100 submissions/month)

---

**Ready to implement?** Let me know once your domain is connected to Vercel, and I'll create the webhook handler files for you! 🚀
