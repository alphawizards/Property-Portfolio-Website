# Mortgage Monster Feature Analysis

## Key Features to Implement

### 1. Loan Details Section (Interactive Sliders)
- **Deposit** - Dollar amount with slider
- **LVR** - Percentage with slider (auto-calculated from deposit/property value)
- **Property Value** - Dollar amount with slider
- **Loan Amount** - Dollar amount with slider (locked, calculated from LVR)
- **Term** - Years with slider (default 25)
- **Interest Rate** - Percentage with slider
- **Interest Option** - Dropdown (Variable, Fixed terms, Interest Only)
- **Property Growth** - Percentage with slider
- **Monthly Repayment** - Calculated display
- **Split Loan** - Toggle switch
- **Repayment Frequency** - Dropdown (Monthly, Fortnightly, Weekly)
- **Start Date** - Date picker
- **End Date** - Auto-calculated from term

### 2. Stacked Area Charts
#### Repayments Chart
- X-axis: Years (2026-2050)
- Y-axis: Dollar amounts
- Three stacked areas:
  - **Interest** (red/orange gradient) - bottom layer
  - **Principal** (green gradient) - middle layer  
  - **Repayment** (yellow gradient) - top line showing total
- Shows how principal increases and interest decreases over time

#### Property Value Chart
- X-axis: Years
- Y-axis: Dollar amounts
- Two stacked areas:
  - **Market Value of Property** (teal/green gradient) - full height
  - **Equity** (yellow/gold gradient) - top portion
- Shows LVR target line (e.g., "80% LVR")
- Displays "80% LVR in November 2028" milestone

### 3. Interest Rates Forecast
- **Near Term** slider (default: 3 years ahead)
  - Shows: "In 2028 interest rates will be 6.0%"
- **Long Term** slider (default: 10 years ahead)
  - Shows: "In 2038 interest rates will be 6.0%"
- ADVANCED and RESET buttons
- Impacts repayment chart calculations

### 4. Property Market Forecast
- **Near Term** slider (default: 8 years ahead)
  - Shows: "In 2033 property growth will be 4.0%"
- **Long Term** slider (default: 17 years ahead)
  - Shows: "In 2042 property growth will be 4.0%"
- ADVANCED and RESET buttons
- Impacts property value and equity calculations

### 5. Summary Cards
- **Monthly Repayments** - $5,154
- **Total Payments** - $1,546,323
- **Monthly Interest** - $4,000
- **Total Interest** - $746,323
- **LVR Target** - 80% LVR in December 2025 (with CHANGE LVR TARGET button)
- **Future Property Value** - $2,704,749 in 2050

### 6. Extra Payments Section (Collapsible)
#### Offset Account
- **Opening Balance** - Dollar input field
- **Extra Offset Payments** - Add multiple payments with dates
- "+ ADD OFFSET PAYMENTS" button
- Shows impact on reducing interest paid

#### Extra Repayments
- **Extra repayment** - Dollar amount
- **Frequency** - Dropdown (Monthly, Fortnightly, Weekly)
- **Full Term of Loan** - Toggle switch
- "+ ADD EXTRA PAYMENTS" button
- Shows multiple extra payment schedules

#### Lump Sum Payment
- **One-off payment** - Dollar amount
- **Date** - Date picker
- Shows impact on loan duration

#### Summary Display
- **Reduction in cost of mortgage** - $0
- **Total additional payments** - $0
- **Total saving** - $0
- **Reduction in duration of mortgage** - 0 Months

### 7. Monthly Repayments Chart (with Extra Payments)
- Stacked area chart showing:
  - **Repayment** (yellow) - total payment line
  - **Principal** (green) - principal portion
  - **Interest** (red) - interest portion
- Dashed line shows baseline without extra payments
- Visualizes accelerated payoff with extra payments

### 8. Change in Loan Balance Chart
- Shows total outstanding principal over time
- Yellow/gold gradient area
- Demonstrates faster payoff with extra payments
- Dashed line for comparison

## UI/UX Patterns
- Dark theme with orange/yellow accent colors
- Collapsible sections with "Open/Hide" toggles
- Sliders with real-time value updates
- Download/save buttons for charts
- "EDIT FEES" button for mortgage fees
- Responsive layout with side-by-side charts
- Smooth gradient fills in charts
- Clear visual hierarchy with section headers

## Calculation Logic Needed
1. Loan amortization with variable interest rates over time
2. Property value growth projections with variable rates
3. Equity calculation (property value - loan balance)
4. LVR calculation and target tracking
5. Impact of offset accounts on interest calculations
6. Impact of extra repayments on loan duration
7. Lump sum payment effects
8. Monthly vs fortnightly vs weekly repayment conversions
9. Interest-only period handling
10. Split loan calculations

## Implementation Priority
1. ✅ Basic loan details with sliders
2. ✅ Repayment breakdown chart (stacked area)
3. ✅ Property value & equity chart
4. ✅ Interest rate forecast controls
5. ✅ Property growth forecast controls
6. ✅ Summary cards with key metrics
7. ⚠️ Offset account functionality
8. ⚠️ Extra repayments section
9. ⚠️ Lump sum payments
10. ⚠️ Monthly repayments impact chart
