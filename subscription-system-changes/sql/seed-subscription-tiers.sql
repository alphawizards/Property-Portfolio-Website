-- ============================================================================
-- SUBSCRIPTION TIERS SEED DATA
-- ============================================================================
-- Standalone script to seed subscription_tiers table with Basic and Pro tiers
-- Safe to run multiple times (uses ON DUPLICATE KEY UPDATE)
--
-- Usage:
--   mysql -u username -p database_name < seed-subscription-tiers.sql
--   OR execute via Drizzle after running pnpm db:push
--
-- Version: 1.0
-- Date: 2025-01-06
-- ============================================================================

-- ============================================================================
-- BASIC TIER
-- ============================================================================
-- Free tier for new users
-- Limits: 2 properties, 10-year forecasts, core features only

INSERT INTO subscription_tiers (
  tier_name,
  display_name,
  description,
  property_limit,
  forecast_years_limit,
  can_use_tax_calculator,
  can_use_investment_comparison,
  can_export_reports,
  can_use_advanced_analytics,
  monthly_price_cents,
  annual_price_cents,
  is_active,
  sort_order
) VALUES (
  'basic',                                                          -- tier_name (internal identifier)
  'Basic',                                                          -- display_name (user-facing)
  'Perfect for getting started with property investment analysis. Track up to 2 properties with 10-year forecasts.',
  2,                                                                -- property_limit (max 2 properties)
  10,                                                               -- forecast_years_limit (max 10 years)
  0,                                                                -- can_use_tax_calculator (disabled)
  0,                                                                -- can_use_investment_comparison (disabled)
  0,                                                                -- can_export_reports (disabled)
  0,                                                                -- can_use_advanced_analytics (disabled)
  0,                                                                -- monthly_price_cents (free)
  0,                                                                -- annual_price_cents (free)
  1,                                                                -- is_active (available for signup)
  1                                                                 -- sort_order (display first)
) ON DUPLICATE KEY UPDATE
  display_name = VALUES(display_name),
  description = VALUES(description),
  property_limit = VALUES(property_limit),
  forecast_years_limit = VALUES(forecast_years_limit),
  can_use_tax_calculator = VALUES(can_use_tax_calculator),
  can_use_investment_comparison = VALUES(can_use_investment_comparison),
  can_export_reports = VALUES(can_export_reports),
  can_use_advanced_analytics = VALUES(can_use_advanced_analytics),
  monthly_price_cents = VALUES(monthly_price_cents),
  annual_price_cents = VALUES(annual_price_cents),
  is_active = VALUES(is_active),
  sort_order = VALUES(sort_order),
  updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- PRO TIER
-- ============================================================================
-- Premium tier with all features unlocked
-- Limits: Unlimited properties, 50-year forecasts, all features enabled

INSERT INTO subscription_tiers (
  tier_name,
  display_name,
  description,
  property_limit,
  forecast_years_limit,
  can_use_tax_calculator,
  can_use_investment_comparison,
  can_export_reports,
  can_use_advanced_analytics,
  monthly_price_cents,
  annual_price_cents,
  is_active,
  sort_order
) VALUES (
  'pro',                                                            -- tier_name (internal identifier)
  'Pro',                                                            -- display_name (user-facing)
  'Unlimited properties and advanced features for serious investors. Includes tax calculator, investment comparisons, and 50-year forecasts.',
  999,                                                              -- property_limit (999 = unlimited)
  50,                                                               -- forecast_years_limit (50 years max)
  1,                                                                -- can_use_tax_calculator (enabled)
  1,                                                                -- can_use_investment_comparison (enabled)
  1,                                                                -- can_export_reports (enabled)
  1,                                                                -- can_use_advanced_analytics (enabled)
  2900,                                                             -- monthly_price_cents ($29.00/month)
  29900,                                                            -- annual_price_cents ($299.00/year, ~$25/month)
  1,                                                                -- is_active (available for signup)
  2                                                                 -- sort_order (display second)
) ON DUPLICATE KEY UPDATE
  display_name = VALUES(display_name),
  description = VALUES(description),
  property_limit = VALUES(property_limit),
  forecast_years_limit = VALUES(forecast_years_limit),
  can_use_tax_calculator = VALUES(can_use_tax_calculator),
  can_use_investment_comparison = VALUES(can_use_investment_comparison),
  can_export_reports = VALUES(can_export_reports),
  can_use_advanced_analytics = VALUES(can_use_advanced_analytics),
  monthly_price_cents = VALUES(monthly_price_cents),
  annual_price_cents = VALUES(annual_price_cents),
  is_active = VALUES(is_active),
  sort_order = VALUES(sort_order),
  updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Display seeded tiers to verify insertion

SELECT 
  tier_name AS 'Tier',
  display_name AS 'Display Name',
  property_limit AS 'Properties',
  forecast_years_limit AS 'Forecast Years',
  CASE 
    WHEN can_use_tax_calculator = 1 THEN '✓' 
    ELSE '✗' 
  END AS 'Tax Calc',
  CASE 
    WHEN can_use_investment_comparison = 1 THEN '✓' 
    ELSE '✗' 
  END AS 'Invest Compare',
  CASE 
    WHEN can_export_reports = 1 THEN '✓' 
    ELSE '✗' 
  END AS 'Export',
  CASE 
    WHEN can_use_advanced_analytics = 1 THEN '✓' 
    ELSE '✗' 
  END AS 'Analytics',
  CONCAT('$', monthly_price_cents / 100) AS 'Monthly',
  CONCAT('$', annual_price_cents / 100) AS 'Annual'
FROM subscription_tiers
WHERE is_active = 1
ORDER BY sort_order;

-- ============================================================================
-- EXPECTED OUTPUT
-- ============================================================================
-- +------------+--------------+------------+----------------+----------+---------------+--------+-----------+---------+---------+
-- | Tier       | Display Name | Properties | Forecast Years | Tax Calc | Invest Compare| Export | Analytics | Monthly | Annual  |
-- +------------+--------------+------------+----------------+----------+---------------+--------+-----------+---------+---------+
-- | basic      | Basic        |          2 |             10 | ✗        | ✗             | ✗      | ✗         | $0      | $0      |
-- | pro        | Pro          |        999 |             50 | ✓        | ✓             | ✓      | ✓         | $29     | $299    |
-- +------------+--------------+------------+----------------+----------+---------------+--------+-----------+---------+---------+

-- ============================================================================
-- FEATURE COMPARISON
-- ============================================================================

/*
BASIC TIER (Free)
-----------------
✓ Track up to 2 properties
✓ 10-year equity projections
✓ 10-year cashflow analysis
✓ 10-year debt tracking
✓ Rental income tracking
✓ Expense management
✓ Basic analytics
✗ Tax calculator (Pro only)
✗ Investment comparisons (Pro only)
✗ Export reports (Pro only)
✗ Advanced analytics (Pro only)

PRO TIER ($29/month or $299/year)
----------------------------------
✓ Unlimited properties (999 max)
✓ 50-year equity projections
✓ 50-year cashflow analysis
✓ 50-year debt tracking
✓ Rental income tracking
✓ Expense management
✓ Australian tax calculator
✓ Property vs shares comparison
✓ PDF/Excel export
✓ Advanced analytics
✓ Priority support (future)
✓ API access (future)
*/

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- 1. Safe to run multiple times (ON DUPLICATE KEY UPDATE)
-- 2. Property limit 999 is treated as "unlimited" in code
-- 3. Forecast limit 50 years is practical maximum
-- 4. Prices in cents to avoid floating point issues
-- 5. Annual price saves ~$50 compared to monthly ($348 vs $299)
-- 6. All new users automatically get Basic tier
-- 7. Admin users bypass all limits regardless of tier
-- 8. Feature flags (0/1) control access to premium features
-- 9. is_active flag allows disabling tiers without deletion
-- 10. sort_order controls display order in pricing tables
-- 
-- ============================================================================

-- ============================================================================
-- QUICK REFERENCE: ADMIN OPERATIONS
-- ============================================================================

-- View all tiers
-- SELECT * FROM subscription_tiers ORDER BY sort_order;

-- Disable a tier (prevent new signups)
-- UPDATE subscription_tiers SET is_active = 0 WHERE tier_name = 'basic';

-- Update pricing
-- UPDATE subscription_tiers 
-- SET monthly_price_cents = 3900, annual_price_cents = 39900 
-- WHERE tier_name = 'pro';

-- Add new feature flag
-- ALTER TABLE subscription_tiers ADD COLUMN can_use_new_feature TINYINT(1) DEFAULT 0;
-- UPDATE subscription_tiers SET can_use_new_feature = 1 WHERE tier_name = 'pro';

-- ============================================================================
