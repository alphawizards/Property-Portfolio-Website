# Property Portfolio Analyzer - TODO

## Database Schema & Backend API

- [x] Implement properties table in database schema
- [x] Implement property_ownership table in database schema
- [x] Implement purchase_costs table in database schema
- [x] Implement property_usage_periods table in database schema
- [x] Implement loans table in database schema
- [x] Implement property_valuations table in database schema
- [x] Implement growth_rate_periods table in database schema
- [x] Implement rental_income table in database schema
- [x] Implement expense_logs table in database schema
- [x] Implement expense_breakdown table in database schema
- [x] Implement depreciation_schedule table in database schema
- [x] Implement capital_expenditure table in database schema
- [x] Implement portfolio_goals table in database schema
- [x] Create database query helpers in server/db.ts for properties
- [x] Create database query helpers for loans
- [x] Create database query helpers for financial data
- [x] Create tRPC procedures for property CRUD operations
- [x] Create tRPC procedures for loan management
- [x] Create tRPC procedures for financial projections
- [x] Create tRPC procedures for portfolio summary

## Financial Calculations Engine

- [x] Implement loan repayment calculations (Interest Only)
- [x] Implement loan repayment calculations (Principal & Interest)
- [x] Implement property value growth projections
- [x] Implement rental income projections with growth
- [x] Implement expense projections with growth
- [x] Implement equity accumulation calculations
- [x] Implement net cashflow calculations
- [x] Implement portfolio-level aggregations
- [x] Implement LVR calculations
- [x] Implement borrowing capacity calculations
- [x] Implement comparison with buy-and-hold strategy

## Property Management UI

- [x] Create property list page with search and filters
- [x] Create add property button and modal
- [x] Implement Step 1: Property Details form
- [x] Implement Step 2: Use of Property form
- [x] Implement Step 3: Purchase Information form
- [ ] Implement Step 4: Equity Loans form
- [ ] Implement Step 5: Main Principal Loan form
- [ ] Implement Step 6: Property Value & Growth Projections form
- [ ] Implement Step 7: Rental Income form
- [ ] Implement Step 8: Expenses form
- [ ] Implement Step 9: Depreciation Schedule form
- [ ] Implement Step 10: Capital Expenditure form
- [ ] Implement form validation for all steps
- [x] Implement form navigation (back/next buttons)
- [ ] Implement form data persistence
- [ ] Create edit property functionality
- [x] Create delete property functionality

## Dashboard & Visualization

- [x] Create dashboard layout with header navigation
- [x] Implement portfolio summary cards (properties, value, debt, equity, goal)
- [x] Implement time period selector (10, 20, 30, 50 years)
- [x] Implement view toggle (Equity vs Cashflow)
- [x] Implement property filter dropdown
- [x] Create multi-series line chart component
- [x] Implement chart data calculation for equity view
- [x] Implement chart data calculation for cashflow view
- [x] Add chart legend with color coding
- [ ] Add chart interactivity (tooltips, zoom)
- [ ] Create portfolio snapshot section
- [ ] Create property cashflows section
- [ ] Create borrowing & leverage section

## Testing & Quality Assurance

- [ ] Write unit tests for loan calculations
- [ ] Write unit tests for property value projections
- [ ] Write unit tests for cashflow calculations
- [ ] Write integration tests for property CRUD operations
- [ ] Write integration tests for financial projections
- [ ] Test multi-step form workflow
- [ ] Test chart rendering and interactivity
- [ ] Test responsive design on mobile devices
- [ ] Test data validation and error handling
- [ ] Perform end-to-end testing of complete user workflows

## Documentation & Deployment

- [ ] Create user guide for adding properties
- [ ] Document financial calculation methodology
- [ ] Create API documentation for tRPC procedures
- [ ] Prepare deployment configuration
- [ ] Create first checkpoint after initial implementation
- [ ] Document hosting recommendations
- [ ] Create README with setup instructions

## Future Enhancements (Post-MVP)

- [ ] Implement subscription tiers (free vs premium)
- [ ] Integrate Stripe payment processing
- [ ] Add scenario comparison feature
- [ ] Add PDF report export
- [ ] Add Excel data export
- [ ] Integrate market data for automatic valuations
- [ ] Add tax calculation features
- [ ] Create mobile app versions
- [ ] Add collaborative portfolio sharing


## Follow-up Enhancements

### Complete Property Form (Steps 4-10)

- [x] Implement Step 4: Equity Loans form with multiple loan support
- [x] Implement Step 5: Main Principal Loan form
- [x] Implement Step 6: Property Value & Growth Projections form
- [x] Implement Step 7: Rental Income form with growth rates
- [x] Implement Step 8: Expenses form with breakdown
- [x] Implement Step 9: Depreciation Schedule form
- [x] Implement Step 10: Capital Expenditure form
- [x] Update AddProperty component to include all 10 steps
- [x] Add form data persistence across all steps
- [x] Implement comprehensive form validation

### Investment Comparison Feature

- [x] Create comparison page/section in dashboard
- [x] Implement share investment calculation logic
- [x] Create side-by-side comparison charts
- [x] Add ROI comparison metrics
- [x] Implement scenario testing (what-if analysis)
- [ ] Add export/print comparison report (deferred)

### Subscription & Monetization

- [x] Add Stripe feature to project using webdev_add_feature
- [x] Define free tier features (limited properties, basic projections)
- [x] Define premium tier features (unlimited properties, advanced analytics)
- [x] Create subscription management UI
- [ ] Implement feature gating based on subscription tier (deferred)
- [ ] Add billing and payment history page (deferred)
- [x] Create upgrade/downgrade flows


## Testing Completed

- [x] Write unit tests for property CRUD operations
- [x] Write unit tests for financial calculations
- [x] Write unit tests for subscription functionality
- [x] Run all tests and ensure they pass (6/6 tests passing)


## Test Data Creation

- [x] Create seed script for realistic investment property
- [x] Add property details (purchase price, date, location)
- [x] Add equity loans with realistic terms
- [x] Add main principal loan with IO period
- [x] Add property valuations and growth rates
- [x] Add rental income with growth projections
- [x] Add expenses (rates, insurance, maintenance, etc.)
- [x] Add depreciation schedule
- [x] Run seed script and verify data in dashboard
- [x] Fix monetary values to use cents as per schema
- [x] Verify debt displays correctly ($570k) and equity growth projections work


## Loan Repayment & Debt Visualization Enhancements

- [x] Add loan repayment type selector (Interest Only vs Principal & Interest)
- [x] Add Interest Only period configuration control
- [x] Create debt tracking chart showing debt over time
- [x] Show debt decrease for P&I loans vs stable debt for IO loans
- [x] Add debt projection line to main dashboard chart
- [x] Enhance cashflow view to show rental income breakdown
- [x] Enhance cashflow view to show expense breakdown
- [x] Add toggle to switch between different debt scenarios
- [x] Verify test property expenses and rental income display correctly


## Property Detail Page Enhancements

- [x] Redesign PropertyDetail page with comprehensive sections
- [x] Add Property Details section (address, purchase info, ownership)
- [x] Add Financials Overview section (value, equity, debt)
- [x] Add Loans section showing all loans with balances
- [x] Add Rental Income section with weekly rent display
- [x] Add Expenses section with detailed breakdown
- [x] Add Cashflow Summary (income minus expenses weekly)
- [x] Create Expense Log component matching reference design
- [x] Add expense breakdown categories (repairs, insurance, rates, etc.)
- [x] Add collapsible expense log entries
- [x] Add growth rate controls for rental income
- [x] Add growth rate controls for expenses
- [x] Add growth rate controls for property value
- [x] Make all financial fields editable
- [ ] Populate Property 1 with realistic placeholder data (deferred - test properties)
- [ ] Populate Property 2 with realistic placeholder data (deferred - test properties)
- [ ] Populate Property 3 with realistic placeholder data (deferred - test properties)
- [x] Populate Brisbane property with complete financial data
- [x] Test property detail page displays all information correctly
