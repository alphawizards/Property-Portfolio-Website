# Domain & Hosting Guide for Property Portfolio Analyzer (2025)
## Best Strategy for Solopreneurs & Early-Stage SaaS Startups

**Last Updated**: December 9, 2025  
**Target Audience**: Solopreneurs, bootstrapped startups, early-stage SaaS  
**Your Current Stack**: Vercel (ready to deploy) + PlanetScale PostgreSQL

---

## 🎯 TL;DR - Best Setup for You

| Component | Recommended Provider | Cost | Why |
|-----------|---------------------|------|-----|
| **Domain** | Cloudflare Registrar | $9-15/year | At-cost pricing, no markup, free DNS |
| **Hosting** | Vercel (current) | $0-20/month | Already configured, perfect for your stack |
| **Database** | PlanetScale PostgreSQL | $0-39/month | Already using it |
| **CDN** | Cloudflare (free tier) | $0 | Auto-included with Vercel |
| **Total** | - | **$9-54/month** | vs traditional hosting: $50-200/month |

**Your Action Plan**: Buy domain on Cloudflare → Point to Vercel → Deploy (done in 30 minutes)

---

## 📊 Domain Registrar Comparison (2025)

### Top 3 Recommendations for Startups

| Registrar | .com Price | Renewal | Pros | Cons | Verdict |
|-----------|------------|---------|------|------|---------|
| **🏆 Cloudflare** | $9.77/yr | $9.77/yr | • At-cost (wholesale)<br>• No markup<br>• Free privacy protection<br>• Best DNS<br>• Easy SSL | • Must use Cloudflare DNS<br>• No first-year discounts | **BEST for SaaS** |
| **Porkbun** | $8.99/yr | $10.39/yr | • Cheap first year<br>• Free WHOIS privacy<br>• Free email forwarding<br>• User-friendly | • Slightly higher renewals<br>• Smaller company | Great alternative |
| **Namecheap** | $10.98/yr | $13.98/yr | • First-year discount<br>• Free WHOIS privacy<br>• Email forwarding<br>• Established brand | • Higher renewals<br>• Upsells on checkout | Good for beginners |

### Avoid These (For SaaS)

| Registrar | Why to Avoid |
|-----------|--------------|
| **GoDaddy** | Expensive renewals ($20+/year), aggressive upselling, cluttered UX |
| **Domain.com** | $10/year WHOIS privacy fee, renewal spam |
| **Network Solutions** | Expensive ($35/year), outdated interface |
| **Squarespace** | $20-30/year, locks you into their ecosystem |

---

## 🏆 Winner: Cloudflare Registrar

### Why Cloudflare is #1 for Your SaaS

```
✅ At-Cost Pricing
   - .com: $9.77/year (vs Namecheap: $13.98/year renewal)
   - .io: $29/year (vs Namecheap: $39.98/year)
   - No markup - you pay what Cloudflare pays the registry

✅ What's Included FREE
   - WHOIS privacy protection
   - DNSSEC security
   - World-class DNS (fastest in the world)
   - Free SSL certificates (via Cloudflare CDN)
   - Email forwarding (via Email Routing)
   - API access for automation

✅ Perfect for Vercel
   - Vercel + Cloudflare DNS = optimal performance
   - 30-second setup: Add CNAME record → Done
   - Cloudflare's CDN enhances Vercel's Edge Network

✅ No Hidden Fees
   - $9.77/year forever (no renewal price jumps)
   - No "domain privacy" upsells
   - No "premium DNS" fees
   - Transparent pricing
```

### Domain Pricing Comparison (.com)

| Registrar | Year 1 | Year 2 | Year 5 (Total) |
|-----------|--------|--------|----------------|
| **Cloudflare** | $9.77 | $9.77 | $48.85 |
| **Porkbun** | $8.99 | $10.39 | $50.55 |
| **Namecheap** | $10.98 | $13.98 | $66.90 |
| **GoDaddy** | $11.99 | $20.99 | $95.95 |

**5-Year Savings with Cloudflare**: $17-47 per domain

---

## 💻 Hosting Comparison for Your Stack

### Your Application Requirements

```typescript
// Your tech stack (from package.json)
- Frontend: React 19 + Vite 7
- Backend: Express + tRPC (Node.js)
- Database: PostgreSQL (PlanetScale)
- Build: pnpm, esbuild
- Runtime: Node.js (serverless functions)
```

### Option 1: Vercel (RECOMMENDED - Already Configured! ✅)

**Pricing**:
- Hobby Plan: **$0/month** (100GB bandwidth, 100 serverless invocations/day)
- Pro Plan: **$20/month** (1TB bandwidth, 6000 invocations/day)

**Pros**:
```
✅ You're already set up with vercel.json
✅ Zero-config deployment (git push → auto-deploy)
✅ Perfect for React + Express + tRPC
✅ Global Edge Network (300+ locations)
✅ Automatic HTTPS/SSL
✅ Preview deployments for PRs
✅ Built-in analytics
✅ Serverless functions (your tRPC API works out-of-box)
✅ Fast cold starts (~50-200ms)
✅ GitHub integration (already working)
```

**Cons**:
```
⚠️ Bandwidth limits (100GB free, then $40/TB)
⚠️ Build time limits (6000 mins/month on Pro)
⚠️ Can get expensive at scale (but you're early-stage)
```

**Best For**: Your exact use case - Vite + React + Express + tRPC SaaS app

**When to Upgrade to Pro ($20/mo)**:
- Traffic > 100GB/month (~25,000 page views)
- Need team collaboration
- Want advanced analytics
- Need longer build times

---

### Option 2: Cloudflare Pages (Alternative)

**Pricing**:
- Free Plan: **$0/month** (unlimited bandwidth!, 500 builds/month)
- Pro Plan: **$20/month** (5000 builds/month, advanced features)

**Pros**:
```
✅ UNLIMITED bandwidth (even on free tier!)
✅ Unlimited requests
✅ Great for static assets
✅ Cloudflare Workers for backend (serverless)
✅ Best global CDN
✅ Direct upload support
```

**Cons**:
```
⚠️ Your app needs migration work (currently built for Vercel)
⚠️ Workers (backend) have different API than Express
⚠️ More complex setup for full-stack apps
⚠️ Steeper learning curve
⚠️ Cold starts can be slower for DB queries
```

**Best For**: High-traffic static sites, or if you want to rewrite backend for Workers

**Migration Effort**: 8-15 hours (rewrite Express → Cloudflare Workers)

---

### Option 3: Railway / Render (Traditional VPS-Style)

**Pricing**:
- Railway: **$5/month** (512MB RAM, $0.000463/GB-second)
- Render: **$0-7/month** (free tier, then $7/month for 512MB)

**Pros**:
```
✅ Traditional server environment (easier debugging)
✅ More control over Node.js runtime
✅ Can run background jobs
✅ No serverless cold starts
```

**Cons**:
```
❌ You'd need to migrate away from Vercel config
❌ Manual SSL setup (though Render auto-does this)
❌ Slower deploys (5-10 mins vs Vercel's 1-2 mins)
❌ No preview deployments (unless Pro plan)
❌ Costs scale linearly (not serverless)
```

**Best For**: Apps with long-running processes, WebSockets, or heavy CPU tasks

---

### Hosting Comparison Summary

| Feature | Vercel (Current) | Cloudflare Pages | Railway/Render |
|---------|------------------|------------------|----------------|
| **Setup Time** | ✅ Already done | ⚠️ 8-15 hrs | ⚠️ 4-6 hrs |
| **Free Tier Bandwidth** | 100GB/month | ♾️ Unlimited | 100GB/month |
| **Cold Starts** | ✅ 50-200ms | ⚠️ 100-300ms | ✅ None (always-on) |
| **Deploy Speed** | ✅ 1-2 mins | ✅ 2-3 mins | ⚠️ 5-10 mins |
| **Edge Locations** | ✅ 300+ | ✅ 330+ | ⚠️ Limited |
| **Custom Domains** | ✅ Easy | ✅ Easy | ✅ Easy |
| **PostgreSQL Support** | ✅ Perfect | ✅ Good | ✅ Perfect |
| **Express.js Support** | ✅ Native | ⚠️ Need Workers | ✅ Native |
| **Learning Curve** | ✅ Easy | ⚠️ Medium | ✅ Easy |
| **Cost at Scale** | ⚠️ Higher | ✅ Lower | ⚠️ Higher |

**Verdict for You**: **Stay on Vercel**. You're already configured, it's perfect for your stack, and migration would waste 8-15 hours.

---

## 🚀 Your Recommended Setup (Total Cost Breakdown)

### Phase 1: Launch (0-1000 Users)

| Service | Plan | Cost/Month | Notes |
|---------|------|------------|-------|
| **Domain** | Cloudflare | $0.81/mo ($9.77/yr) | At-cost .com domain |
| **Hosting** | Vercel Hobby | $0/mo | 100GB bandwidth, perfect for MVP |
| **Database** | PlanetScale Scaler Pro | $39/mo | 100GB storage, 10B row reads |
| **Email** | Resend Free | $0/mo | 100 emails/day (already using) |
| **Total** | - | **$39.81/month** | Full production SaaS stack |

**When You'll Hit Limits**:
- ~25,000 monthly visitors (100GB Vercel bandwidth)
- ~3,000 emails/month (Resend free tier)

---

### Phase 2: Growth (1000-10,000 Users)

| Service | Plan | Cost/Month | Notes |
|---------|------|------------|-------|
| **Domain** | Cloudflare | $0.81/mo | Same |
| **Hosting** | Vercel Pro | $20/mo | 1TB bandwidth, team features |
| **Database** | PlanetScale Scaler Pro | $39/mo | Same (handles 10k users easily) |
| **Email** | Resend Starter | $20/mo | 50k emails/month |
| **CDN** | Cloudflare (optional) | $0/mo | Extra caching layer |
| **Total** | - | **$79.81/month** | Handles 10k users comfortably |

**When You'll Hit Limits**:
- ~250,000 monthly visitors (1TB Vercel bandwidth)
- 50,000 emails/month

---

### Phase 3: Scale (10,000+ Users, $50k+ MRR)

**Option A: Stay on Vercel**
```
- Vercel Pro: $20/month + overage fees
- If 10TB bandwidth/month: ~$400/month total
- PlanetScale Enterprise: $200-500/month
- Resend Pro: $80/month (500k emails)

Total: $700-1000/month
```

**Option B: Migrate to Cloudflare**
```
- Cloudflare Pages: $20/month (unlimited bandwidth!)
- Cloudflare Workers: $5/month (10M requests)
- PlanetScale Enterprise: $200-500/month
- Resend Pro: $80/month

Total: $305-605/month (40% cheaper)

But: 15-20 hours migration work
```

**When to Consider Migration**: 5TB+ bandwidth/month or $500+ monthly Vercel bill

---

## 📋 Step-by-Step Setup Guide

### Step 1: Buy Domain on Cloudflare (10 minutes)

1. Go to https://domains.cloudflare.com/
2. Search for your domain (e.g., `propertyportfoliohq.com`)
3. Add to cart, checkout ($9.77 for .com)
4. Domain is yours!

**Domain Naming Tips**:
```
Good Names:
✅ propertyportfolioanalyzer.com (descriptive)
✅ portfoliohq.com (short + memorable)
✅ wealthprop.io (.io is $29/year on Cloudflare)
✅ propfolio.ai (.ai is $80/year - only if AI-focused)

Avoid:
❌ property-portfolio-analyzer.com (hyphens are bad for SEO)
❌ mypropertyapp123.com (generic + numbers)
❌ propertyportfolio.xyz (.xyz looks unprofessional)
```

---

### Step 2: Connect Domain to Vercel (5 minutes)

**In Vercel Dashboard**:
1. Go to your project settings
2. Click "Domains"
3. Add your domain: `yourdomain.com`
4. Vercel will give you DNS records:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

**In Cloudflare Dashboard**:
1. Go to DNS settings
2. Add the CNAME record from Vercel
3. Set proxy status to "Proxied" (orange cloud ☁️)
4. Wait 5-10 minutes for DNS propagation

**Done!** Your site will be live at `https://yourdomain.com`

---

### Step 3: Setup SSL (Automatic)

Both Cloudflare and Vercel automatically handle SSL:
```
Cloudflare: Free Universal SSL (edge)
Vercel: Free Let's Encrypt SSL (origin)

Result: Full SSL encryption (browser → Cloudflare → Vercel)
```

**No configuration needed** - it just works! 🎉

---

### Step 4: Configure Email (Optional, 15 minutes)

**Cloudflare Email Routing (FREE)**:
```
What it does:
- Forward emails from your domain to your personal email
- Example: hello@yourdomain.com → your@gmail.com

Setup:
1. Cloudflare dashboard → Email → Email Routing
2. Enable Email Routing
3. Add destination email (your Gmail)
4. Create custom addresses:
   - hello@yourdomain.com (for support)
   - team@yourdomain.com (for general inquiries)
   - noreply@yourdomain.com (for Resend transactional emails)
```

**Update Resend Settings**:
```javascript
// In your .env
FROM_EMAIL=hello@yourdomain.com  // Instead of [email protected]
```

---

## 💰 Cost Comparison: Different Scenarios

### Scenario 1: MVP Launch (0-500 Users, 0-5k Visitors/Month)

| Stack | Monthly Cost | Notes |
|-------|--------------|-------|
| **Recommended** | **$39.81** | Cloudflare domain + Vercel Hobby + PlanetScale |
| Netlify + Heroku | $46 | Netlify free + Heroku Eco ($5) + PlanetScale |
| Shared Hosting (cPanel) | $25-60 | Bluehost/HostGator (but can't run Node.js serverless) |
| AWS (manual setup) | $50-100 | EC2 + RDS + CloudFront (overkill for MVP) |

**Winner**: Recommended stack is cheapest AND most powerful

---

### Scenario 2: Growing SaaS (1000-5000 Users, 50k-100k Visitors/Month)

| Stack | Monthly Cost | Notes |
|-------|--------------|-------|
| **Recommended** | **$79.81** | Vercel Pro + PlanetScale + Resend |
| Cloudflare Pages | $64 | Pages $20 + PlanetScale $39 + Resend $20 (but 15hr migration) |
| DigitalOcean Droplet | $84 | $24/mo droplet + $60/mo managed DB |
| AWS Amplify | $120+ | Amplify hosting + RDS + data transfer fees |
| Traditional VPS (Linode) | $90 | $60/mo VPS + $30/mo managed DB |

**Winner**: Recommended stack is balanced (cost vs effort)

---

### Scenario 3: Scaled SaaS (10,000+ Users, 500k+ Visitors/Month)

| Stack | Monthly Cost | Bandwidth | Notes |
|-------|--------------|-----------|-------|
| **Vercel Pro (current)** | **$420** | 10TB | $20 base + $40/TB × 10TB |
| **Cloudflare Pages** | **$325** | Unlimited | $20 Pages + $5 Workers + $300 DB |
| AWS (optimized) | $800+ | 10TB | EC2 + RDS + CloudFront + data transfer |
| DigitalOcean | $500 | 10TB | $240 droplet + $120 DB + bandwidth |

**Winner**: Cloudflare becomes cheaper at this scale, but requires migration

---

## 🎯 Decision Matrix: Which Hosting to Choose?

| Situation | Choose | Why |
|-----------|--------|-----|
| **You're launching in next 2 weeks** | Vercel (current) | Already configured, fastest to production |
| **Budget < $50/month** | Vercel Hobby | Free tier covers MVP needs |
| **Expect high traffic (1M+ views/month)** | Cloudflare Pages | Unlimited bandwidth on free tier |
| **Need team collaboration** | Vercel Pro ($20/mo) | Built-in preview deployments + team features |
| **Want to save $100+/month at scale** | Cloudflare Pages | Better pricing past 5TB/month bandwidth |
| **Need background jobs/cron** | Railway or Render | Vercel doesn't support long-running processes well |

---

## 🔥 Pro Tips for Solopreneurs

### 1. Domain Strategy

**Start Small**:
```
Year 1: Buy only .com ($9.77/year on Cloudflare)
Year 2: If getting traction, buy variants:
  - .io ($29/year) - for developer credibility
  - .ai ($80/year) - only if AI is core feature
  - yourcompany.au/.co.uk - if expanding to those markets
```

**Don't Buy Defensively**:
- ❌ Don't buy 10+ TLDs "just in case"
- ❌ Domain squatting is expensive and unnecessary
- ✅ Focus on building product, not protecting domains

---

### 2. Hosting Strategy

**Free Tier Checklist**:
```
Before upgrading to Vercel Pro ($20/mo), maximize free tier:

✅ Enable Cloudflare CDN (caches static assets)
✅ Optimize images (use next/image or similar)
✅ Lazy load components (reduce initial bundle)
✅ Use Vercel Analytics to track usage
✅ Set up monitoring to know when you'll hit limits
```

**When Free Tier Runs Out**:
```
Option 1: Upgrade to Pro ($20/mo)
- Makes sense if you're generating $100+/month revenue
- Get 10x the resources (1TB bandwidth)

Option 2: Optimize First
- Implement aggressive caching (reduce bandwidth 50%)
- Move large assets to external CDN (BunnyCDN: $1/TB)
- Defer upgrade 2-3 months

Option 3: Migrate to Cloudflare
- Only if bandwidth > 5TB/month consistently
- Saves $200-300/month at scale
- But costs 15-20 hours dev time
```

---

### 3. Cost Optimization Hacks

**Hack #1: Use Cloudflare CDN (Free)**
```
Even on Vercel, you can route traffic through Cloudflare:

Benefit:
- Cloudflare caches static assets (images, JS, CSS)
- Reduces Vercel bandwidth by 30-50%
- Faster global performance

Setup:
1. Add domain to Cloudflare (already doing this)
2. Set DNS to "Proxied" (orange cloud)
3. Configure Cloudflare caching rules
```

**Hack #2: Use BunnyCDN for Large Assets ($1/TB)**
```
If you have lots of images/videos:

Setup:
1. Upload assets to BunnyCDN storage ($0.01/GB)
2. Serve via CDN ($1/TB bandwidth)
3. Update image URLs in your app

Savings:
- Vercel bandwidth: $40/TB
- BunnyCDN: $1/TB
- Save $39/TB (97% cheaper!)
```

**Hack #3: Defer Database Upgrade**
```
PlanetScale Scaler Pro is $39/month. To delay:

1. Start with Hobby plan ($0/month)
   - 5GB storage
   - 1B row reads/month
   - Perfect for 0-100 users

2. When you hit limits (~200-500 users):
   - Optimize queries (add indexes)
   - Archive old data
   - Implement pagination
   - This can extend Hobby plan to 500-1000 users

3. Only upgrade when truly necessary
```

---

## 🧮 Your 12-Month Cost Projection

### Conservative Growth Scenario

| Month | Users | MRR | Domain | Hosting | Database | Email | Total |
|-------|-------|-----|--------|---------|----------|-------|-------|
| 1-2 | 10-50 | $200 | $0.81 | $0 | $0 | $0 | **$0.81** |
| 3-4 | 50-200 | $800 | $0.81 | $0 | $0 | $0 | **$0.81** |
| 5-6 | 200-500 | $2k | $0.81 | $0 | $39 | $0 | **$39.81** |
| 7-8 | 500-1000 | $5k | $0.81 | $20 | $39 | $20 | **$79.81** |
| 9-10 | 1k-2k | $10k | $0.81 | $20 | $39 | $20 | **$79.81** |
| 11-12 | 2k-5k | $20k | $0.81 | $20 | $39 | $20 | **$79.81** |

**Key Milestones**:
- Month 1-4: $0.81/month (practically free!)
- Month 5: Upgrade to PlanetScale Scaler Pro ($39)
- Month 7: Upgrade to Vercel Pro + Resend Starter ($79.81)
- Year 1 Total: ~$480 hosting costs on $50k+ annual revenue

**That's < 1% of revenue** 🎉

---

### Aggressive Growth Scenario

| Month | Users | MRR | Total Infrastructure Cost | % of Revenue |
|-------|-------|-----|---------------------------|--------------|
| 1 | 100 | $500 | $0.81 | 0.2% |
| 3 | 500 | $2k | $39.81 | 2% |
| 6 | 2000 | $10k | $79.81 | 0.8% |
| 12 | 10,000 | $50k | $420 (Vercel + DB overages) | 0.84% |

**Insight**: Even with aggressive growth, infrastructure is < 1% of revenue

---

## 🎓 Common Mistakes to Avoid

### ❌ Mistake #1: Buying Too Many Domains
```
Bad:
- Buys .com, .net, .io, .ai, .app, .co (6 domains)
- Cost: $150/year
- Usage: Only uses .com

Better:
- Buy .com only ($9.77/year)
- If product takes off, buy .io later
- Save $140/year
```

### ❌ Mistake #2: Premature Optimization
```
Bad:
- "I need to optimize for 1M users on day 1"
- Spends 2 weeks setting up Kubernetes
- Product never launches

Better:
- Ship on Vercel Hobby (free)
- Get real users
- Optimize when you hit actual limits
```

### ❌ Mistake #3: Choosing Wrong Registrar
```
Bad:
- Buys domain on GoDaddy ($11.99 year 1)
- Renewal: $20.99/year (surprise!)
- WHOIS privacy: $9.99/year (extra)
- Total: $30.98/year

Better:
- Buy on Cloudflare ($9.77/year forever)
- Free WHOIS privacy
- Save $21.21/year
```

### ❌ Mistake #4: Over-Engineering Hosting
```
Bad:
- Sets up AWS ECS + RDS + CloudFront
- Spends $200/month
- 0 users
- Wastes 40 hours on DevOps

Better:
- Use Vercel Hobby (free)
- Deploy in 30 minutes
- Focus on getting users
```

---

## ✅ Your Action Checklist

### Week 1: Domain + Deployment (2-3 hours)

- [ ] **Choose domain name** (30 minutes)
  - Check availability on https://domains.cloudflare.com/
  - Verify .com is available
  - Consider alternatives (.io, .app, .ai)

- [ ] **Buy domain on Cloudflare** (10 minutes)
  - Create Cloudflare account
  - Purchase domain ($9.77 for .com)
  - Enable DNSSEC + WHOIS privacy (free)

- [ ] **Connect to Vercel** (15 minutes)
  - Add domain in Vercel project settings
  - Copy CNAME record to Cloudflare DNS
  - Set to "Proxied" for Cloudflare CDN

- [ ] **Test deployment** (30 minutes)
  - `git push` to trigger Vercel build
  - Wait for deployment (2-3 minutes)
  - Visit `https://yourdomain.com`
  - Verify all features work

- [ ] **Setup email forwarding** (20 minutes)
  - Enable Cloudflare Email Routing
  - Create `hello@yourdomain.com` → your email
  - Test by sending email

- [ ] **Update environment variables** (10 minutes)
  - Set `APP_URL=https://yourdomain.com` in Vercel
  - Update `FROM_EMAIL` in Resend settings
  - Restart Vercel deployment

### Week 2: Monitoring + Optimization (2 hours)

- [ ] **Setup monitoring** (30 minutes)
  - Enable Vercel Analytics
  - Setup Cloudflare Analytics
  - Monitor bandwidth usage

- [ ] **Optimize performance** (60 minutes)
  - Enable Cloudflare caching rules
  - Compress images (use TinyPNG or similar)
  - Lazy load components

- [ ] **Document your setup** (30 minutes)
  - Save DNS records in password manager
  - Document environment variables
  - Create runbook for common issues

---

## 📈 When to Consider Migration/Upgrades

### From Vercel Hobby → Vercel Pro ($0 → $20/month)

**Upgrade When**:
- ✅ Traffic > 100GB/month (~25k visitors)
- ✅ Need team collaboration features
- ✅ Want advanced analytics
- ✅ Generating $100+/month revenue

**Don't Upgrade If**:
- ❌ Still under 100GB bandwidth
- ❌ Can optimize to reduce bandwidth first
- ❌ Not generating revenue yet

---

### From Vercel → Cloudflare Pages

**Consider Migration When**:
- ✅ Bandwidth > 5TB/month consistently
- ✅ Vercel bill > $300/month
- ✅ Have 15-20 hours for migration
- ✅ Comfortable with Cloudflare Workers

**Don't Migrate If**:
- ❌ Bandwidth < 3TB/month (Vercel is fine)
- ❌ Can optimize to reduce costs
- ❌ Don't have time for 15hr migration
- ❌ Happy with current Vercel setup

---

## 🎁 Bonus: Free Tools to Maximize

### Free Forever Tools

| Tool | Purpose | Value | Limit |
|------|---------|-------|-------|
| Cloudflare DNS | Domain DNS | $20/mo value | Unlimited |
| Cloudflare CDN | Asset caching | $50/mo value | Unlimited |
| Vercel Hobby | Hosting | $20/mo value | 100GB/month |
| PlanetScale Hobby | Database | $39/mo value | 5GB storage |
| Resend Free | Transactional email | $20/mo value | 100 emails/day |
| GitHub | Code hosting | $4/mo value | Unlimited repos |
| Cloudflare Email Routing | Email forwarding | $10/mo value | Unlimited forwards |

**Total Free Tier Value**: $163/month! 💰

---

## 🚀 Final Recommendation

### For You (Property Portfolio Analyzer)

```
🎯 Best Setup (Total: $39.81/month):

1. Domain: Cloudflare Registrar
   - Cost: $9.77/year ($0.81/month)
   - Why: At-cost pricing, no markup, best DNS

2. Hosting: Vercel (current setup)
   - Cost: $0-20/month (start with Hobby, upgrade to Pro when needed)
   - Why: Already configured, perfect for your React + Express stack

3. Database: PlanetScale PostgreSQL (current)
   - Cost: $0-39/month (start with Hobby, upgrade when you hit 100 users)
   - Why: Already using it, great for serverless

4. CDN: Cloudflare (via DNS proxy)
   - Cost: $0/month
   - Why: Reduces Vercel bandwidth by 30-50%

Total Year 1 Cost: ~$480 (assuming upgrade at month 5-7)
```

### Timeline to Launch

```
Day 1 (2 hours):
- Buy domain on Cloudflare ($9.77)
- Connect to Vercel (15 mins)
- Deploy and test (30 mins)

Day 2 (1 hour):
- Setup email forwarding (20 mins)
- Update environment variables (10 mins)
- Final testing (30 mins)

Day 3:
- Launch! 🚀
```

---

## 📞 Next Steps

Ready to launch your domain? Here's what to do:

1. **Choose a domain name** (brainstorm 5-10 options)
2. **Check availability** on https://domains.cloudflare.com/
3. **Buy it** ($9.77 for .com)
4. **Let me know** - I'll help you set up the DNS and deploy!

Or if you want, **I can write the DNS setup script** and walk you through the entire process. Just say the word! 🎯

---

**Questions? Need help choosing a domain name or deploying?** Let me know and I'll assist! 🚀

---

**Document Version**: 1.0  
**Last Updated**: December 9, 2025  
**Author**: GenSpark AI Developer  
**Next Review**: When you're ready to deploy
