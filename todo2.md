# Property Portfolio Manager - Frontend & Scenarios Sprint

## 🏗 Phase 2: Scenario UI (The "What-If" Interface)
*Goal: Allow users to visualize and manipulate their "Hypothetical" portfolios.*

- [ ] **Scenario Management Components**
    - [ ] Create `components/ScenarioSelector.tsx`: A dropdown in the top navigation to switch between "Live Portfolio" and "Scenarios".
    - [ ] Create `components/CreateScenarioDialog.tsx`: A form to name a new scenario (e.g., "Aggressive Growth 2026") and call `scenarios.clone`.
    - [ ] **Integration:** Update `DashboardLayout.tsx` to include the Selector and Create button.

- [ ] **Side-by-Side Comparison Page**
    - [ ] Refactor `pages/Comparison.tsx`:
        - [ ] Fetch data for *two* portfolios (Baseline vs Selected Scenario).
        - [ ] Render two `AreaChart`s side-by-side (or overlapping lines with distinct colors).
        - [ ] Add a "Delta" card showing the difference in Net Worth at Year 10, 20, 30.

- [ ] **"Hypothetical" Property Flagging**
    - [ ] Update `AddProperty.tsx` wizard:
        - [ ] If current context is a Scenario, auto-check a "Hypothetical Purchase" flag.
        - [ ] Add "Purchase Date" into the future (allowed for scenarios).

## 🚀 Phase 3: Dashboard Optimization (The "Speed" Update)
*Goal: Switch the Dashboard to use the new single-request Aggregator.*

- [ ] **Refactor Dashboard.tsx**
    - [ ] **Delete:** Remove separate queries for `properties.list`, `loans.list`, `valuations.list`.
    - [ ] **Integrate:** Use the new `portfolios.getDashboard` tRPC query.
    - [ ] **Wire:** Connect the "KPI Cards" (Net Worth, Debt, Equity) directly to the aggregated response.
    - [ ] **Benefit:** This should reduce page load time by ~40% by eliminating "Request Waterfalls."

## 🔮 Phase 4: Advanced Financial Logic (Future Prep)
*Goal: Make the numbers bulletproof.*

- [ ] **Tax & Inflation Layer**
    - [ ] Update `shared/calculations.ts` to include an `inflationRate` parameter (default 2.5%).
    - [ ] Implement "Real Value" (NPV) toggle on charts (showing values in today's dollars).

## ✅ Definition of Done
1. User can click "Create Scenario", name it, and see a loading spinner while it clones.
2. User can toggle between "Live" and "Scenario 1" and see the Dashboard numbers change.
3. User can visit `/comparison` and see a chart showing "If I buy this property, I will be $X richer in 10 years."