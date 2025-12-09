# Vercel Domain Setup Guide for propequitylab.com

**Domain**: propequitylab.com  
**Registrar**: Cloudflare  
**Hosting**: Vercel  
**Created**: December 9, 2025

---

## Quick Setup (5 minutes)

### Step 1: Add Domain in Vercel (2 minutes)

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your `property-portfolio-analyzer` project
3. Click **Settings** → **Domains**
4. Add domain: `propequitylab.com`
5. Click **Add**
6. Vercel will provide DNS records (see below)

---

### Step 2: Configure Cloudflare DNS (3 minutes)

**Vercel will give you one of these DNS configurations:**

#### Option A: CNAME Record (Most Common)
```
Type: CNAME
Name: @ (or propequitylab.com)
Target: cname.vercel-dns.com
Proxy status: DNS Only (grey cloud ☁️ - IMPORTANT!)
TTL: Auto
```

#### Option B: A Records (Alternative)
```
Type: A
Name: @
IPv4: 76.76.21.21
Proxy status: DNS Only (grey cloud ☁️)
TTL: Auto

Type: AAAA (IPv6)
Name: @
IPv6: 2606:4700:d0::a29f:c001
Proxy status: DNS Only (grey cloud ☁️)
TTL: Auto
```

#### Add www Subdomain (Recommended)
```
Type: CNAME
Name: www
Target: cname.vercel-dns.com
Proxy status: DNS Only (grey cloud ☁️)
TTL: Auto
```

---

### Step 3: Add DNS Records in Cloudflare

1. Log into Cloudflare: https://dash.cloudflare.com/
2. Select domain: **propequitylab.com**
3. Go to **DNS** → **Records**
4. Click **Add record**
5. Add the CNAME record from Vercel (see Option A above)
6. **IMPORTANT**: Set proxy status to **DNS Only** (grey cloud, NOT orange)
7. Save
8. Add www subdomain (optional but recommended)

---

### Step 4: Verify in Vercel (5-10 minutes)

1. Go back to Vercel → Settings → Domains
2. Wait for domain verification (5-10 minutes)
3. Once verified, you'll see: ✅ **propequitylab.com** (Valid Configuration)
4. Vercel will automatically provision SSL certificate

---

## Important Notes

### ⚠️ Cloudflare Proxy Status

**Use DNS Only (grey cloud ☁️)** for Vercel domains:
- Vercel needs direct DNS resolution
- If proxied (orange cloud), Vercel can't verify domain
- You can enable Cloudflare proxy AFTER domain is verified

### Why Grey Cloud Initially?

```
During Setup:
❌ Proxied (orange cloud) → Vercel can't verify domain
✅ DNS Only (grey cloud) → Vercel verifies successfully

After Verification:
✅ Can enable proxy (orange cloud) for:
   - Cloudflare CDN caching
   - DDoS protection
   - Analytics
```

---

## After Domain is Live

### Enable Cloudflare Features (Optional)

Once domain is verified in Vercel, you can enable:

1. **Cloudflare Proxy** (orange cloud)
   - Go to DNS Records
   - Click on record
   - Change to "Proxied" (orange cloud)
   - This adds Cloudflare CDN in front of Vercel

2. **Page Rules** (Free: 3 rules)
   - Cache static assets longer
   - Always use HTTPS
   - Redirect www to non-www (or vice versa)

3. **Email Routing** (Free)
   - Forward hello@propequitylab.com to your email
   - See separate guide below

---

## Environment Variables to Update

After domain is live, update these in Vercel:

```bash
# In Vercel Dashboard → Settings → Environment Variables

# Production
APP_URL=https://propequitylab.com
VERCEL_URL=propequitylab.com

# Update Resend FROM_EMAIL (optional)
FROM_EMAIL=hello@propequitylab.com
```

---

## Troubleshooting

### Domain Not Verifying?

**Check**:
1. DNS record is correct (CNAME → cname.vercel-dns.com)
2. Proxy status is **DNS Only** (grey cloud)
3. No conflicting A/AAAA records for @ hostname
4. Wait 10-15 minutes for DNS propagation

**Test DNS**:
```bash
# Check if DNS is pointing to Vercel
nslookup propequitylab.com

# Should show Vercel IPs
```

### SSL Certificate Not Provisioning?

**Wait**: Vercel auto-provisions Let's Encrypt SSL (5-15 minutes)

**If stuck**:
1. Remove domain from Vercel
2. Wait 5 minutes
3. Re-add domain
4. Vercel will retry SSL provisioning

### "Invalid Configuration" Error?

**Fix**:
1. Ensure CNAME target is exactly: `cname.vercel-dns.com`
2. No trailing dots or spaces
3. Proxy status is grey cloud (DNS Only)
4. Clear Cloudflare cache: Caching → Configuration → Purge Everything

---

## Cloudflare Email Routing Setup

### Setup (10 minutes)

1. Cloudflare Dashboard → Email → **Email Routing**
2. Click **Get Started**
3. Enable Email Routing (adds MX records automatically)
4. Add destination email (your personal email)
5. Create custom addresses:

```
hello@propequitylab.com → your@gmail.com
support@propequitylab.com → your@gmail.com
team@propequitylab.com → your@gmail.com
noreply@propequitylab.com → your@gmail.com
```

6. Verify destination email (check inbox for verification)

### Update Resend

```bash
# In Vercel → Environment Variables
FROM_EMAIL=hello@propequitylab.com
REPLY_TO=hello@propequitylab.com
```

---

## DNS Records Summary

After complete setup, your Cloudflare DNS should have:

```
Type: CNAME
Name: @
Target: cname.vercel-dns.com
Proxy: Proxied (orange) or DNS Only (grey)

Type: CNAME
Name: www
Target: cname.vercel-dns.com
Proxy: Proxied (orange) or DNS Only (grey)

Type: MX (Email Routing)
Name: @
Priority: 11
Target: amir.mx.cloudflare.net

Type: MX (Email Routing)
Name: @
Priority: 90
Target: isaac.mx.cloudflare.net

Type: MX (Email Routing)
Name: @
Priority: 46
Target: linda.mx.cloudflare.net

Type: TXT (Email Verification)
Name: @
Content: v=spf1 include:_spf.mx.cloudflare.net ~all
```

---

## Verification Checklist

After setup, verify:

- [ ] https://propequitylab.com loads correctly
- [ ] https://www.propequitylab.com redirects to propequitylab.com (or works)
- [ ] SSL certificate is valid (green padlock in browser)
- [ ] All pages and features work correctly
- [ ] Database queries work (tRPC API)
- [ ] Email sending works (Resend with new FROM_EMAIL)
- [ ] Email receiving works (send to hello@propequitylab.com)

---

## Next Steps

1. **Connect domain now** (use this guide)
2. **Wait 10-15 minutes** for DNS propagation
3. **Test website** at https://propequitylab.com
4. **Setup email routing** (optional, 10 mins)
5. **Update environment variables** in Vercel
6. **Enable Cloudflare proxy** (optional, for CDN caching)

---

**Need help?** Let me know if you encounter any issues! 🚀
