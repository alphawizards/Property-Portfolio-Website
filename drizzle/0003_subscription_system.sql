-- Create subscription_tiers table
CREATE TABLE IF NOT EXISTS `subscription_tiers` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(50) NOT NULL UNIQUE,
  `displayName` varchar(100) NOT NULL,
  `description` text,
  `maxProperties` int NOT NULL DEFAULT 0,
  `maxForecastYears` int NOT NULL DEFAULT 10,
  `canUseAdvancedAnalytics` boolean NOT NULL DEFAULT false,
  `canUseScenarioComparison` boolean NOT NULL DEFAULT false,
  `canExportReports` boolean NOT NULL DEFAULT false,
  `canUseTaxCalculator` boolean NOT NULL DEFAULT false,
  `priceMonthly` decimal(10,2) NOT NULL DEFAULT 0,
  `priceYearly` decimal(10,2) NOT NULL DEFAULT 0,
  `stripePriceIdMonthly` varchar(255),
  `stripePriceIdYearly` varchar(255),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS `user_subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `tierId` int NOT NULL,
  `status` enum('active','suspended','expired','cancelled') NOT NULL DEFAULT 'active',
  `startDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `endDate` datetime,
  `stripeCustomerId` varchar(255),
  `stripeSubscriptionId` varchar(255),
  `currentPeriodStart` datetime,
  `currentPeriodEnd` datetime,
  `cancelledAt` datetime,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tierId`) REFERENCES `subscription_tiers`(`id`) ON DELETE RESTRICT,
  UNIQUE KEY `unique_user_subscription` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes
CREATE INDEX `idx_user_subscriptions_tier_id` ON `user_subscriptions`(`tierId`);
CREATE INDEX `idx_user_subscriptions_status` ON `user_subscriptions`(`status`);

-- Seed default subscription tiers
INSERT IGNORE INTO `subscription_tiers` (`name`,`displayName`,`description`,`maxProperties`,`maxForecastYears`,`canUseAdvancedAnalytics`,`canUseScenarioComparison`,`canExportReports`,`canUseTaxCalculator`,`priceMonthly`,`priceYearly`)
VALUES
('basic','Basic','Perfect for getting started with investment analysis',2,10,false,false,false,false,0.00,0.00),
('pro','Pro','Advanced features for serious investors',0,30,true,true,true,true,29.99,299.99),
('admin','Admin','Full access for administrators',0,50,true,true,true,true,0.00,0.00);
