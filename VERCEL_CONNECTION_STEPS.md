# Vercel + Cloudflare Connection Guide - PropEquityLab.com

**Follow these exact steps to connect your domain**

---

## Step 1: Add Domain in Vercel (2 minutes)

1. **Go to Vercel Dashboard**:
   - Visit: https://vercel.com/dashboard
   - Log in to your account

2. **Find Your Project**:
   - Look for `property-portfolio-analyzer` project
   - Click on it

3. **Go to Settings → Domains**:
   - Click **Settings** (top navigation)
   - Click **Domains** (left sidebar)

4. **Add Your Domain**:
   - In the "Add Domain" field, type: `propequitylab.com`
   - Click **Add**

5. **Vercel Will Show DNS Records**:
   - You'll see a screen with DNS configuration options
   - Most likely, Vercel will show you **Option 1** or **Option 2** below

---

## Step 2: Choose Your DNS Configuration

Vercel will recommend one of these configurations:

### **Option 1: CNAME Record (Most Common)**

If Vercel shows this, use these settings:

```
Record 1 (Root domain):
Type: CNAME
Name: @ (or leave blank, or propequitylab.com)
Target: cname.vercel-dns.com
Proxy: DNS Only (grey cloud ☁️)
TTL: Auto

Record 2 (www subdomain):
Type: CNAME
Name: www
Target: cname.vercel-dns.com
Proxy: DNS Only (grey cloud ☁️)
TTL: Auto
```

### **Option 2: A + AAAA Records (Alternative)**

If Vercel shows IP addresses instead:

```
Record 1 (IPv4):
Type: A
Name: @
IPv4 Address: 76.76.21.21
Proxy: DNS Only (grey cloud ☁️)
TTL: Auto

Record 2 (IPv6):
Type: AAAA
Name: @
IPv6 Address: 2606:4700:d0::a29f:c001
Proxy: DNS Only (grey cloud ☁️)
TTL: Auto

Record 3 (www):
Type: CNAME
Name: www
Target: cname.vercel-dns.com
Proxy: DNS Only (grey cloud ☁️)
TTL: Auto
```

**⚠️ IMPORTANT**: Write down which option Vercel shows you! We'll use this in the next step.

---

## Step 3: Add DNS Records in Cloudflare (3 minutes)

1. **Go to Cloudflare Dashboard**:
   - Visit: https://dash.cloudflare.com/
   - Log in to your account

2. **Select Your Domain**:
   - Click on **propequitylab.com**

3. **Go to DNS Settings**:
   - Click **DNS** in the left sidebar
   - Click **Records** tab

4. **Add the Records from Vercel**:

   **If Vercel showed CNAME (Option 1)**:

   ### Add Record 1 (Root):
   - Click **Add record**
   - Type: `CNAME`
   - Name: `@` (or leave blank)
   - Target: `cname.vercel-dns.com`
   - **Proxy status**: Click the cloud to make it **grey** (DNS Only)
   - TTL: Auto
   - Click **Save**

   ### Add Record 2 (www):
   - Click **Add record**
   - Type: `CNAME`
   - Name: `www`
   - Target: `cname.vercel-dns.com`
   - **Proxy status**: Click the cloud to make it **grey** (DNS Only)
   - TTL: Auto
   - Click **Save**

   **If Vercel showed A + AAAA (Option 2)**:

   ### Add Record 1 (A):
   - Click **Add record**
   - Type: `A`
   - Name: `@`
   - IPv4 address: `76.76.21.21`
   - **Proxy status**: **Grey cloud** (DNS Only)
   - TTL: Auto
   - Click **Save**

   ### Add Record 2 (AAAA):
   - Click **Add record**
   - Type: `AAAA`
   - Name: `@`
   - IPv6 address: `2606:4700:d0::a29f:c001`
   - **Proxy status**: **Grey cloud** (DNS Only)
   - TTL: Auto
   - Click **Save**

   ### Add Record 3 (www):
   - Click **Add record**
   - Type: `CNAME`
   - Name: `www`
   - Target: `cname.vercel-dns.com`
   - **Proxy status**: **Grey cloud** (DNS Only)
   - TTL: Auto
   - Click **Save**

---

## Step 4: Verify in Vercel (5-10 minutes)

1. **Go Back to Vercel**:
   - Return to Vercel → Settings → Domains

2. **Wait for Verification**:
   - Vercel will automatically check DNS records
   - This takes **5-10 minutes**
   - You'll see a spinner while it checks

3. **Success Indicators**:
   - ✅ Green checkmark next to `propequitylab.com`
   - Status: **Valid Configuration**
   - SSL: **Automatic (Let's Encrypt)**

4. **If It Fails**:
   - Wait another 5 minutes (DNS propagation can be slow)
   - Check that cloud icon is **grey** (not orange)
   - Verify Target/IP address matches exactly
   - Try clicking **Refresh** in Vercel

---

## Step 5: Test Your Website (2 minutes)

1. **Visit Your Domain**:
   - Open a new browser tab
   - Go to: https://propequitylab.com
   - Your website should load! 🎉

2. **Test www Subdomain**:
   - Go to: https://www.propequitylab.com
   - Should redirect to https://propequitylab.com

3. **Check SSL Certificate**:
   - Look for the **lock icon** 🔒 in browser address bar
   - Click it → Should say "Connection is secure"

4. **Test Features**:
   - Click around the website
   - Click **Feedback** button (bottom-right)
   - Submit test feedback
   - Check if properties load

---

## Step 6: Enable Cloudflare Proxy (Optional - After Verification)

**⚠️ ONLY DO THIS AFTER DOMAIN IS VERIFIED IN VERCEL**

Once Vercel shows ✅ green checkmark:

1. **Go Back to Cloudflare DNS**:
   - Dashboard → propequitylab.com → DNS

2. **Enable Proxy for Each Record**:
   - Find the CNAME records you added
   - Click the **grey cloud** ☁️
   - It will turn **orange** 🟠
   - This enables Cloudflare CDN

**Benefits of Orange Cloud**:
- ✅ Cloudflare CDN (faster loading)
- ✅ DDoS protection
- ✅ Analytics
- ✅ Caching (reduces Vercel bandwidth)

---

## Troubleshooting

### Problem: "Invalid Configuration" in Vercel

**Solution**:
1. Check cloud icon is **grey** (DNS Only), not orange
2. Verify Target is exactly: `cname.vercel-dns.com` (no trailing dot)
3. Wait 10-15 minutes for DNS propagation
4. Clear DNS cache:
   - Mac: `sudo dscacheutil -flushcache`
   - Windows: `ipconfig /flushdns`
   - Linux: `sudo systemd-resolve --flush-caches`

### Problem: DNS Changes Not Taking Effect

**Solution**:
1. Wait longer (DNS can take up to 1 hour, usually 5-10 mins)
2. Check DNS propagation: https://dnschecker.org/
   - Enter: `propequitylab.com`
   - Check if it shows Vercel IPs globally

### Problem: SSL Certificate Not Provisioning

**Solution**:
1. Vercel auto-provisions SSL (usually 5-15 minutes)
2. If stuck > 15 minutes:
   - Remove domain from Vercel
   - Wait 5 minutes
   - Re-add domain
   - Vercel will retry SSL provisioning

### Problem: Website Shows Vercel Default Page

**Solution**:
1. Vercel might be serving wrong project
2. Check: Settings → Domains → Make sure it's linked to `property-portfolio-analyzer` project

---

## Quick DNS Check Command

Run this in your terminal to check DNS:

```bash
# Check if DNS is pointing to Vercel
nslookup propequitylab.com

# Should show Vercel IPs (if using A records):
# 76.76.21.21 (IPv4)
# 2606:4700:d0::a29f:c001 (IPv6)

# Or CNAME to Vercel (if using CNAME):
# cname.vercel-dns.com
```

---

## After Connection Checklist

Once domain is connected:

- [ ] https://propequitylab.com loads correctly
- [ ] https://www.propequitylab.com works (or redirects)
- [ ] SSL certificate shows 🔒 (green padlock)
- [ ] All pages load correctly
- [ ] Feedback widget works
- [ ] Properties display correctly
- [ ] Database queries work
- [ ] tRPC API calls work

---

## Next: Update Environment Variables

After domain is connected, update these in Vercel:

1. **Vercel Dashboard → Settings → Environment Variables**

2. **Add/Update**:
   ```
   APP_URL=https://propequitylab.com
   VERCEL_URL=propequitylab.com
   ```

3. **Redeploy**:
   - Go to Deployments tab
   - Click **Redeploy** on latest deployment
   - This applies new environment variables

---

## Success Indicators

You know it's working when:

✅ Vercel shows green checkmark next to domain
✅ Browser shows 🔒 SSL lock icon
✅ Website loads at https://propequitylab.com
✅ All features work correctly
✅ Feedback widget appears and works
✅ No console errors in browser (F12)

---

**Estimated Total Time**: 10-15 minutes (plus 5-10 mins waiting for DNS propagation)

**Need help?** If you encounter any issues, check:
1. Cloudflare DNS records are correct
2. Cloud icon is **grey** during verification
3. Wait 10-15 minutes for DNS propagation
4. Try in incognito/private browser window

---

**Ready to connect?** Follow steps 1-6 above and let me know once Vercel shows the green checkmark! ✅
