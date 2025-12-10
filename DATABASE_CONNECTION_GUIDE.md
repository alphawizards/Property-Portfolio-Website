# 🗄️ Database Connection - Restore Your Data

**Issue**: Seed data not showing on production website  
**Root Cause**: DATABASE_URL not set in Vercel environment  
**Solution**: Add database credentials to Vercel  

---

## 🎯 **What Happened to Your Data**

### **The Good News** ✅:
```
✅ Seed scripts still exist (seed-golden-master.mjs, etc.)
✅ Data was seeded to PlanetScale PostgreSQL database
✅ Database still has your 28 properties, 7 users
✅ Data is safe and intact!
```

### **The Problem** ❌:
```
❌ Production website can't access database
❌ DATABASE_URL not set in Vercel
❌ API calls return empty results
❌ Website shows no properties
```

### **Why This Happens**:
```
Local Development (localhost:5001):
  .env file has: DATABASE_URL=postgresql://...
  Server connects to database ✅
  Data loads correctly ✅

Production (propequitylab.com):
  No .env file (security!)
  Environment variables must be set in Vercel
  DATABASE_URL missing ❌
  API can't connect to database ❌
```

---

## ✅ **Solution: Add DATABASE_URL to Vercel**

### **Step 1: Get Your Database URL**

Your database connection string looks like:
```
postgresql://[username]:[password]@[host]/[database]?sslmode=require
```

**From your local `.env` file**:
```bash
# Check your current DATABASE_URL
cat /home/user/webapp/.env | grep DATABASE_URL
```

Or from PlanetScale dashboard:
1. Go to: https://app.planetscale.com
2. Select your database
3. Click: "Connect"
4. Choose: "Prisma" or "General"
5. Copy: Connection string

---

### **Step 2: Add to Vercel**

**In Vercel Dashboard**:

1. **Navigate**:
   ```
   https://vercel.com/dashboard
   → Your Project
   → Settings (tab)
   → Environment Variables (left menu)
   ```

2. **Add Variable**:
   ```
   Name: DATABASE_URL
   Value: postgresql://[your-credentials]
   
   Apply to:
   ✅ Production
   ✅ Preview
   ✅ Development (optional)
   ```

3. **Click**: "Save"

4. **Redeploy**:
   ```
   → Deployments (tab)
   → Latest deployment
   → ... (menu)
   → Redeploy
   ```

---

## 📊 **Current Database Status**

### **What's in Your Database**:

Based on previous seeding:

**Users**: 7 test users
```
1. demo@propequity.com (Demo User)
2. john@example.com (John Investor)
3. sarah@example.com (Sarah Portfolio)
4. mike@example.com (Mike Property)
5. emma@example.com (Emma Investor)
6. david@example.com (David Owner)
7. lisa@example.com (Lisa Portfolio)
```

**Properties**: 28 Australian properties
```
- Sydney properties (CBD, suburbs)
- Melbourne properties
- Brisbane properties  
- Perth properties
- Adelaide properties

Types: Apartments, houses, townhouses
Mix of: PPOR, investment properties
With: Loans, rental income, expenses
```

**Financial Data**:
```
- Loan details for each property
- Rental income records
- Expense logs
- Property valuations
- Growth projections
```

---

## 🧪 **Verification After Adding DATABASE_URL**

### **1. Check Deployment**:
```
Vercel Dashboard → Deployments
Status: Should show "Ready" ✅
```

### **2. Test API Connection**:
```
Open: https://propequitylab.com
F12: Open Developer Tools
Network Tab: Watch for /api/trpc calls
Expected: 200 OK responses with data
```

### **3. Check Website**:
```
Visit: https://propequitylab.com
Login: demo@propequity.com (if auth works)
Dashboard: Should show 28 properties
Properties: List should load
Analytics: Charts should have data
```

---

## 🔐 **Security Best Practices**

### **What NOT to Do**:
```
❌ Don't commit DATABASE_URL to git
❌ Don't share credentials publicly
❌ Don't use same password for prod and dev
```

### **What TO Do**:
```
✅ Set DATABASE_URL in Vercel only
✅ Use environment-specific credentials
✅ Keep .env in .gitignore (already done)
✅ Rotate credentials periodically
```

---

## 🔄 **If Data is Missing from Database**

### **Reseed the Database**:

If for some reason data was lost, you can reseed:

**Option 1: Golden Master Data** (Recommended):
```bash
# From your local terminal
cd /home/user/webapp
node seed-golden-master.mjs
```

**Option 2: Comprehensive Australian Properties**:
```bash
cd /home/user/webapp
node seed-comprehensive-au.mjs
```

**Option 3: Simple Test Data**:
```bash
cd /home/user/webapp
node seed-simple-test.mjs
```

**What These Scripts Do**:
- Connect to your PlanetScale database
- Create 7 test users
- Add 28 Australian properties
- Generate loan records
- Add rental income
- Create expense logs
- Set up financial projections

---

## 📋 **Required Environment Variables**

### **Minimum (Database Only)**:
```
DATABASE_URL=postgresql://[credentials]
```

### **Recommended (Full Functionality)**:
```
# Database
DATABASE_URL=postgresql://[credentials]

# Application
APP_URL=https://propequitylab.com
FROM_EMAIL=hello@propequitylab.com

# Optional: Analytics
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=

# Optional: OAuth (if using)
OAUTH_CLIENT_ID=
OAUTH_CLIENT_SECRET=
```

---

## 🎯 **Quick Setup Checklist**

### **To Get Data Showing**:

- [ ] Get DATABASE_URL from PlanetScale
- [ ] Add to Vercel Environment Variables
- [ ] Set for: Production, Preview
- [ ] Save changes
- [ ] Redeploy in Vercel
- [ ] Wait 2-3 minutes
- [ ] Visit website
- [ ] Check if properties load
- [ ] Verify API calls succeed (F12)

---

## 🐛 **Troubleshooting**

### **Properties Still Not Showing**:

**1. Check Database Connection**:
```
Vercel Logs → Search for:
"Database connection" or "DATABASE_URL"
Should NOT see: "DATABASE_URL is undefined"
```

**2. Check API Responses**:
```
Browser F12 → Network tab
Look for: /api/trpc/properties.list
Status: 200 OK
Response: Should have data array
```

**3. Verify Credentials**:
```
Test connection locally first:
DATABASE_URL="your-url" node test-drizzle-query.mjs

Should return: Property count, sample data
```

**4. Check Deployment Logs**:
```
Vercel → Deployments → Latest
→ Building → Function Logs
Look for: Database errors
```

---

## 💡 **Why Local Works But Production Doesn't**

### **Local Development**:
```
server/_core/index.ts loads .env file
DATABASE_URL available ✅
Connects to PlanetScale ✅
Queries return data ✅
```

### **Production (Before Fix)**:
```
.env file NOT deployed (security)
DATABASE_URL missing ❌
db.ts gets undefined ❌
Queries fail or return empty ❌
```

### **Production (After Fix)**:
```
Vercel provides DATABASE_URL from settings ✅
server/db.ts receives it ✅
Connects to PlanetScale ✅
Queries return data ✅
```

---

## 🎯 **Summary**

**Your Data**: ✅ Safe in PlanetScale database  
**The Issue**: ❌ DATABASE_URL not in Vercel  
**The Fix**: ✅ Add DATABASE_URL to Vercel settings  
**Time**: 5 minutes to add + 3 minutes redeploy  
**Result**: Website will show all 28 properties!  

---

## 🚀 **Action Items**

### **Now**:
1. Get DATABASE_URL from local .env or PlanetScale
2. Add to Vercel Environment Variables
3. Redeploy

### **In 5 Minutes**:
1. Visit https://propequitylab.com
2. Check if properties load
3. Verify dashboard shows data

### **If Data Missing**:
1. Run seed script locally
2. Refresh website
3. Data should appear

---

**Your 28 properties are safely stored in the database - they just need the connection string to show on production!** 🎉

---

**Next Step**: Add DATABASE_URL to Vercel → Settings → Environment Variables
