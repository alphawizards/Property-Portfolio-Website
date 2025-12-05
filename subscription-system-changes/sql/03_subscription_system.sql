-- ============================================================================
-- SUBSCRIPTION SYSTEM TABLES
-- ============================================================================
-- This script creates the subscription tier and user subscription tables
-- for the Property Portfolio Analyzer multi-tier access control system.
--
-- Tables:
--   1. subscription_tiers - Defines available subscription plans (Basic, Pro)
--   2. user_subscriptions - Links users to their active subscription tier
--   3. users (ALTER) - Adds role field for admin/user distinction
--
-- Version: 1.0
-- Date: 2025-01-06
-- ============================================================================

-- ============================================================================
-- 1. SUBSCRIPTION TIERS TABLE
-- ============================================================================
-- Stores available subscription plans with feature limits and flags

CREATE TABLE IF NOT EXISTS subscription_tiers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Tier Identification
  tier_name VARCHAR(50) NOT NULL UNIQUE COMMENT 'Internal tier identifier (basic, pro)',
  display_name VARCHAR(100) NOT NULL COMMENT 'User-facing tier name',
  description TEXT COMMENT 'Marketing description of the tier',
  
  -- Feature Limits (NULL = unlimited)
  property_limit INT NOT NULL DEFAULT 2 COMMENT 'Maximum number of properties (999 = unlimited)',
  forecast_years_limit INT NOT NULL DEFAULT 10 COMMENT 'Maximum forecast years (50 = unlimited)',
  
  -- Feature Flags (0 = disabled, 1 = enabled)
  can_use_tax_calculator TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Access to Australian tax calculator',
  can_use_investment_comparison TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Access to property vs shares comparison',
  can_export_reports TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Access to PDF/Excel export',
  can_use_advanced_analytics TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Access to advanced analytics features',
  
  -- Pricing (in cents, for future Stripe integration)
  monthly_price_cents INT NOT NULL DEFAULT 0 COMMENT 'Monthly subscription price in cents',
  annual_price_cents INT NOT NULL DEFAULT 0 COMMENT 'Annual subscription price in cents (usually ~10 months)',
  
  -- Metadata
  is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Whether tier is available for new subscriptions',
  sort_order INT NOT NULL DEFAULT 0 COMMENT 'Display order in pricing tables',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_tier_name (tier_name),
  INDEX idx_active (is_active),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Subscription tier definitions with feature limits and pricing';

-- ============================================================================
-- 2. USER SUBSCRIPTIONS TABLE
-- ============================================================================
-- Links users to their active subscription tier with validity period

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- User and Tier Relationship
  user_id INT NOT NULL COMMENT 'Reference to users table',
  tier_id INT NOT NULL COMMENT 'Reference to subscription_tiers table',
  
  -- Subscription Period
  start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When subscription became active',
  end_date TIMESTAMP NULL DEFAULT NULL COMMENT 'When subscription expires (NULL = no expiry)',
  
  -- Status
  status ENUM('active', 'expired', 'cancelled') NOT NULL DEFAULT 'active' COMMENT 'Current subscription status',
  
  -- Payment Tracking (for future Stripe integration)
  stripe_subscription_id VARCHAR(255) NULL COMMENT 'Stripe subscription ID',
  stripe_customer_id VARCHAR(255) NULL COMMENT 'Stripe customer ID',
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tier_id) REFERENCES subscription_tiers(id) ON DELETE RESTRICT,
  
  -- Indexes
  INDEX idx_user_id (user_id),
  INDEX idx_tier_id (tier_id),
  INDEX idx_status (status),
  INDEX idx_end_date (end_date),
  INDEX idx_user_status (user_id, status),
  
  -- Constraints
  CONSTRAINT chk_valid_period CHECK (end_date IS NULL OR end_date > start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User subscription assignments with validity tracking';

-- ============================================================================
-- 3. ALTER USERS TABLE - ADD ROLE FIELD
-- ============================================================================
-- Adds role field to existing users table for admin/user distinction

-- Check if role column exists before adding
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
  'SELECT 1', -- Column exists, do nothing
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' ENUM(''admin'', ''user'') NOT NULL DEFAULT ''user'' COMMENT ''User role for access control'' AFTER email, ADD INDEX idx_role (role)')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- SEED DATA: SUBSCRIPTION TIERS
-- ============================================================================

-- Insert Basic Tier
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
  'Perfect for getting started with property investment analysis. Track up to 2 properties with 10-year forecasts.',
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
  updated_at = CURRENT_TIMESTAMP;

-- Insert Pro Tier
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
  'Unlimited properties and advanced features for serious investors. Includes tax calculator, investment comparisons, and 50-year forecasts.',
  999,                  -- Unlimited properties (999 treated as unlimited)
  50,                   -- Max 50 year forecast
  1,                    -- Tax calculator enabled
  1,                    -- Investment comparison enabled
  1,                    -- Export reports enabled
  1,                    -- Advanced analytics enabled
  2900,                 -- $29/month
  29900,                -- $299/year (save ~$50)
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
  updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- SEED DATA: DEFAULT USER SUBSCRIPTIONS
-- ============================================================================
-- Assign all existing users to Basic tier if they don't have a subscription

INSERT INTO user_subscriptions (user_id, tier_id, status, start_date)
SELECT 
  u.id,
  (SELECT id FROM subscription_tiers WHERE tier_name = 'basic' LIMIT 1),
  'active',
  CURRENT_TIMESTAMP
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_subscriptions us 
  WHERE us.user_id = u.id AND us.status = 'active'
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- View all subscription tiers
SELECT 
  tier_name,
  display_name,
  property_limit,
  forecast_years_limit,
  can_use_tax_calculator,
  can_use_investment_comparison,
  CONCAT('$', monthly_price_cents / 100) AS monthly_price,
  CONCAT('$', annual_price_cents / 100) AS annual_price
FROM subscription_tiers
WHERE is_active = 1
ORDER BY sort_order;

-- View user subscription status
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  t.tier_name,
  t.display_name,
  us.status,
  us.start_date,
  us.end_date
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
LEFT JOIN subscription_tiers t ON us.tier_id = t.id
ORDER BY u.id;

-- Count users by tier
SELECT 
  COALESCE(t.display_name, 'No Subscription') AS tier,
  COUNT(DISTINCT u.id) AS user_count
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
LEFT JOIN subscription_tiers t ON us.tier_id = t.id
GROUP BY t.display_name
ORDER BY user_count DESC;

-- ============================================================================
-- EXAMPLE QUERIES FOR FEATURE GATES
-- ============================================================================

-- Example 1: Get user's active subscription with tier details
-- (This is what getUserSubscription() does)
SELECT 
  us.id,
  us.user_id,
  us.tier_id,
  us.status,
  us.start_date,
  us.end_date,
  t.tier_name,
  t.display_name,
  t.property_limit,
  t.forecast_years_limit,
  t.can_use_tax_calculator,
  t.can_use_investment_comparison,
  t.can_export_reports,
  t.can_use_advanced_analytics
FROM user_subscriptions us
INNER JOIN subscription_tiers t ON us.tier_id = t.id
WHERE us.user_id = 1  -- Replace with actual user ID
  AND us.status = 'active'
  AND (us.end_date IS NULL OR us.end_date > NOW())
LIMIT 1;

-- Example 2: Check if user can add more properties
-- (This is what canAddProperty() does)
SELECT 
  COUNT(p.id) AS current_count,
  t.property_limit,
  (COUNT(p.id) < t.property_limit) AS can_add,
  (t.property_limit - COUNT(p.id)) AS remaining
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
LEFT JOIN subscription_tiers t ON us.tier_id = t.id
LEFT JOIN properties p ON u.id = p.user_id
WHERE u.id = 1  -- Replace with actual user ID
GROUP BY u.id, t.property_limit;

-- Example 3: Check if user can view N-year forecast
-- (This is what canViewForecastYears() does)
SELECT 
  30 AS requested_years,  -- Replace with requested years
  t.forecast_years_limit AS limit,
  (30 <= t.forecast_years_limit) AS can_view
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
LEFT JOIN subscription_tiers t ON us.tier_id = t.id
WHERE u.id = 1;  -- Replace with actual user ID

-- Example 4: Get all feature access for a user
-- (This is what getUserFeatureAccess() does)
SELECT 
  u.id AS user_id,
  u.role,
  t.tier_name,
  t.display_name,
  t.property_limit,
  COUNT(p.id) AS current_property_count,
  (COUNT(p.id) < t.property_limit) AS can_add_property,
  (t.property_limit - COUNT(p.id)) AS remaining_properties,
  t.forecast_years_limit,
  t.can_use_tax_calculator,
  t.can_use_investment_comparison,
  t.can_export_reports,
  t.can_use_advanced_analytics
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
LEFT JOIN subscription_tiers t ON us.tier_id = t.id
LEFT JOIN properties p ON u.id = p.user_id
WHERE u.id = 1  -- Replace with actual user ID
GROUP BY u.id, u.role, t.tier_name, t.display_name, t.property_limit, 
         t.forecast_years_limit, t.can_use_tax_calculator, 
         t.can_use_investment_comparison, t.can_export_reports, 
         t.can_use_advanced_analytics;

-- ============================================================================
-- ADMIN OPERATIONS
-- ============================================================================

-- Promote user to admin role
-- UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';

-- Change user's subscription tier
-- UPDATE user_subscriptions 
-- SET tier_id = (SELECT id FROM subscription_tiers WHERE tier_name = 'pro')
-- WHERE user_id = 1 AND status = 'active';

-- Cancel user's subscription (set end date to now)
-- UPDATE user_subscriptions 
-- SET status = 'cancelled', end_date = NOW()
-- WHERE user_id = 1 AND status = 'active';

-- Grant Pro subscription to user
-- INSERT INTO user_subscriptions (user_id, tier_id, status, start_date)
-- VALUES (
--   1,  -- user_id
--   (SELECT id FROM subscription_tiers WHERE tier_name = 'pro'),
--   'active',
--   NOW()
-- );

-- ============================================================================
-- MAINTENANCE QUERIES
-- ============================================================================

-- Find expired subscriptions that need status update
SELECT 
  us.id,
  u.email,
  t.tier_name,
  us.end_date
FROM user_subscriptions us
INNER JOIN users u ON us.user_id = u.id
INNER JOIN subscription_tiers t ON us.tier_id = t.id
WHERE us.status = 'active'
  AND us.end_date IS NOT NULL
  AND us.end_date < NOW();

-- Update expired subscriptions
-- UPDATE user_subscriptions
-- SET status = 'expired'
-- WHERE status = 'active'
--   AND end_date IS NOT NULL
--   AND end_date < NOW();

-- ============================================================================
-- ANALYTICS QUERIES
-- ============================================================================

-- Subscription tier distribution
SELECT 
  t.display_name AS tier,
  COUNT(us.id) AS active_subscriptions,
  ROUND(COUNT(us.id) * 100.0 / (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'active'), 2) AS percentage
FROM subscription_tiers t
LEFT JOIN user_subscriptions us ON t.id = us.tier_id AND us.status = 'active'
GROUP BY t.id, t.display_name
ORDER BY t.sort_order;

-- Users approaching property limit
SELECT 
  u.id,
  u.email,
  t.tier_name,
  COUNT(p.id) AS property_count,
  t.property_limit,
  (t.property_limit - COUNT(p.id)) AS remaining
FROM users u
INNER JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
INNER JOIN subscription_tiers t ON us.tier_id = t.id
LEFT JOIN properties p ON u.id = p.user_id
WHERE t.property_limit < 999  -- Exclude unlimited tiers
GROUP BY u.id, u.email, t.tier_name, t.property_limit
HAVING property_count >= (t.property_limit - 1)  -- 1 or 0 slots remaining
ORDER BY remaining ASC;

-- Feature usage by tier
SELECT 
  t.tier_name,
  COUNT(DISTINCT u.id) AS total_users,
  COUNT(DISTINCT p.id) AS total_properties,
  ROUND(COUNT(DISTINCT p.id) * 1.0 / NULLIF(COUNT(DISTINCT u.id), 0), 2) AS avg_properties_per_user
FROM subscription_tiers t
LEFT JOIN user_subscriptions us ON t.id = us.tier_id AND us.status = 'active'
LEFT JOIN users u ON us.user_id = u.id
LEFT JOIN properties p ON u.id = p.user_id
GROUP BY t.id, t.tier_name
ORDER BY t.sort_order;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- 1. Default Tier: All new users automatically get "basic" tier
-- 2. Admin Bypass: Users with role='admin' bypass all subscription limits
-- 3. Unlimited Values: 999 for properties, 50 for years treated as unlimited
-- 4. Status Management: Expired subscriptions should be updated via cron job
-- 5. Stripe Integration: stripe_subscription_id and stripe_customer_id fields ready
-- 6. Soft Limits: Feature gates check limits but don't delete data on downgrade
-- 7. Audit Trail: created_at and updated_at track all subscription changes
-- 
-- ============================================================================
