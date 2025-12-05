-- ============================================================================
-- COMPLETE SUBSCRIPTION SYSTEM MIGRATION
-- ============================================================================
-- Full database migration script for multi-tier subscription system
-- 
-- This script creates:
--   1. subscription_tiers table (Basic, Pro tier definitions)
--   2. user_subscriptions table (user → tier assignments)
--   3. users.role field (admin/user distinction)
--   4. Seed data for both tiers
--   5. Default subscriptions for existing users
--   6. Verification queries
--
-- Safe to run multiple times (idempotent with checks)
--
-- Version: 1.0
-- Date: 2025-01-06
-- Author: Property Portfolio Analyzer Team
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE SUBSCRIPTION_TIERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_tiers (
  -- Primary Key
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Tier Identification
  tier_name VARCHAR(50) NOT NULL UNIQUE 
    COMMENT 'Internal tier identifier (basic, pro, enterprise)',
  display_name VARCHAR(100) NOT NULL 
    COMMENT 'User-facing tier name displayed in UI',
  description TEXT 
    COMMENT 'Marketing description of tier benefits',
  
  -- Feature Limits (NULL = unlimited, 999 = unlimited for integers)
  property_limit INT NOT NULL DEFAULT 2 
    COMMENT 'Maximum number of properties user can add (999 = unlimited)',
  forecast_years_limit INT NOT NULL DEFAULT 10 
    COMMENT 'Maximum forecast years for projections (50 = max)',
  
  -- Feature Flags (0 = disabled, 1 = enabled)
  can_use_tax_calculator TINYINT(1) NOT NULL DEFAULT 0 
    COMMENT 'Access to Australian tax calculator feature',
  can_use_investment_comparison TINYINT(1) NOT NULL DEFAULT 0 
    COMMENT 'Access to property vs shares comparison tool',
  can_export_reports TINYINT(1) NOT NULL DEFAULT 0 
    COMMENT 'Access to PDF/Excel export functionality',
  can_use_advanced_analytics TINYINT(1) NOT NULL DEFAULT 0 
    COMMENT 'Access to advanced analytics and insights',
  
  -- Pricing (stored in cents to avoid floating point issues)
  monthly_price_cents INT NOT NULL DEFAULT 0 
    COMMENT 'Monthly subscription price in cents (2900 = $29.00)',
  annual_price_cents INT NOT NULL DEFAULT 0 
    COMMENT 'Annual subscription price in cents (29900 = $299.00)',
  
  -- Metadata
  is_active TINYINT(1) NOT NULL DEFAULT 1 
    COMMENT 'Whether tier is available for new subscriptions',
  sort_order INT NOT NULL DEFAULT 0 
    COMMENT 'Display order in pricing tables (lower = first)',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for Performance
  INDEX idx_tier_name (tier_name),
  INDEX idx_active (is_active),
  INDEX idx_sort_order (sort_order)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Subscription tier definitions with feature limits and pricing';

-- ============================================================================
-- STEP 2: CREATE USER_SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
  -- Primary Key
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Foreign Keys
  user_id INT NOT NULL 
    COMMENT 'Reference to users.id',
  tier_id INT NOT NULL 
    COMMENT 'Reference to subscription_tiers.id',
  
  -- Subscription Period
  start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP 
    COMMENT 'When subscription became active',
  end_date TIMESTAMP NULL DEFAULT NULL 
    COMMENT 'When subscription expires (NULL = no expiry, perpetual)',
  
  -- Status Tracking
  status ENUM('active', 'expired', 'cancelled') NOT NULL DEFAULT 'active' 
    COMMENT 'Current subscription status',
  
  -- Payment Integration (for future Stripe integration)
  stripe_subscription_id VARCHAR(255) NULL 
    COMMENT 'Stripe subscription ID for payment tracking',
  stripe_customer_id VARCHAR(255) NULL 
    COMMENT 'Stripe customer ID for user identification',
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Key Constraints
  FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE 
    COMMENT 'Delete subscription when user is deleted',
  FOREIGN KEY (tier_id) 
    REFERENCES subscription_tiers(id) 
    ON DELETE RESTRICT 
    COMMENT 'Prevent tier deletion if subscriptions exist',
  
  -- Indexes for Performance
  INDEX idx_user_id (user_id),
  INDEX idx_tier_id (tier_id),
  INDEX idx_status (status),
  INDEX idx_end_date (end_date),
  INDEX idx_user_status (user_id, status) 
    COMMENT 'Composite index for fast active subscription lookups',
  INDEX idx_stripe_subscription (stripe_subscription_id),
  INDEX idx_stripe_customer (stripe_customer_id),
  
  -- Constraints
  CONSTRAINT chk_valid_period 
    CHECK (end_date IS NULL OR end_date > start_date) 
    COMMENT 'Ensure end_date is after start_date'
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User subscription assignments with validity tracking';

-- ============================================================================
-- STEP 3: ALTER USERS TABLE - ADD ROLE FIELD
-- ============================================================================
-- Adds role field to existing users table for admin/user distinction
-- Safe to run multiple times (checks if column exists first)

SET @dbname = DATABASE();
SET @tablename = 'users';
SET @columnname = 'role';

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1 AS column_exists',
  CONCAT(
    'ALTER TABLE ', @tablename, 
    ' ADD COLUMN ', @columnname, 
    ' ENUM(''admin'', ''user'') NOT NULL DEFAULT ''user'' ',
    'COMMENT ''User role for access control (admin = full access, user = subscription-based)'' ',
    'AFTER email, ',
    'ADD INDEX idx_role (role)'
  )
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- STEP 4: SEED DATA - BASIC TIER
-- ============================================================================

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
  'basic',
  'Basic',
  'Perfect for getting started with property investment analysis. Track up to 2 properties with 10-year forecasts and core features.',
  2,                    -- Max 2 properties
  10,                   -- Max 10 year forecast
  0,                    -- No tax calculator
  0,                    -- No investment comparison
  0,                    -- No export reports
  0,                    -- No advanced analytics
  0,                    -- Free tier
  0,                    -- Free tier
  1,                    -- Active
  1                     -- Display first
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
-- STEP 5: SEED DATA - PRO TIER
-- ============================================================================

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
  'pro',
  'Pro',
  'Unlimited properties and advanced features for serious investors. Includes tax calculator, investment comparisons, 50-year forecasts, and report exports.',
  999,                  -- Unlimited properties (999 treated as unlimited)
  50,                   -- Max 50 year forecast
  1,                    -- Tax calculator enabled
  1,                    -- Investment comparison enabled
  1,                    -- Export reports enabled
  1,                    -- Advanced analytics enabled
  2900,                 -- $29.00/month
  29900,                -- $299.00/year (save ~$50)
  1,                    -- Active
  2                     -- Display second
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
-- STEP 6: ASSIGN DEFAULT SUBSCRIPTIONS TO EXISTING USERS
-- ============================================================================
-- All existing users without a subscription get Basic tier
-- Safe to run multiple times (checks for existing subscriptions)

INSERT INTO user_subscriptions (user_id, tier_id, status, start_date, end_date)
SELECT 
  u.id,
  (SELECT id FROM subscription_tiers WHERE tier_name = 'basic' LIMIT 1) AS tier_id,
  'active' AS status,
  CURRENT_TIMESTAMP AS start_date,
  NULL AS end_date
FROM users u
WHERE NOT EXISTS (
  SELECT 1 
  FROM user_subscriptions us 
  WHERE us.user_id = u.id 
    AND us.status = 'active'
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Display all subscription tiers
SELECT 
  '=== SUBSCRIPTION TIERS ===' AS '';

SELECT 
  tier_name AS 'Tier',
  display_name AS 'Display Name',
  property_limit AS 'Max Properties',
  forecast_years_limit AS 'Max Years',
  CASE WHEN can_use_tax_calculator = 1 THEN '✓' ELSE '✗' END AS 'Tax Calc',
  CASE WHEN can_use_investment_comparison = 1 THEN '✓' ELSE '✗' END AS 'Invest Compare',
  CASE WHEN can_export_reports = 1 THEN '✓' ELSE '✗' END AS 'Export',
  CASE WHEN can_use_advanced_analytics = 1 THEN '✓' ELSE '✗' END AS 'Analytics',
  CONCAT('$', ROUND(monthly_price_cents / 100, 2)) AS 'Monthly Price',
  CONCAT('$', ROUND(annual_price_cents / 100, 2)) AS 'Annual Price',
  CASE WHEN is_active = 1 THEN '✓' ELSE '✗' END AS 'Active'
FROM subscription_tiers
ORDER BY sort_order;

-- Display user subscription status
SELECT 
  '=== USER SUBSCRIPTIONS ===' AS '';

SELECT 
  u.id AS 'User ID',
  u.name AS 'Name',
  u.email AS 'Email',
  COALESCE(u.role, 'user') AS 'Role',
  COALESCE(t.tier_name, 'none') AS 'Tier',
  COALESCE(t.display_name, 'No Subscription') AS 'Display Name',
  COALESCE(us.status, 'none') AS 'Status',
  DATE_FORMAT(us.start_date, '%Y-%m-%d') AS 'Start Date',
  COALESCE(DATE_FORMAT(us.end_date, '%Y-%m-%d'), 'Never') AS 'End Date'
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
LEFT JOIN subscription_tiers t ON us.tier_id = t.id
ORDER BY u.id
LIMIT 10;

-- Count users by tier
SELECT 
  '=== USER DISTRIBUTION BY TIER ===' AS '';

SELECT 
  COALESCE(t.display_name, 'No Subscription') AS 'Tier',
  COUNT(DISTINCT u.id) AS 'User Count',
  CONCAT(ROUND(COUNT(DISTINCT u.id) * 100.0 / (SELECT COUNT(*) FROM users), 1), '%') AS 'Percentage'
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
LEFT JOIN subscription_tiers t ON us.tier_id = t.id
GROUP BY t.display_name
ORDER BY COUNT(DISTINCT u.id) DESC;

-- Count users by role
SELECT 
  '=== USER DISTRIBUTION BY ROLE ===' AS '';

SELECT 
  COALESCE(role, 'user') AS 'Role',
  COUNT(*) AS 'User Count'
FROM users
GROUP BY role
ORDER BY COUNT(*) DESC;

-- ============================================================================
-- POST-MIGRATION CHECKLIST
-- ============================================================================

SELECT 
  '=== POST-MIGRATION CHECKLIST ===' AS '';

SELECT 
  'Tables Created' AS 'Check',
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.tables 
          WHERE table_schema = DATABASE() 
          AND table_name IN ('subscription_tiers', 'user_subscriptions')) = 2 
    THEN '✓ PASS' 
    ELSE '✗ FAIL' 
  END AS 'Status'
UNION ALL
SELECT 
  'Tiers Seeded' AS 'Check',
  CASE 
    WHEN (SELECT COUNT(*) FROM subscription_tiers WHERE tier_name IN ('basic', 'pro')) = 2 
    THEN '✓ PASS' 
    ELSE '✗ FAIL' 
  END AS 'Status'
UNION ALL
SELECT 
  'Users Have Subscriptions' AS 'Check',
  CASE 
    WHEN (SELECT COUNT(*) FROM users) = 
         (SELECT COUNT(DISTINCT user_id) FROM user_subscriptions WHERE status = 'active')
    THEN '✓ PASS' 
    ELSE '✗ FAIL' 
  END AS 'Status'
UNION ALL
SELECT 
  'Role Column Exists' AS 'Check',
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.columns 
          WHERE table_schema = DATABASE() 
          AND table_name = 'users' 
          AND column_name = 'role') = 1 
    THEN '✓ PASS' 
    ELSE '✗ FAIL' 
  END AS 'Status';

-- ============================================================================
-- ADMIN QUICK START GUIDE
-- ============================================================================

/*
=== PROMOTE USER TO ADMIN ===
Replace 'your-email@example.com' with your actual email:

UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

Verify:
SELECT id, name, email, role FROM users WHERE role = 'admin';

=== UPGRADE USER TO PRO ===
Replace user_id with actual user ID:

UPDATE user_subscriptions 
SET tier_id = (SELECT id FROM subscription_tiers WHERE tier_name = 'pro')
WHERE user_id = 1 AND status = 'active';

Verify:
SELECT u.name, t.tier_name 
FROM users u
JOIN user_subscriptions us ON u.id = us.user_id
JOIN subscription_tiers t ON us.tier_id = t.id
WHERE u.id = 1 AND us.status = 'active';

=== GRANT PRO SUBSCRIPTION TO USER ===
For new Pro subscription (if user doesn't have one):

INSERT INTO user_subscriptions (user_id, tier_id, status, start_date)
VALUES (
  1,  -- Replace with user_id
  (SELECT id FROM subscription_tiers WHERE tier_name = 'pro'),
  'active',
  NOW()
);

=== CANCEL SUBSCRIPTION ===
Set end date to now:

UPDATE user_subscriptions 
SET status = 'cancelled', end_date = NOW()
WHERE user_id = 1 AND status = 'active';

=== VIEW USER FEATURE ACCESS ===
See what a user can do:

SELECT 
  u.name,
  u.role,
  t.tier_name,
  t.property_limit,
  t.forecast_years_limit,
  t.can_use_tax_calculator,
  t.can_use_investment_comparison,
  COUNT(p.id) AS current_properties
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
LEFT JOIN subscription_tiers t ON us.tier_id = t.id
LEFT JOIN properties p ON u.id = p.user_id
WHERE u.id = 1
GROUP BY u.id, u.name, u.role, t.tier_name, t.property_limit, 
         t.forecast_years_limit, t.can_use_tax_calculator, 
         t.can_use_investment_comparison;
*/

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================

/*
If you need to rollback this migration:

-- WARNING: This will delete all subscription data!

DROP TABLE IF EXISTS user_subscriptions;
DROP TABLE IF EXISTS subscription_tiers;
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- Restore from backup if needed
*/

-- ============================================================================
-- NOTES
-- ============================================================================

/*
1. IDEMPOTENT: Safe to run multiple times without errors
2. FOREIGN KEYS: Proper cascade rules (user delete → subscription delete)
3. INDEXES: Optimized for fast lookups on user_id, tier_id, status
4. DEFAULTS: All new users get 'user' role and 'basic' tier automatically
5. PRICING: Stored in cents to avoid floating point precision issues
6. UNLIMITED: Property limit 999 and forecast 50 years treated as unlimited
7. ADMIN BYPASS: Users with role='admin' bypass all subscription limits
8. STRIPE READY: Fields for stripe_subscription_id and stripe_customer_id
9. STATUS TRACKING: active/expired/cancelled for subscription lifecycle
10. VERIFICATION: Built-in queries to verify migration success

IMPORTANT: After running this migration:
1. Promote your account to admin
2. Test feature gates with basic user
3. Test upgrade flow to pro tier
4. Verify admin bypass works
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

SELECT 
  '=== MIGRATION COMPLETE ===' AS '',
  'Subscription system tables created and seeded successfully!' AS 'Status';
