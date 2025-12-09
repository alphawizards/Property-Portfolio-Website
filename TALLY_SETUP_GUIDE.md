# Tally.so Setup Guide for PropEquityLab

**Purpose**: Create public feedback forms for users to submit feedback without logging in  
**Cost**: Free tier (unlimited forms, 100 responses/month) → Pro ($29/month for unlimited responses)  
**Setup Time**: 15 minutes

---

## Step 1: Create Tally.so Account (3 minutes)

1. Go to https://tally.so/
2. Click **Sign up** (top right)
3. Sign up with your email or Google account
4. Verify your email
5. Complete onboarding (skip templates for now)

---

## Step 2: Create Feedback Form (10 minutes)

### A. Start New Form

1. Dashboard → Click **New form**
2. Choose "Start from scratch"
3. Name: **PropEquityLab Feedback Form**

### B. Add Form Fields

Add these fields in order:

#### 1. **Category** (Dropdown/Multiple Choice)
```
Question: "What type of feedback is this?"
Type: Multiple choice (single selection)
Options:
- 🐛 Bug Report
- 💡 Feature Request
- ❤️ Praise
- 😕 Complaint
- 💬 General Feedback
- 🔧 Other

Required: Yes
```

#### 2. **Rating** (Rating/Opinion Scale)
```
Question: "How would you rate your overall experience?"
Type: Opinion scale (stars)
Scale: 1-5 stars
Required: No
```

#### 3. **Title** (Short Text)
```
Question: "Brief summary of your feedback"
Type: Input (short text)
Placeholder: "e.g., Can't see property details"
Max length: 255
Required: Yes
```

#### 4. **Details** (Long Text)
```
Question: "Please provide more details"
Type: Textarea (long text)
Placeholder: "Tell us more about your feedback..."
Min length: 10 characters
Max length: 5000
Required: Yes
```

#### 5. **Email** (Email)
```
Question: "Your email (optional - for follow-up)"
Type: Email
Required: No
```

#### 6. **Name** (Short Text)
```
Question: "Your name (optional)"
Type: Input (short text)
Required: No
```

### C. Configure Form Settings

1. Click **Settings** (top right)
2. **General**:
   - Form name: PropEquityLab Feedback
   - Public form: Yes
3. **After submit**:
   - Show message: "Thank you for your feedback! We'll review it shortly."
   - Allow multiple responses: Yes
4. **Notifications**:
   - Email notification: Enable
   - Send to: your@email.com
5. **Design**:
   - Theme: Match your brand colors (if you want)
   - Font: Keep default or customize

### D. Save and Publish

1. Click **Publish** (top right)
2. Copy the form URL (you'll need this)

---

## Step 3: Integrate with Your App

### Option A: Embed in Website Footer (Recommended)

The form can be embedded in your website or shared as a public link.

**Public Form URL**: 
```
https://tally.so/r/YOUR-FORM-ID
```

**Embed Code** (if you want to embed it):
```html
<iframe
  src="https://tally.so/embed/YOUR-FORM-ID?hideTitle=1"
  width="100%"
  height="600"
  frameborder="0"
  title="Feedback Form"
></iframe>
```

For now, just use the public link. You can add it to:
- Footer: "Send Feedback" link
- Help menu
- Settings page

### Option B: Setup Webhook (Advanced - Optional)

This sends responses directly to your database:

1. Tally Dashboard → Your form → **Integrations**
2. Click **Webhooks**
3. Add endpoint URL:
   ```
   https://propequitylab.com/api/trpc/feedback.submitAnonymous
   ```
4. Select events: **Form submitted**
5. Test webhook
6. Save

**Note**: You'll need to create a webhook handler endpoint for this to work. For MVP, skip this and just use email notifications.

---

## Step 4: Add Link to Your Website

Add the Tally form link to your website footer:

```tsx
// In your Footer component
<a 
  href="https://tally.so/r/YOUR-FORM-ID" 
  target="_blank" 
  rel="noopener noreferrer"
  className="text-muted-foreground hover:text-primary"
>
  Send Feedback
</a>
```

---

## Form URL to Use

After setup, update these locations with your Tally form URL:

1. **Website footer** - "Send Feedback" link
2. **Help/Support page** - "Submit Feedback" button
3. **Email signatures** - "Have feedback? [Click here]"
4. **Admin dashboard** - Link to view submissions

---

## Viewing Responses

### In Tally Dashboard

1. Go to https://tally.so/
2. Click your **PropEquityLab Feedback** form
3. Click **Responses** tab
4. View, filter, and export responses

### Email Notifications

You'll receive an email for each submission with all the details.

### Export Responses (Optional)

1. Responses tab → Click **Export**
2. Choose format: CSV or Excel
3. Import into your database (manual process)

---

## Free vs Pro Plan

| Feature | Free | Pro ($29/mo) |
|---------|------|--------------|
| Forms | Unlimited | Unlimited |
| Responses/month | 100 | Unlimited |
| File uploads | No | Yes |
| Custom domains | No | Yes |
| Remove Tally branding | No | Yes |
| Webhooks | Yes | Yes |
| Integrations | Basic | Advanced |

**Recommendation**: Start with Free plan. Upgrade to Pro when you hit 100 responses/month.

---

## Sample Form Preview

Here's what your form will look like:

```
┌─────────────────────────────────────────────┐
│  PropEquityLab Feedback                     │
├─────────────────────────────────────────────┤
│                                             │
│  What type of feedback is this? *           │
│  [Select one...]                            │
│  🐛 Bug Report                              │
│  💡 Feature Request                         │
│  ❤️ Praise                                  │
│  😕 Complaint                               │
│  💬 General Feedback                        │
│  🔧 Other                                   │
│                                             │
│  How would you rate your experience?        │
│  ☆ ☆ ☆ ☆ ☆                                 │
│                                             │
│  Brief summary of your feedback *           │
│  [_______________________________]          │
│                                             │
│  Please provide more details *              │
│  [________________________________          │
│   ________________________________          │
│   ________________________________]         │
│                                             │
│  Your email (optional)                      │
│  [_______________________________]          │
│                                             │
│  Your name (optional)                       │
│  [_______________________________]          │
│                                             │
│  [Submit Feedback]                          │
└─────────────────────────────────────────────┘
```

---

## Customization Tips

### 1. Add Your Logo
- Settings → Design → Upload logo
- Displays at top of form

### 2. Custom Thank You Message
- Settings → After submit → Custom message
- Example: "Thanks! We review all feedback within 24 hours."

### 3. Redirect After Submit
- Settings → After submit → Redirect to URL
- Redirect to: https://propequitylab.com/thank-you

### 4. Add Hidden Fields
- Add hidden fields to track source:
  - `source`: "tally"
  - `timestamp`: Auto-filled

---

## Testing Checklist

Before going live, test:

- [ ] Form loads correctly
- [ ] All required fields validated
- [ ] Optional fields work
- [ ] Star rating works
- [ ] Email notification received
- [ ] Thank you message displays
- [ ] Form is mobile-responsive
- [ ] Webhook triggers (if using)

---

## Maintenance

### Weekly
- Check responses in Tally dashboard
- Respond to urgent feedback
- Export responses if needed

### Monthly
- Review response count (approaching 100 limit?)
- Analyze feedback trends
- Update form if needed

---

## Quick Links

After setup, save these:

- **Tally Dashboard**: https://tally.so/
- **Your Form URL**: https://tally.so/r/YOUR-FORM-ID
- **Edit Form**: https://tally.so/forms/YOUR-FORM-ID/edit
- **Responses**: https://tally.so/forms/YOUR-FORM-ID/responses

---

## Next Steps

1. ✅ Create Tally account
2. ✅ Build feedback form (use template above)
3. ✅ Publish form
4. ✅ Add link to website footer
5. ✅ Test form submission
6. ✅ Verify email notification works

**Estimated time**: 15 minutes  
**Cost**: $0/month (start with free tier)

---

**Need help?** Tally has great docs: https://tally.so/help
