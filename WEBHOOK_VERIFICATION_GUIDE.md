# 🔍 Webhook Verification & Testing Guide

**Date**: December 9, 2025  
**Status**: Webhooks Added - Now Testing  
**System**: PropEquityLab Feedback System

---

## ✅ **Current Status**

You've confirmed: **"ok i have added the webhooks"**

Now let's verify everything works end-to-end!

---

## 🧪 **Testing Plan** (20 minutes)

### **Test 1: Health Check** (2 minutes)

```bash
# Test webhook endpoint is alive
curl https://propequitylab.com/api/webhooks/tally/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-12-09T...",
  "database": "connected"
}
```

**Status**: ⏳ Need to verify

---

### **Test 2: In-App Feedback Widget** (3 minutes)

1. **Visit**: https://propequitylab.com
2. **Click**: Feedback button (bottom-right corner, 💬 icon)
3. **Fill out**:
   - Category: `Bug`
   - Rating: `⭐⭐⭐⭐` (4 stars)
   - Title: `Test submission from widget`
   - Message: `Testing the in-app feedback system. This should save to PostgreSQL.`
4. **Submit**
5. **Expected**: Success message appears
6. **Verify in Vercel Logs**:
   ```
   ✅ Feedback saved successfully! ID: <number>
   ```

**Status**: ⏳ Need to test

---

### **Test 3: Contact Form** (3 minutes)

1. **Visit**: https://tally.so/r/rj5Ly2
2. **Fill out form**:
   - Name: `Test User`
   - Email: `test@example.com`
   - Category: `General Inquiry`
   - Message: `Testing webhook integration for contact form`
3. **Submit**
4. **Check Tally Dashboard**:
   - Go to: https://tally.so/responses
   - Verify submission appears
5. **Check Vercel Logs**:
   - Go to: https://vercel.com/dashboard → Your Project → Logs
   - Filter by: `/api/webhooks/tally`
   - **Expected**: `✅ Feedback saved successfully!`
6. **Check Database**:
   - Source: `tally`
   - Category: `General Inquiry`
   - Title should contain: `Test User`

**Status**: ⏳ Need to test

---

### **Test 4: Feedback Form** (3 minutes)

1. **Visit**: https://tally.so/r/NprY5O
2. **Fill out**:
   - Type: `Bug Report`
   - Rating: `⭐⭐⭐` (3 stars)
   - Summary: `Dashboard not loading properties`
   - Details: `When I click Properties, the page stays blank for 5 seconds before loading.`
   - Email: `user@propequitylab.com`
3. **Submit**
4. **Verify**:
   - Tally shows success message
   - Vercel logs show: `✅ Feedback saved successfully!`
   - Database has entry with `rating: 3`, `source: 'tally'`

**Status**: ⏳ Need to test

---

### **Test 5: Features Request Form** (3 minutes)

1. **Visit**: https://tally.so/r/eqM2Zl
2. **Fill out**:
   - Feature: `Dark Mode`
   - Priority: `High`
   - Use Case: `I work at night and the bright UI hurts my eyes. Would love a dark theme!`
3. **Submit**
4. **Verify**:
   - Vercel logs: `✅ Feedback saved successfully!`
   - Category: `Feature Request` or parsed from form
   - Database: Contains "Dark Mode" in title or message

**Status**: ⏳ Need to test

---

### **Test 6: Landing Page Form** (3 minutes)

1. **Visit**: https://tally.so/r/pbrWx8
2. **Fill out**:
   - Name: `Jane Smith`
   - Email: `jane@example.com`
   - Company: `Smith Properties`
   - Properties: `5-10`
   - Message: `Interested in trying PropEquityLab for my rental portfolio`
3. **Submit**
4. **Verify**:
   - Vercel logs: Success
   - Database: Contains lead information
   - Source: `tally`

**Status**: ⏳ Need to test

---

### **Test 7: Verify Database** (3 minutes)

If you have database access, run these queries:

```sql
-- Check all feedback entries
SELECT 
  id,
  userId,
  category,
  rating,
  title,
  message,
  source,
  status,
  createdAt
FROM feedback
ORDER BY createdAt DESC
LIMIT 10;

-- Count by source
SELECT source, COUNT(*) as count
FROM feedback
GROUP BY source;

-- Check recent submissions (last hour)
SELECT COUNT(*) as recent_submissions
FROM feedback
WHERE createdAt > NOW() - INTERVAL '1 hour';
```

**Expected Results**:
- At least 6 entries (1 widget + 4 Tally forms + 1 extra test)
- Sources: `in-app`, `tally`
- All with `status: 'new'`

**Status**: ⏳ Need to query

---

## 🐛 **Troubleshooting**

### **Problem: Webhook Not Firing**

**Symptoms**:
- Tally form submits successfully
- No entry in Vercel logs
- Database has no new records

**Solution**:
1. **Check Webhook Configuration**:
   - Go to: https://tally.so/forms
   - Click your form → Integrations → Webhooks
   - Verify URL: `https://propequitylab.com/api/webhooks/tally`
   - Events: ✅ `Form submitted`
   - Status: ✅ Active (green)

2. **Test Webhook Manually**:
   ```bash
   # In Tally Dashboard, click "Test" button
   # Should see success message
   ```

3. **Check Vercel Logs**:
   ```bash
   # Go to: https://vercel.com/dashboard
   # → Your Project → Logs
   # Filter: /api/webhooks/tally
   # Time range: Last 1 hour
   ```

---

### **Problem: Data Not Saving**

**Symptoms**:
- Webhook fires (Vercel logs show request)
- But logs show error
- Database has no entry

**Common Errors**:

1. **Missing Required Fields**:
   ```
   ❌ Error: title is required
   ```
   **Fix**: Ensure Tally form has a field that maps to `title`

2. **Database Connection Error**:
   ```
   ❌ Database connection failed
   ```
   **Fix**: Check `DATABASE_URL` in Vercel environment variables

3. **Invalid Data Format**:
   ```
   ❌ Rating must be between 1-5
   ```
   **Fix**: Ensure rating field in Tally is number type (1-5)

**How to Debug**:
```bash
# Check full error in Vercel logs
1. Go to: https://vercel.com/dashboard → Logs
2. Click on the failed request
3. Look at "Function Logs" section
4. Copy error message
5. Share with me for help
```

---

### **Problem: Duplicate Submissions**

**Symptoms**:
- One form submit creates 2+ database entries

**Causes**:
- Multiple webhooks configured for same form
- Webhook retries (Tally retries on 5xx errors)

**Solution**:
1. **Check Webhook Count**:
   - Tally Dashboard → Form → Integrations
   - Should see exactly **1 webhook**
   - If multiple, delete extras

2. **Add Duplicate Prevention**:
   - Already implemented via `metadata.tallySubmissionId`
   - Should not save duplicates

---

### **Problem: Fields Not Mapping Correctly**

**Symptoms**:
- Title shows: `undefined`
- Category shows: `other`
- Rating is `null`

**Solution**:
The webhook handler tries to map fields intelligently:

```typescript
// Our mapping logic:
category → from field labeled "Category" or "Type"
rating → from field type "opinionScale" (star rating)
title → from first text field or submission ID
message → from field labeled "Message" or "Details"
email → from field type "email"
name → from field labeled "Name"
```

**How to Fix**:
1. Go to your Tally form
2. Check field labels match expected names
3. Or provide me with your form structure and I'll update the mapping

---

## 📊 **Success Metrics**

After completing all tests, you should have:

✅ **Vercel Logs**: 6+ successful webhook calls  
✅ **Database**: 6+ feedback entries  
✅ **Tally Dashboard**: 4+ responses (one per form)  
✅ **No Errors**: All tests passed  
✅ **Data Quality**: All fields populated correctly  

---

## 🎯 **Next Steps After Verification**

Once all tests pass:

### **1. Update Environment Variables** (5 minutes)
```bash
# In Vercel Dashboard:
APP_URL=https://propequitylab.com
FROM_EMAIL=hello@propequitylab.com

# Then: Deployments → Redeploy
```

### **2. Setup Cloudflare Email Routing** (10 minutes)
```bash
# Forward: hello@propequitylab.com → your-email@gmail.com
# Guide: /home/user/webapp/DOMAIN_AND_HOSTING_GUIDE.md
```

### **3. Build Admin Dashboard** (4-6 hours)
```bash
# Features:
- View all feedback
- Filter by category/status/date
- Update status (New → In Progress → Resolved)
- Add admin notes
- Mark as closed
- Statistics dashboard
```

### **4. Setup Loops.so** (30 minutes)
```bash
# Email campaign platform
# Send product updates
# Onboarding sequences
# Guide: /home/user/webapp/LOOPS_SETUP_GUIDE.md
```

---

## 📝 **Test Results Checklist**

Fill this out as you test:

### **Health Check**
- [ ] Endpoint returns `200 OK`
- [ ] Response shows "healthy"
- [ ] Timestamp is current

### **In-App Widget**
- [ ] Widget appears on website
- [ ] Form submits successfully
- [ ] Success message displays
- [ ] Vercel logs show success
- [ ] Database has entry

### **Contact Form**
- [ ] Form loads correctly
- [ ] Submission succeeds
- [ ] Tally shows response
- [ ] Webhook fires
- [ ] Database entry created

### **Feedback Form**
- [ ] Form loads
- [ ] All fields work
- [ ] Rating stars work
- [ ] Webhook fires
- [ ] Data saved correctly

### **Features Form**
- [ ] Form loads
- [ ] Submission works
- [ ] Webhook fires
- [ ] Category = "Feature Request"

### **Landing Page Form**
- [ ] Form loads
- [ ] Lead capture works
- [ ] Webhook fires
- [ ] Email saved

### **Database**
- [ ] 6+ entries total
- [ ] Sources: in-app, tally
- [ ] All statuses: "new"
- [ ] Timestamps correct
- [ ] No duplicates

---

## 🆘 **Get Help**

**If any test fails**:

1. **Share with me**:
   - Which test failed?
   - What error did you see?
   - Screenshot of Vercel logs
   - Screenshot of Tally webhook config

2. **Check these first**:
   - Webhook URL is exactly: `https://propequitylab.com/api/webhooks/tally`
   - No typos in URL
   - Webhook is Active (green toggle)
   - Event is "Form submitted"

3. **Quick fixes**:
   - Delete and re-add webhook
   - Test webhook in Tally dashboard
   - Check Vercel is deployed (not paused)
   - Verify DATABASE_URL is set

---

## 📞 **Support Resources**

- **Vercel Logs**: https://vercel.com/dashboard → Logs
- **Tally Dashboard**: https://tally.so/forms
- **Webhook Config**: Each form → Integrations → Webhooks
- **Database**: PlanetScale Dashboard
- **Docs**: All guides in `/home/user/webapp/`

---

## 🎉 **Completion**

Once all 7 tests pass, you'll have:

✅ **Fully functional feedback system**  
✅ **5 data collection channels**  
✅ **All data saving to PostgreSQL**  
✅ **Production-ready webhook integration**  
✅ **Real-time feedback tracking**  

**Then you can move to**: Building the admin dashboard to view and manage all this feedback!

---

**Status**: ⏳ READY TO TEST  
**Time Required**: 20 minutes  
**Difficulty**: Easy  

🚀 **LET'S VERIFY EVERYTHING WORKS!**
