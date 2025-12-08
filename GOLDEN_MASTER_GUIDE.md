# Golden Master Test Profile - Usage Guide

## Overview

The **Golden Master Test Profile** creates a comprehensive, realistic property investor scenario with three distinct properties designed to stress-test your Dashboard.tsx charts, calculation engines, and database schemas.

## Demo User Profile

- **Email**: `demo@propertywizards.com`
- **Subscription Tier**: `PREMIUM_ANNUAL` (all features unlocked)
- **Total Portfolio Value**: $2.32M
- **Total Debt**: $1.47M
- **Total Equity**: $856K
- **Portfolio Strategy**: Balanced (growth + income + tax optimization)

## Three Property Scenarios

### Property A: "The Cash Cow" 🐄
**Sydney Residential Apartment**

- **Status**: Actual (owned for 10 years)
- **Purchase**: $450k (March 2015)
- **Current Value**: $803k (6% compound growth)
- **Debt**: $280k (40% LVR - paid down from 80%)
- **Equity**: $523k
- **Cashflow**: **POSITIVE** ~$29k/year
- **Depreciation**: $2k/year (minimal - older property)
- **Historical Data**: 11 valuation points (2015-2025)

**Tests**:
- ✅ Equity calculation logic
- ✅ Historical valuation chart plotting (smooth curves)
- ✅ Long-term capital growth tracking
- ✅ Principal & Interest loan amortization

---

### Property B: "The Tax Deductor" 📉
**Melbourne New Build Apartment**

- **Status**: Actual (owned for 2 years)
- **Purchase**: $580k (June 2023)
- **Current Value**: $570k (market correction -2%)
- **Debt**: $522k (90% LVR - interest only)
- **Equity**: $48k
- **Cashflow**: **NEGATIVE** -$20k/year
- **Depreciation**: **$18k/year** (massive tax benefit)
- **Historical Data**: 3 valuation points (2023-2025)

**Tests**:
- ✅ Negative cashflow visualization (below zero)
- ✅ High depreciation benefits (tax optimization)
- ✅ Interest-only loan structure
- ✅ High LVR scenarios (90%)
- ✅ Expense growth override logic
- ✅ Market decline handling

---

### Property C: "The Future Project" 🏢
**Brisbane Commercial Property**

- **Status**: **PROJECTED** (not yet purchased)
- **Projected Purchase**: $950k (March 2026)
- **Property Type**: Commercial
- **Debt**: $665k (70% LVR)
- **Equity**: $285k
- **Projected Cashflow**: **POSITIVE** ~$26k/year
- **Yield**: 7.1% (strong commercial return)

**Tests**:
- ✅ Projected vs Actual asset handling
- ✅ Future scenario calculations
- ✅ Commercial property type
- ✅ Different ownership structure (Company)
- ✅ Dashboard filtering (show/hide projected assets)

---

## Installation & Usage

### Prerequisites
Ensure you have a `.env` file with your `DATABASE_URL` configured:

```env
DATABASE_URL=mysql://user:password@host:port/database
```

### Option 1: Quick Run (Recommended)
```bash
npx pnpm run seed:golden
```

### Option 2: Direct Execution
```bash
node seed-golden-master.mjs
```

### Option 3: After Fresh Database Setup
```bash
# 1. Push schema to database
npx pnpm run db:push

# 2. Seed Golden Master data
npx pnpm run seed:golden
```

---

## What Gets Created

### User Record
- ✅ `demo@propertywizards.com` user with PREMIUM_ANNUAL tier
- ✅ Full feature access unlocked

### Database Tables Populated
For each property:
- ✅ `properties` - Core property data
- ✅ `propertyOwnership` - Ownership structure
- ✅ `purchaseCosts` - Stamp duty, legal fees, etc.
- ✅ `propertyUsagePeriods` - Investment vs Owner-occupied tracking
- ✅ `loans` - Mortgage details (P&I vs IO, different LVRs)
- ✅ `propertyValuations` - Historical valuations (rich data for charts)
- ✅ `growthRatePeriods` - Future growth projections
- ✅ `rentalIncome` - Rental income streams
- ✅ `expenseLogs` + `expenseBreakdown` - Detailed expense tracking
- ✅ `depreciationSchedule` - Tax depreciation benefits
- ✅ `capitalExpenditure` - (Property A only - kitchen renovation)

---

## Testing Scenarios Covered

### Dashboard.tsx Chart Testing
1. **Equity Over Time Chart**
   - Property A has smooth growth curve (11 data points)
   - Property B shows slight decline then recovery
   - Property C shows projected future growth

2. **Cashflow Chart**
   - Property A: Positive cashflow (green area)
   - Property B: **Negative cashflow** (red area below zero)
   - Property C: Future positive cashflow

3. **Depreciation Chart**
   - Property A: Minimal depreciation ($2k/year)
   - Property B: **High depreciation** ($18k/year tax saver)
   - Property C: No depreciation yet (not purchased)

4. **Total Portfolio Value**
   - Tests aggregation across 3 properties
   - Tests filtering (Actual vs Projected)
   - Tests different property types

### Calculation Engine Testing
- ✅ LVR calculations (40%, 90%, 70%)
- ✅ Cashflow calculations (positive + negative)
- ✅ Tax benefit calculations (depreciation)
- ✅ Loan repayment projections (P&I vs IO)
- ✅ Capital growth projections
- ✅ Rental yield calculations (4.9% to 7.1%)

### Schema & Data Model Testing
- ✅ Multiple ownership structures (Individual, Trust, Company)
- ✅ Property status enum (Actual vs Projected)
- ✅ Different property types (Residential, Commercial)
- ✅ Loan structures (P&I, IO, different terms)
- ✅ Historical data density (1 to 11 data points)

---

## Expected Output

When you run the seeder, you should see:

```
🌟 Seeding Golden Master Test Profile...

👤 Creating demo user...
✓ Created new demo user (ID: 1)

📊 Creating balanced portfolio with 3 properties...

🐄 PROPERTY A: The Cash Cow (Sydney Apartment)
✓ Property A created (ID: 1)
  - Purchase: $450k (2015)
  - Current Value: $803k (10 years @ 6% growth)
  - Debt: $280k (40% LVR)
  - Equity: $523k
  - Cashflow: POSITIVE (~$29k/year)
  - Historical data: 11 valuation points

📉 PROPERTY B: The Tax Deductor (Melbourne New Build)
✓ Property B created (ID: 2)
  - Purchase: $580k (2023)
  - Current Value: $570k (slight market decline)
  - Debt: $522k (90% LVR)
  - Equity: $48k
  - Cashflow: NEGATIVE (-$20k/year before depreciation)
  - Depreciation: $18k/year (TAX ADVANTAGE)
  - Historical data: 3 valuation points

🏢 PROPERTY C: The Future Project (Brisbane Commercial)
✓ Property C created (ID: 3)
  - Status: PROJECTED (not yet purchased)
  - Projected Purchase: $950k (March 2026)
  - Projected Debt: $665k (70% LVR)
  - Property Type: Commercial
  - Projected Yield: 7.1% (strong commercial return)
  - Cashflow: POSITIVE when purchased (~$26k/year)

✅ Golden Master Test Profile Created Successfully!
```

---

## Dashboard.tsx Feature Testing Checklist

Use this profile to verify:

- [ ] Charts render with smooth curves (not flat lines)
- [ ] Negative cashflow displays correctly (Property B)
- [ ] Projected properties can be filtered/toggled
- [ ] High depreciation shows tax benefits (Property B)
- [ ] Multiple property types display correctly
- [ ] LVR calculations are accurate across different debt levels
- [ ] Historical data populates charts with nice gradients
- [ ] Total portfolio aggregations are correct
- [ ] Expense growth override works (Property B has high strata)
- [ ] Commercial property calculations differ from residential

---

## Cleanup / Reset

To remove the Golden Master data and start fresh:

```sql
-- Delete all data for demo user (replace X with actual user ID)
DELETE FROM capitalExpenditure WHERE propertyId IN (SELECT id FROM properties WHERE userId = X);
DELETE FROM depreciationSchedule WHERE propertyId IN (SELECT id FROM properties WHERE userId = X);
DELETE FROM expenseBreakdown WHERE expenseLogId IN (SELECT id FROM expenseLogs WHERE propertyId IN (SELECT id FROM properties WHERE userId = X));
DELETE FROM expenseLogs WHERE propertyId IN (SELECT id FROM properties WHERE userId = X);
DELETE FROM rentalIncome WHERE propertyId IN (SELECT id FROM properties WHERE userId = X);
DELETE FROM growthRatePeriods WHERE propertyId IN (SELECT id FROM properties WHERE userId = X);
DELETE FROM propertyValuations WHERE propertyId IN (SELECT id FROM properties WHERE userId = X);
DELETE FROM loans WHERE propertyId IN (SELECT id FROM properties WHERE userId = X);
DELETE FROM propertyUsagePeriods WHERE propertyId IN (SELECT id FROM properties WHERE userId = X);
DELETE FROM purchaseCosts WHERE propertyId IN (SELECT id FROM properties WHERE userId = X);
DELETE FROM propertyOwnership WHERE propertyId IN (SELECT id FROM properties WHERE userId = X);
DELETE FROM properties WHERE userId = X;
DELETE FROM users WHERE email = 'demo@propertywizards.com';
```

Or simply re-run the seeder - it will update the existing demo user to PREMIUM_ANNUAL tier and add new properties.

---

## Next Steps

1. Run the seeder: `npx pnpm run seed:golden`
2. Start your dev server: `npx pnpm run dev`
3. Login as `demo@propertywizards.com` (or navigate to user's properties)
4. Open Dashboard.tsx and verify all charts populate correctly
5. Test filtering, projections, and calculations
6. Verify negative cashflow visualization works
7. Check depreciation benefits display correctly

---

## Technical Notes

### Why 11 Valuation Points for Property A?
Charts with only 1-2 data points look flat and don't showcase the area chart gradients. Property A has yearly valuations from 2015-2025 to create smooth, visually appealing growth curves.

### Why Negative Cashflow for Property B?
Many new build properties have negative cashflow initially due to:
- High interest rates
- High strata fees (new buildings)
- Lower rental yields on new apartments
- Interest-only loans (no principal reduction)

This tests whether your charts can handle negative values and display them correctly (e.g., red area below the zero line).

### Why Projected Status for Property C?
Your schema includes a `status` enum with "Projected" value. This tests:
- Dashboard filtering (show only actual, show all)
- Future scenario calculations
- Differentiation between owned and planned assets
- Projected cashflow vs actual cashflow

---

## Support

If you encounter any issues:
1. Check your `DATABASE_URL` in `.env`
2. Ensure database migrations are up to date (`npx pnpm run db:push`)
3. Check seeder output for specific error messages
4. Verify database permissions allow INSERT operations

**Questions?** Review the seeder code in `seed-golden-master.mjs` - it's heavily commented!
