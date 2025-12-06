# NEXT STEPS - Complete These Manual Tasks

## TASK 1: Merge Database Helpers into server/db.ts

**Current State**: Helper functions are in `server/db-subscription-helpers.ts`  
**What to do**: Move them into `server/db.ts`

Option A - Manually:
1. Open `server/db.ts`
2. Scroll to the bottom
3. Copy all content from `server/db-subscription-helpers.ts` 
4. Paste at the end of `server/db.ts`
5. Delete `server/db-subscription-helpers.ts`

Option B - Command line:
```bash
cat server/db-subscription-helpers.ts >> server/db.ts
rm server/db-subscription-helpers.ts
```

---

## TASK 2: Update server/router.ts

**Current State**: Main router doesn't include auth router  
**What to do**: Add auth router to exports

Find your main router definition in `server/router.ts` and add:

```typescript
import { authRouter } from './routers/auth';
import { featureGatesRouter } from './routers/feature-gates';

export const appRouter = router({
  // ... your existing routes ...
  
  // ADD THESE TWO LINES:
  auth: authRouter,
  featureGates: featureGatesRouter,
  
  // ... rest of your routes ...
});
```

---

## TASK 3: Run Type Check

```bash
npm run type-check
```

Expected outcome: Should pass or show minimal errors (likely just module resolution)

If errors appear:
- Look for import path issues
- Check that all files are in correct locations
- Verify no syntax errors were introduced

---

## TASK 4: Run Database Migrations

```bash
npm run db:migrate
```

This will:
- Create `subscription_tiers` table
- Create `user_subscriptions` table
- Seed tier data (basic, pro, admin)

Verify in database:
```bash
mysql -u root -p property_portfolio
SHOW TABLES; -- Should see subscription_tiers and user_subscriptions
SELECT * FROM subscription_tiers; -- Should see 3 rows
exit
```

---

## TASK 5: Migrate Existing Users

```bash
npm run db:seed
```

This will:
- Find all users without subscriptions
- Assign them to 'basic' tier
- Show progress messages

Expected output:
```
Starting user migration to subscription system...

📋 Fetching all users...
Found X users

🎯 Checking subscription tiers...
✅ Using tier: Basic

🔍 Checking for existing subscriptions...
Found X users needing migration

⚙️  Migrating users...

✅ User 1: Migrated to Basic tier
✅ User 2: Migrated to Basic tier
...

📊 Migration Summary:
   ✅ Successful: X
   ❌ Errors: 0
   Total processed: X

🎉 Migration completed successfully!
```

---

## TASK 6: Test the Implementation

### 6.1 Start dev server
```bash
npm run dev
```

### 6.2 Test new user registration
- Sign up with new account
- Check database: user should have subscription record
```bash
mysql -u root -p property_portfolio
SELECT u.id, u.email, st.displayName 
FROM users u 
LEFT JOIN user_subscriptions us ON u.id = us.userId
LEFT JOIN subscription_tiers st ON us.tierId = st.id;
exit
```

### 6.3 Test property limit
- Login with basic user
- Create property 1 ✅
- Create property 2 ✅
- Try to create property 3 ❌ (should fail with message)

### 6.4 Test feature gates
- Check in UI that advanced features show "upgrade required" for basic users
- Login as admin - should see all features

### 6.5 Check API endpoints
In browser console:
```javascript
// Test subscription endpoint
await fetch('/trpc/auth.getSubscription')

// Test feature access
await fetch('/trpc/auth.getFeatureAccess')

// Test property limit
await fetch('/trpc/auth.canAddProperty')
```

---

## TASK 7: Git Commit and Push

### 7.1 Check git status
```bash
git status
```

Should show these changes:
- `drizzle/schema.ts` (modified)
- `drizzle/0003_subscription_system.sql` (new)
- `server/routers/auth.ts` (new)
- `server/scripts/migrate-existing-users.ts` (new)
- `client/src/hooks/useSubscription.ts` (new)
- `client/src/components/FeatureGate.tsx` (new)
- `client/src/components/PricingTable.tsx` (new)
- `package.json` (modified)
- `server/db.ts` (modified - merged helpers)

### 7.2 Stage all changes
```bash
git add .
```

### 7.3 Commit with detailed message
```bash
git commit -m "feat: implement complete subscription authentication system

- Add subscription_tiers and user_subscriptions database tables
- Create tRPC auth router with subscription endpoints
- Add feature gating middleware for property limits
- Implement React hooks for subscription management
- Create feature gate and pricing UI components
- Add migration script for existing users to basic tier
- Update package.json with database and linting scripts
- Support admin override for all subscription limits

Closes: #subscription-implementation"
```

### 7.4 Push to GitHub
```bash
git push origin feature/subscription-system-implementation
```

### 7.5 Create Pull Request
- Go to https://github.com/alphawizards/Property-Portfolio-Website
- Click "New Pull Request"
- Select base: `main`, compare: `feature/subscription-system-implementation`
- Add description from commit message
- Request review from team members
- Wait for approval

### 7.6 Merge PR
Once approved:
```bash
# On main branch
git checkout main
git pull origin main
git merge feature/subscription-system-implementation
git push origin main
```

---

## TASK 8: Deploy to Production

### 8.1 SSH to server
```bash
ssh your-server
cd /path/to/app
```

### 8.2 Backup database
```bash
mysqldump -u root -p property_portfolio > backup_$(date +%Y%m%d_%H%M%S).sql
ls -lah backup_*.sql
```

### 8.3 Pull latest code
```bash
git pull origin main
```

### 8.4 Install dependencies
```bash
npm install
```

### 8.5 Run migrations
```bash
npm run db:migrate
npm run db:seed
```

### 8.6 Build application
```bash
npm run build
```

### 8.7 Restart application
```bash
# If using PM2
pm2 restart property-portfolio
pm2 logs property-portfolio

# If using systemd
systemctl restart property-portfolio
tail -f /var/log/property-portfolio/app.log

# If using Docker
docker-compose restart
docker-compose logs -f
```

### 8.8 Verify in production
```bash
# Check database
mysql -u root -p property_portfolio
SELECT COUNT(*) FROM user_subscriptions;
SELECT st.displayName, COUNT(us.id) 
FROM user_subscriptions us
JOIN subscription_tiers st ON us.tierId = st.id
GROUP BY st.displayName;
exit

# Check application is running
curl http://localhost:3000/health
```

---

## TASK 9: Post-Deployment Verification

### 9.1 Functional tests
- [ ] New user signup works
- [ ] New user gets 'basic' subscription
- [ ] Existing users migrated to 'basic'
- [ ] Property limit enforced (max 2 for basic)
- [ ] Feature gates show correctly
- [ ] Admin users bypass limits
- [ ] Pricing page displays tiers
- [ ] All tRPC endpoints accessible

### 9.2 Database verification
```bash
mysql -u root -p property_portfolio
SELECT u.id, u.email, st.displayName, us.status
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.userId
LEFT JOIN subscription_tiers st ON us.tierId = st.id
LIMIT 20;
exit
```

### 9.3 Error monitoring
- Check error tracking (Sentry, etc.)
- Monitor application logs for errors
- Look for any auth/subscription related failures

### 9.4 Performance check
- Monitor CPU usage
- Check memory usage
- Verify response times acceptable

---

## TASK 10: Final Checklist

- [ ] All files created/modified successfully
- [ ] npm run type-check passes
- [ ] Database migrations completed
- [ ] Existing users migrated
- [ ] Tests pass locally
- [ ] Code pushed to GitHub
- [ ] Pull request created and reviewed
- [ ] Code merged to main
- [ ] Deployed to production
- [ ] Post-deployment tests pass
- [ ] No errors in application logs
- [ ] Team notified of deployment
- [ ] Documentation updated

---

## TROUBLESHOOTING

### Problem: Type check fails
```bash
npm install --save-dev @types/node
npm run type-check
```

### Problem: Migrations fail
```bash
# Verify MySQL is running
mysql -u root -p -e "SELECT 1;"

# Try manual migration file
mysql -u root -p property_portfolio < drizzle/0003_subscription_system.sql
```

### Problem: Migration script hangs
```bash
# Kill it
Ctrl+C

# Check database state
mysql -u root -p property_portfolio
SELECT COUNT(*) FROM user_subscriptions;

# Retry
npm run db:seed
```

### Problem: Feature gates not working
- Verify authRouter is in main router
- Check browser console for API errors
- Verify tRPC endpoints are accessible
- Restart dev server

### Problem: Property limit not enforced
- Verify propertyLimitMiddleware is used
- Check auth.canAddProperty endpoint works
- Test from browser console
- Check user has subscription

---

## ESTIMATED TIME

- Task 1 (Merge helpers): 5 min
- Task 2 (Update router): 5 min
- Task 3 (Type check): 2 min
- Task 4 (Migrations): 5 min
- Task 5 (User migration): 2 min
- Task 6 (Testing): 10 min
- Task 7 (Git/PR): 15 min
- Task 8 (Deploy): 20 min
- Task 9 (Verify): 10 min
- Task 10 (Final checks): 5 min

**Total: ~79 minutes (1-2 hours including review/approval time)**

---

## SUCCESS CRITERIA

You'll know it's working when:

1. ✅ New users automatically get 'basic' tier on signup
2. ✅ Existing users migrated to 'basic' tier
3. ✅ Creating 3rd property as basic user shows error
4. ✅ Advanced features show "upgrade required" message
5. ✅ Admin users see all features without limit
6. ✅ Pricing table displays all tiers correctly
7. ✅ All tRPC endpoints respond correctly
8. ✅ No TypeScript errors in build
9. ✅ No console errors in browser
10. ✅ Application runs without errors

---

**You're ~95% done! Just execute these 10 tasks and you're finished! 🚀**
