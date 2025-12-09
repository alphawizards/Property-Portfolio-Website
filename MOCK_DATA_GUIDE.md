# Mock Data Guide - Australian Property Portfolio

This guide explains how to use the comprehensive Australian property test data included in the application.

## 📊 Test Data Overview

The mock data includes **4 realistic Australian properties** representing different scenarios:

### Property 1: Brisbane CBD Apartment 🏢
- **Purchase**: $650,000 (June 2020)
- **Current Value**: $780,000 (20% growth)
- **Structure**: Trust (Smith Family Trust)
- **Loan**: $480,000 @ 5.65% P&I
- **Rental**: $650/week ($33,800/year)
- **Expenses**: $15,200/year
- **Net Yield**: 2.85%
- **Equity**: $300,000

### Property 2: Sydney Parramatta House 🏡
- **Purchase**: $1,250,000 (March 2021)
- **Current Value**: $1,450,000 (16% growth)
- **Structure**: Company (Smith Property Holdings Pty Ltd)
- **Loan**: $1,000,000 @ 5.95% IO
- **Rental**: $950/week ($49,400/year)
- **Expenses**: $16,800/year
- **Net Yield**: 2.25%
- **Equity**: $450,000
- **Renovations**: Kitchen & Bathroom ($65,000)

### Property 3: Melbourne PPOR 🏠
- **Purchase**: $920,000 (January 2022)
- **Current Value**: $1,030,000 (12% growth)
- **Structure**: Individual (Joint ownership)
- **Loan**: $685,000 @ 6.15% P&I
- **Type**: Owner-Occupied (Primary Place of Residence)
- **Expenses**: $9,800/year
- **Equity**: $345,000

### Property 4: Gold Coast Development 🏗️
- **Purchase**: $1,800,000 (September 2023)
- **Current Value**: $1,920,000 
- **Structure**: Trust (Smith Development Trust)
- **Loan**: $1,350,000 @ 7.25% IO (Development loan)
- **Type**: Development Opportunity
- **Holding Costs**: $12,000/year
- **Equity**: $570,000
- **Development Costs**: $150,000 (subdivision & approvals)

## 💰 Portfolio Summary

| Metric | Value |
|--------|-------|
| **Total Portfolio Value** | $5,180,000 |
| **Total Debt** | $3,515,000 |
| **Total Equity** | $1,665,000 |
| **Equity Percentage** | 32.1% |
| **Annual Rental Income** | $83,200 |
| **Annual Expenses** | $54,000 |
| **Net Operating Income** | $29,200/year |

## 🎯 Features Demonstrated

The mock data showcases:

### Property Types
- ✅ Investment apartments
- ✅ Investment houses
- ✅ Owner-occupied properties
- ✅ Development opportunities

### Loan Structures
- ✅ Principal & Interest (P&I)
- ✅ Interest Only (IO)
- ✅ Different LVR ratios (75-80%)
- ✅ Various interest rates (5.65% - 7.25%)

### Ownership Structures
- ✅ Individual ownership
- ✅ Joint ownership (50/50)
- ✅ Trust structures
- ✅ Company ownership

### Financial Details
- ✅ Purchase costs (stamp duty, legal fees, inspections)
- ✅ Rental income with weekly rent
- ✅ Detailed expense breakdown
  - Council rates
  - Water rates
  - Strata fees
  - Property management
  - Insurance
  - Repairs & maintenance
- ✅ Depreciation schedules
- ✅ Capital expenditure tracking
- ✅ Property valuations over time
- ✅ Growth rate projections

## 🚀 Using the Mock Data

### Option 1: With Database (Recommended)

1. **Set up a database**:
   ```bash
   # Add to .env file
   DATABASE_URL=mysql://username:password@host/database
   ```

2. **Run migrations**:
   ```bash
   npm run db:push
   ```

3. **Seed the data**:
   ```bash
   node seed-australian-properties.mjs
   ```

4. **Login and view**:
   - Navigate to the application
   - Login (user will be created if needed)
   - View your 4-property portfolio

### Option 2: Frontend Mock Data (No Database)

The mock data is available in `client/src/mock-data/australian-properties.ts`:

```typescript
import { mockProperties, mockUser, calculatePortfolioSummary } from './mock-data/australian-properties';

// Use in your components
const properties = mockProperties;
const summary = calculatePortfolioSummary();
```

To integrate into your dashboard/components:

1. Import the mock data
2. Replace API calls with mock data during development
3. Add a toggle to switch between mock and real data

### Option 3: Development Mode Auto-Load

Add an environment variable:

```bash
# .env
VITE_USE_MOCK_DATA=true
```

Then conditionally load mock data in your components:

```typescript
const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';
const properties = useMockData ? mockProperties : await fetchFromAPI();
```

## 📈 Testing Scenarios

With this data, you can test:

### Cash Flow Analysis
- Compare positive vs negative cash flow properties
- View rental yield calculations
- Analyze expense ratios

### Equity Growth
- Track property appreciation over time
- Calculate equity positions
- Project future values

### Tax Implications
- Depreciation benefits
- Investment property deductions
- PPOR vs Investment comparison

### Loan Analysis
- Compare P&I vs IO strategies
- View LVR changes over time
- Calculate total interest costs

### Portfolio Metrics
- Total portfolio value
- Debt-to-equity ratio
- Diversification across states
- Property type allocation

## 🛠️ Customizing the Data

To add more properties or modify existing ones:

1. **Edit** `client/src/mock-data/australian-properties.ts`
2. **Follow the structure** of existing properties
3. **Ensure values are in cents** (multiply $ by 100)
4. **Update calculations** in `calculatePortfolioSummary()`

## 💡 Tips for Testing

1. **Start with the dashboard** to see the portfolio overview
2. **Click individual properties** to view detailed analytics
3. **Test the wizard** by adding a new property
4. **Compare scenarios** using the premium features
5. **Export data** to verify calculations

## 📞 Support

If you encounter issues:
- Check that values are in cents (e.g., $650,000 = 65000000)
- Verify date formats are correct
- Ensure all required fields are present
- Review console for any errors

## 🎉 Ready to Explore!

Your application now has:
- ✅ 4 diverse Australian properties
- ✅ Realistic financial data
- ✅ Multiple ownership structures
- ✅ Comprehensive expense tracking
- ✅ Growth projections
- ✅ Full portfolio analytics

Navigate to the dashboard and start exploring the features! 🚀
