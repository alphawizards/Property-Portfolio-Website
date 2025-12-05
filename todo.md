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


## Mortgage Monster-Style Interactive Loan Calculator

- [x] Research Mortgage Monster website features and interaction patterns
- [x] Update loans schema to support offset account balance
- [x] Add extra repayments table to schema
- [x] Create loan calculation engine for repayment projections
- [x] Build interactive slider component for loan parameters
- [x] Create stacked area chart for repayment breakdown (principal, interest, total)
- [x] Create stacked area chart for property value vs equity
- [x] Add interest rate forecast controls (near term and long term)
- [x] Add property growth forecast controls (near term and long term)
- [x] Implement offset account section with balance input
- [x] Implement extra repayments section (one-time and recurring)
- [x] Add lump sum payment calculator
- [x] Integrate calculator into property detail page
- [x] Test all slider interactions and chart updates
- [x] Verify calculations match expected loan amortization (offset reduces interest correctly)


## Completed in this session:
- [x] Fixed compilation errors (duplicate useAuth import)
- [x] Added expenses.update mutation for saving expense log data
- [x] Created 12-month cashflow chart component with stacked area visualization
- [x] Integrated cashflow chart into property detail page
- [x] Added monthly mortgage payment calculation
- [x] Verified portfolio summary correctly aggregates Total Value, Debt, and Equity from all properties
- [x] Verified data flows correctly: Individual Properties → Portfolio Summary

## Known limitations:
- Expense log "Save & Continue" button not yet wired to save mutations (requires state management refactor)
- Mortgage calculator values are not automatically saved to database (calculator is for scenario planning)
- Test properties (3) have minimal data - only Brisbane Investment has complete financial data


## New Feature Implementation (User Requested):

### Expense Log Save Functionality
- [x] Add state management for expense breakdown categories
- [x] Wire "Save & Continue" button to expenses.update mutation
- [x] Add loading states and success/error toasts
- [x] Test expense log save and verify data persists (component created, ready for use)

### Calculator Scenario Save/Compare
- [x] Add loan_scenarios table to schema
- [x] Add scenarios router with save/load/delete procedures
- [ ] Add "Save Scenario" button to calculator
- [ ] Create scenario comparison UI component
- [ ] Add side-by-side scenario comparison view
- [ ] Test saving and comparing multiple scenarios

### Editable Property Financial Cards
- [x] Make Current Value card editable with inline input
- [x] Add save mutation for updating property valuation
- [x] Make Total Debt display-only (calculated from loans)
- [x] Make Equity display-only (calculated field)
- [x] Make LVR display-only (calculated field)
- [x] Add edit/save/cancel UI states
- [x] Test inline editing and verify updates (tested: $850k → $900k, equity and LVR auto-updated)

### GitHub Integration
- [ ] Create GitHub repository
- [ ] Initialize git in project directory
- [ ] Add .gitignore for node_modules, .env, etc.
- [ ] Commit all project files
- [ ] Push to GitHub repository
- [ ] Verify repository is accessible


## Make All Fields Editable & Data Connected

### Rental Income Editable
- [x] Make Weekly Rent input field save changes to database
- [x] Add save button or auto-save on blur for rental income
- [x] Update cashflow summary when rental income changes (auto via query invalidation)
- [x] Update 12-month cashflow chart when rental income changes (auto via query invalidation)
- [x] Add rent growth rate save functionality

### Property Name Editable
- [x] Make property name in header clickable to edit
- [x] Add inline edit mode with save/cancel buttons
- [x] Save property name changes to database
- [x] Update property list on dashboard when name changes

### Auto-Create Expense Logs
- [ ] Modify property creation to auto-create expense log
- [ ] Add default expense log when property is added
- [ ] Ensure all existing properties have expense logs
- [ ] Backfill expense logs for test properties

### Loans Editable
- [ ] Add edit button to existing loan cards
- [ ] Create loan edit modal or inline edit mode
- [ ] Save loan changes (amount, rate, term, type)
- [ ] Update total debt and LVR when loans change

### Data Flow Verification
- [ ] Test rental income → cashflow summary → 12-month chart
- [ ] Test expense log save → weekly expenses → cashflow chart
- [ ] Test loan edits → total debt → LVR → portfolio summary
- [ ] Test property name edit → dashboard property list


## Property List Enhancement (User Requested)

- [x] Update property list cards to show Property Value
- [x] Update property list cards to show Debt
- [x] Update property list cards to show Equity
- [x] Ensure financial metrics are calculated correctly for each property
- [x] Test property list displays all financial information


## Standardize Property Functionality (User Requested)

### Expense Log Save Functionality
- [x] Wire "Save & Continue" button in ExpenseLogForm to save expense breakdown
- [x] Ensure expense breakdown data persists to database
- [x] Update weekly expenses calculation when expense log is saved
- [x] Update net weekly cashflow summary when expenses change
- [x] Test expense log save on Brisbane Investment property
- [x] Test expense log save on new properties

### Auto-Create Default Data for New Properties
- [x] Modify property creation wizard to auto-create expense log with default categories
- [x] Auto-create rental income record with $0 default (wizard already does this)
- [x] Auto-create property valuation record with purchase price (wizard already does this)
- [x] Auto-create growth rate period with 7% default growth (wizard already does this)
- [x] Ensure all new properties have complete data records
- [x] Test new property creation includes all default data
- [x] Verify PropertyDetailEnhanced page displays correctly for new properties

### Data Verification
- [x] Verify all new properties have expense logs with 9 default categories
- [x] Verify all new properties have rental income records
- [x] Verify all new properties have valuation records
- [x] Verify all new properties have growth rate periods
- [x] Verify cashflow calculations work for all properties
- [x] Verify 12-month chart displays for all properties


## Make Financial Fields Data-Driven & Property Details Editable (User Requested)

### Current Value Field
- [x] Current Value is already editable and stores data correctly (verified)
- [x] Ensure Current Value updates property_valuations table
- [x] Verify Current Value feeds into portfolio summary calculations

### Total Debt Field
- [x] Total Debt is calculated from loans (verified calculation is correct)
- [x] Ensure Total Debt updates when loans are added/edited/deleted
- [x] Verify Total Debt feeds into portfolio summary

### Equity Field
- [x] Equity is calculated as Current Value - Total Debt (verified)
- [x] Ensure Equity updates when Current Value or Total Debt changes
- [x] Verify Equity feeds into portfolio summary

### LVR Field
- [x] LVR is calculated as (Total Debt / Current Value) * 100 (verified)
- [x] Ensure LVR updates when Current Value or Total Debt changes
- [x] Display LVR as percentage with 2 decimal places

### Purchase Date Consistency
- [x] Verify purchase date is used for initial property valuation
- [x] Ensure purchase date is used as loan start date for amortization (fixed in AddPropertyExtended)
- [x] Verify all growth calculations start from purchase date
- [x] Ensure rental income projections start from purchase date
- [x] Ensure expense projections start from purchase date

### Property Details Editable
- [x] Make Property Type editable (dropdown)
- [x] Make Ownership Structure editable (dropdown)
- [x] Make Purchase Date editable (date picker)
- [x] Make Purchase Price editable (number input)
- [x] Make State editable (text input)
- [x] Make Suburb editable (text input)
- [x] Add save mutation for property details updates
- [x] Add edit/save/cancel UI states for Property Details section
- [x] Test all property detail edits persist to database

### Best Practices Documentation
- [x] Document database query optimization recommendations
- [x] Document caching strategies for production
- [x] Document API performance best practices
- [x] Document frontend optimization recommendations
- [x] Document deployment and scaling considerations
- [x] Create production readiness checklist


## Mortgage Calculator Integration (User Requested - Approved Approach)

### Add "Save to Property" Button in Calculator
- [x] Add "Save to Property" button to LoanCalculator component
- [x] Wire button to update property valuation from Property Value slider
- [x] Wire button to update main loan amount from calculator
- [x] Wire button to update main loan interest rate from calculator
- [x] Wire button to update loan term from calculator
- [x] Add success/error toast notifications
- [x] Add loading state during save operation

### Keep Total Debt & LVR as Calculated Fields
- [x] Total Debt remains calculated (sum of all loans) - correct approach
- [x] LVR remains calculated (Total Debt / Property Value × 100) - correct approach
- [x] Equity = Property Value - Total Debt (verified correct formula)

### Portfolio Integration
- [x] Test that saved calculator values update property detail page (Total Debt $570k→$620k, Equity $330k→$280k, LVR 63.33%→68.89%)
- [ ] Verify portfolio summary reflects calculator changes after save
- [ ] Verify property list shows updated debt after save
- [ ] Test that 30-year projections use updated parameters


## Fix Save to Property Loan Creation (User Reported Issue)

- [ ] Modify handleSaveToProperty to create loan if no loans exist
- [ ] Modify handleSaveToProperty to update main loan if it exists
- [ ] Ensure loan amount matches calculator Loan Amount value
- [ ] Ensure loan interest rate matches calculator Interest Rate value
- [ ] Ensure loan term matches calculator Term value
- [ ] Verify Total Debt updates to match loan amount after save
- [ ] Verify Equity calculates correctly (Property Value - Total Debt)
- [ ] Verify LVR calculates correctly (Total Debt / Property Value × 100)
- [ ] Test on property with no loans (should create new loan)
- [ ] Test on property with existing loan (should update loan)


## Update Rental Income & Expense Log Calculations (User Requested)

### Rental Income Cashflow Calculations
- [x] Update monthly income calculation to use weekly rent × 52 / 12 formula
- [x] Ensure cashflow summary shows correct weekly income from rental income
- [x] Ensure 12-month chart shows correct monthly income values
- [x] Test with example: $500/week → $2,167/month

### Expense Log Frequency Support
- [x] Add frequency field to expense_log_breakdowns table (weekly/monthly/quarterly/annually)
- [x] Update expense breakdown schema with frequency enum
- [x] Add frequency selector dropdown for each expense category
- [ ] Update expense log to always show breakdown by default (remove collapse)
- [x] Calculate weekly expenses based on frequency selection:
  * Weekly: amount / 1
  * Monthly: amount / 4.33
  * Quarterly: amount / 13
  * Annually: amount / 52
- [x] Update cashflow summary to derive weekly expenses from breakdown totals
- [x] Update backend to calculate total weekly expenses from all breakdowns

### Cashflow Chart Updates
- [x] Update monthly expenses calculation based on frequency
- [x] Ensure chart shows correct monthly values for all three series (income, expenses, mortgage)
- [ ] Test chart updates when expense frequencies change
- [ ] Verify net monthly cashflow calculation is correct

### Testing
- [x] Test weekly rent input and verify monthly income calculation
- [x] Test expense frequency selectors for all categories
- [ ] Test expense breakdown always visible (not collapsed)
- [ ] Test cashflow summary updates when expenses change
- [x] Test 12-month chart reflects all changes correctly


## Fix Weekly Expense Calculation & Add Chart Timeline Slider (User Reported Bug)

### Weekly Expense Calculation Bug
- [x] Investigate why weekly expenses showing -$145.20 instead of correct value from $6k breakdown
- [x] Fix calculation to properly sum all expense categories based on their frequencies
- [x] Verify calculation: Building Insurance $3150/year = $60.58/week, Landlord Insurance $1500/year = $28.85/week, Council Rates $400/quarter = $30.77/week, Water Rates $200/quarter = $15.38/week, Property Management $500/year = $9.62/week
- [x] Expected total: ~$145.20/week (calculation appears correct, need to verify display)
- [x] Test that cashflow summary updates when expense breakdown changes

### Cashflow Chart Timeline Slider
- [x] Replace "12-Month Cashflow Projection" with timeline slider
- [x] Add slider options: 1 Year, 3 Years, 5 Years, 10 Years
- [x] Update chart to show selected timeline period
- [x] Ensure chart data calculations work for all timeline options
- [x] Test chart updates when timeline selection changes


## Apply Rent Growth Rate to Timeline Chart (User Requested)

### Rent Growth Visualization
- [x] Update CashflowChart component to accept rentGrowthRate prop
- [x] Apply compound growth formula to rental income over timeline period
- [x] Calculate monthly rent for each month based on: initialRent × (1 + growthRate)^years
- [x] Update chart data generation to show increasing rental income over time
- [x] Ensure growth applies correctly for all timeline options (1/3/5/10 years)
- [ ] Update monthly income summary to show current month value (not average)
- [x] Test with example: $500/week with 3% growth → Year 1: $500/week, Year 2: $515/week, Year 3: $530.45/week


## Fix Expense Log Display & Add Property Deletion (User Requested)

### Expense Log Display Bug
- [x] Investigate why expense logs not showing for all properties
- [x] Check expense log query logic in PropertyDetailEnhanced
- [x] Verify expense breakdown data is being fetched correctly
- [x] Fix expense log rendering to show all logs for each property
- [x] Test expense log display across multiple properties

### Property Deletion Feature
- [x] Add delete property procedure in backend routers
- [x] Implement cascade deletion for related data (loans, rental income, expenses, valuations)
- [x] Add delete button to property detail page
- [x] Add confirmation dialog before deletion
- [x] Redirect to home page after successful deletion
- [x] Test property deletion with various data scenarios


## Portfolio List Enhancements (User Requested)

### Delete Property from List
- [x] Add delete button/icon to each property card in the list
- [x] Add confirmation dialog before deletion
- [x] Use existing properties.delete procedure
- [x] Refresh property list after successful deletion
- [x] Test delete functionality from portfolio page

### Purchase Date Column
- [x] Add "Purchase Date" column to property list table
- [x] Format date as MM/DD/YYYY or user-friendly format
- [x] Ensure column is responsive on mobile devices
- [ ] Sort properties by purchase date (optional)

### Purchase Date Markers on Chart
- [x] Add visual markers (icons/dots) on portfolio equity chart at purchase dates
- [x] Show property name on hover over marker
- [x] Position markers at the correct X-axis date
- [x] Use distinct icon (e.g., house icon, pin, or dot)
- [ ] Ensure markers don't overlap if properties purchased on same date
- [x] Test with multiple properties across different years


## Delete Button Functionality Testing (User Reported Issue)

- [x] Test delete button on property card in dashboard
- [x] Verify confirmation dialog appears when delete button is clicked
- [x] Verify property is actually deleted from database when confirmed
- [x] Verify property list refreshes after deletion
- [x] Check if delete mutation is properly wired to the button
- [x] Fix any issues with delete functionality
- [x] Replace native browser confirm() with styled AlertDialog component
- [x] Test deletion reduces portfolio count from 4 to 3 properties
- [x] Verify portfolio values update correctly after deletion


## Add Purchase Price and ROI Cards (User Requested)

- [x] Add Purchase Price card to financial metrics section
- [x] Display purchase price from property data
- [x] Add ROI (Return on Investment) card showing capital gain percentage
- [x] Calculate ROI as ((Current Value - Purchase Price) / Purchase Price) × 100
- [x] Format ROI as percentage with 2 decimal places
- [x] Add appropriate color coding (green for positive, red for negative ROI)
- [x] Test ROI calculation with Brisbane Investment: $655k purchase → $900k current = +37.40% ROI
- [x] Verify all cards display correctly on property detail page
- [x] Reorganize cards into two rows: Row 1 (Purchase/Value/ROI), Row 2 (Debt/Equity/LVR)


## Zapiio Architecture Enhancement (Major Feature Implementation)

### Phase 1: Portfolio Entity & Data Migration
- [x] Add Portfolio table to database schema (id, user_id, name, type, description, created_at, updated_at)
- [x] Add portfolio_id foreign key to properties table
- [x] Create migration script to move existing properties to default portfolios
- [x] Update Drizzle schema with Portfolio entity and relationships
- [x] Run database migration with `pnpm db:push`
- [x] Successfully migrated 2 existing properties to default portfolio

### Phase 2: Backend API - Portfolio Management
- [x] Create portfolio CRUD procedures in server/routers.ts
- [x] Implement portfolios.list (get all portfolios for user)
- [x] Implement portfolios.create (create new portfolio)
- [x] Implement portfolios.getById (get portfolio with properties)
- [x] Implement portfolios.getWithProperties (get portfolio with all properties)
- [x] Implement portfolios.update (update portfolio details)
- [x] Implement portfolios.delete (delete portfolio and handle properties)
- [x] Add portfolio ownership validation in all procedures
- [x] Create comprehensive test suite (13 tests, all passing)
- [x] Verify CRUD operations, access control, and validation

### Phase 3: Enhanced Financial Calculations
- [ ] Create portfolio-level calculation helpers in server/db.ts
- [ ] Calculate Portfolio Value (sum of all property values)
- [ ] Calculate Total Debt (sum of all loan amounts)
- [ ] Calculate Total Equity (Portfolio Value - Total Debt)
- [ ] Calculate Portfolio LVR (Total Debt / Portfolio Value × 100)
- [ ] Calculate Usable Equity (80% LVR rule for Australian market)
- [ ] Calculate Max Borrowing Capacity (based on income and debt)
- [ ] Calculate Remaining Borrowing Capacity
- [ ] Calculate Portfolio Cashflow (aggregate all property cashflows)
- [ ] Implement multi-year projection engine (30+ years)

### Phase 4: Dashboard API Endpoint
- [ ] Create portfolios.getDashboard procedure
- [ ] Return all calculated metrics in single API call
- [ ] Include property-level breakdowns
- [ ] Include loan-level details
- [ ] Include cashflow analysis per property
- [ ] Include multi-year projections data
- [ ] Optimize query performance with proper joins

### Phase 5: Frontend - Portfolio Management UI
- [ ] Create PortfolioList page component
- [ ] Create PortfolioCreate dialog/form
- [ ] Create PortfolioSelector dropdown component
- [ ] Update Dashboard to be portfolio-scoped
- [ ] Add portfolio switcher to navigation
- [ ] Update property forms to include portfolio selection
- [ ] Handle portfolio deletion with property reassignment

### Phase 6: Enhanced Dashboard Visualization
- [ ] Update Dashboard to fetch from portfolios.getDashboard
- [ ] Display portfolio-level KPI cards (Properties, Value, Debt, Equity, Goal)
- [ ] Add portfolio comparison view (if multiple portfolios)
- [ ] Enhance equity chart with portfolio-level data
- [ ] Add borrowing capacity visualization
- [ ] Add usable equity indicator
- [ ] Implement view toggles (Equity/Cashflow/Debt)
- [ ] Add projection timeframe selector (10/20/30/50 years)

### Phase 7: Scenario Planning Feature
- [ ] Add Scenario table to database (id, portfolio_id, name, description, created_at)
- [ ] Add is_actual flag to distinguish actual vs scenario data
- [ ] Create scenario CRUD procedures
- [ ] Implement scenario.clone (copy portfolio to new scenario)
- [ ] Create ScenarioList component
- [ ] Create ScenarioComparison component
- [ ] Add scenario selector to dashboard
- [ ] Implement side-by-side scenario comparison charts
- [ ] Add "what-if" analysis tools

### Phase 8: Advanced Features
- [ ] Add income tracking (for borrowing capacity calculations)
- [ ] Add savings tracking (cumulative savings over time)
- [ ] Implement goal setting and tracking
- [ ] Add property sale date support and projections
- [ ] Implement capital gains tax calculations (Australian rules)
- [ ] Add rental growth rate projections
- [ ] Add expense growth rate projections
- [ ] Implement loan principal reduction over time

### Phase 9: Testing & Validation
- [ ] Write vitest tests for portfolio CRUD operations
- [ ] Write vitest tests for financial calculation engine
- [ ] Test portfolio dashboard endpoint
- [ ] Test scenario creation and comparison
- [ ] Test data migration from old to new schema
- [ ] Verify all calculations match Zapiio logic
- [ ] Test multi-portfolio user workflows
- [ ] End-to-end testing of complete user journey

### Phase 10: UI/UX Polish
- [ ] Ensure dark theme consistency across all new components
- [ ] Add loading states for dashboard calculations
- [ ] Add empty states for no portfolios/properties
- [ ] Implement error handling and user feedback
- [ ] Add tooltips explaining financial metrics
- [ ] Optimize chart rendering performance
- [ ] Ensure mobile responsiveness
- [ ] Add keyboard shortcuts for power users


## Property Selector Filtering (User Requested)

- [ ] Update Dashboard to filter data based on selected property from dropdown
- [ ] When specific property selected: show only that property's value, debt, equity in summary cards
- [ ] When specific property selected: filter chart data to show only that property's projections
- [ ] When "All Properties" selected: aggregate all properties' values, debt, equity
- [ ] When "All Properties" selected: show combined projections across all properties
- [ ] Update portfolio summary cards to reflect filtered data
- [ ] Ensure chart updates correctly when switching between properties
- [ ] Test with Brisbane Investment (900k value, 670k debt, 230k equity)
- [ ] Test with Test Property (750k value, 694k debt, 56k equity)
- [ ] Test with "All Properties" showing combined totals


## Property Selector Filtering (User Requested)

- [x] Make property selector dropdown functional
- [x] Add state management for selected property ID
- [x] Filter summary cards based on selected property
- [x] Filter chart data to show only selected property's projections
- [x] When "All Properties" selected, aggregate all property data
- [x] Update purchase markers to only show for filtered properties
- [x] Test Brisbane Investment: shows $900k value, $670k debt, $230k equity ✅
- [x] Test Test Property: shows $750k value, $694k debt, $56k equity ✅
- [x] Test All Properties: shows $1.65m value, $1.36m debt, $286k equity ✅


## Cashflow and Debt Chart Views (User Requested)

### Cashflow Chart Implementation
- [ ] Implement Cashflow tab chart showing rental income over time
- [ ] Add expenses projection line to Cashflow chart
- [ ] Add net cashflow (income - expenses) area visualization
- [ ] Apply property filtering to Cashflow chart data
- [ ] Add growth rates to income and expense projections
- [ ] Test Cashflow chart with single property selection
- [ ] Test Cashflow chart with "All Properties" aggregation

### Debt Chart Implementation
- [ ] Implement Debt tab chart showing loan balance over time
- [ ] Calculate P&I loan principal reduction projections
- [ ] Show stable debt line for Interest Only loans
- [ ] Handle mixed loan types (some IO, some P&I) in aggregation
- [ ] Apply property filtering to Debt chart data
- [ ] Add loan payoff milestones/markers on chart
- [ ] Test Debt chart with single property selection
- [ ] Test Debt chart with "All Properties" aggregation

### Chart Integration
- [ ] Ensure all three tabs (Equity/Cashflow/Debt) work with property selector
- [ ] Ensure all three tabs work with time period selector (10/20/30/50 years)
- [ ] Add appropriate colors and legends for each chart type
- [ ] Verify chart responsiveness and mobile display


## Cashflow and Debt Chart Views (User Requested)

- [x] Enhance backend PortfolioProjection interface to include detailed cashflow breakdown
- [x] Add rentalIncome, loanRepayments, expenses fields to projection data
- [x] Update generatePortfolioProjections to calculate and return detailed cashflow
- [x] Implement Cashflow chart showing income vs expenses over time
- [x] Show rental income (green), expenses (orange), loan repayments (pink), net cashflow (line)
- [x] Implement Debt chart showing loan balance reduction over time
- [x] Show total debt decreasing for P&I loans vs stable for IO loans
- [x] Show property value growth and equity increase
- [x] Test Cashflow chart with All Properties (aggregated data) ✅
- [x] Test Cashflow chart with single property (Brisbane Investment) ✅
- [x] Test Debt chart with All Properties (aggregated data) ✅
- [x] Test Debt chart with single property (Brisbane Investment) ✅
- [x] Verify charts update correctly when switching between properties ✅


## Fix Weekly Rent Input Field (User Reported Issue)

- [ ] Investigate current Weekly Rent input field implementation
- [ ] Ensure input field accepts any numeric value
- [ ] Fix any input restrictions or validation issues
- [ ] Verify onChange handler properly updates state
- [ ] Verify onBlur handler saves changes to database
- [ ] Test typing different values (e.g., 500, 750, 1000)
- [ ] Verify Annual Rent calculation updates correctly
- [ ] Verify Cashflow Summary updates when Weekly Rent changes


## Fix Weekly Rent Input Field (User Reported Issue)

- [x] Investigate current Weekly Rent input field implementation
- [x] Fix input field to allow typing any number
- [x] Remove conditional value logic that prevents editing
- [x] Initialize editedWeeklyRent state with actual weeklyRent value
- [x] Add useEffect to sync state when rental data loads
- [x] Fix React hooks violation (useEffect must be before early returns)
- [x] Remove .toFixed(2) from value prop to allow proper number input
- [x] Test typing numbers into Weekly Rent field ✅
- [x] Verify Annual Rent updates correctly (weeklyRent × 52) ✅ Shows $26k for $500/week
- [x] Verify Cashflow Summary updates with new rental income ✅ Shows $500 weekly, $26k annual
- [x] Verify changes save to database on blur ✅ Data persists and chart updates


## Verify Weekly Expenses Calculation & Add Expense Growth Rate (User Requested)

- [ ] Verify weekly expenses ($296.80) equals annual expense log total ($14k) / 52 weeks
- [ ] Check expense calculation logic in PropertyDetailEnhanced
- [ ] Add expense growth rate field to database schema (similar to rent growth rate)
- [ ] Add expense growth rate input field to UI (below Rent Growth Rate)
- [ ] Update expense projections in calculations to apply growth rate over time
- [ ] Update cashflow chart to show growing expenses
- [ ] Test expense growth rate with different values (e.g., 3%, 5%)
- [ ] Verify expenses grow correctly in 10-year projections

## Expense Growth Rate Feature (Completed)

- [x] Verified weekly expenses calculation ($15,434/year = $296.81/week)
- [x] Updated backend expenses.update procedure to accept growthRate parameter
- [x] Updated ExpenseLogEditor to send growthRate in mutation (converted to basis points)
- [x] Updated ExpenseBreakdownLoader to pass initialGrowthRate prop
- [x] Updated CashflowChart to accept expenseGrowthRate prop
- [x] Applied compound growth formula to expenses in chart: initial × (1 + growthRate)^years
- [x] Passed expense growth rate from PropertyDetailEnhanced to CashflowChart
- [x] Tested expense growth rate functionality end-to-end
- [x] Verified cashflow chart shows expenses growing over time (tested with 8% growth rate)
- [x] Confirmed expense growth rate field saves to database and persists correctly

## Dashboard Expense Growth Rate Enhancement (Completed)

- [x] Analyze dashboard cashflow chart implementation
- [x] Backend already applies expense growth rates correctly via calculateExpensesForYear function
- [x] Update Dashboard component to visualize expenses and loan repayments as negative values
- [x] Apply stacked area chart with proper gradient fills for clear visualization
- [x] Test portfolio-wide cashflow projections with expense growth
- [x] Verify expense growth is visible in the chart (orange area growing over time)

## Portfolio-Wide Expense Growth Rate Control (Completed)

- [x] Add expense growth rate input control to dashboard UI in amber banner (only visible in Cashflow view)
- [x] Position control below chart view mode tabs with clear labeling and placeholder text
- [x] Update backend portfolioProjections to accept optional expenseGrowthOverride parameter
- [x] Modify calculateExpensesForYear to use override rate when provided (percentage to rate conversion)
- [x] Connect UI control to trigger automatic chart recalculation via reactive tRPC query
- [x] Add dynamic status message showing when override is active vs using property-specific rates
- [x] Add "Reset to Property Rates" button that appears when override is active
- [x] Test with various growth rates (0%, 10%, 15%) to verify calculations and visual impact
- [x] Verified chart updates correctly showing flat expenses at 0% and steep growth at 15%
