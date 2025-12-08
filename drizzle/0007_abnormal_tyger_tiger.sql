CREATE TABLE `subscription_tiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`displayName` varchar(100) NOT NULL,
	`description` text,
	`maxProperties` int NOT NULL DEFAULT 0,
	`maxForecastYears` int NOT NULL DEFAULT 10,
	`canUseAdvancedAnalytics` boolean NOT NULL DEFAULT false,
	`canUseScenarioComparison` boolean NOT NULL DEFAULT false,
	`canExportReports` boolean NOT NULL DEFAULT false,
	`canUseTaxCalculator` boolean NOT NULL DEFAULT false,
	`priceMonthly` decimal(10,2) NOT NULL DEFAULT '0',
	`priceYearly` decimal(10,2) NOT NULL DEFAULT '0',
	`stripePriceIdMonthly` varchar(255),
	`stripePriceIdYearly` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `subscription_tiers_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_subscription_tiers_name` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `user_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
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
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `user_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_user_subscriptions_user_id` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `extra_repayments` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `loan_scenarios` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `loan_scenarios` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `loans` MODIFY COLUMN `createdAt` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `loans` MODIFY COLUMN `updatedAt` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `loans` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT () => import_drizzle_orm.sql`CURRENT_TIMESTAMP`;--> statement-breakpoint
ALTER TABLE `portfolios` MODIFY COLUMN `createdAt` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `portfolios` MODIFY COLUMN `updatedAt` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `portfolios` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT () => import_drizzle_orm.sql`CURRENT_TIMESTAMP`;--> statement-breakpoint
ALTER TABLE `properties` MODIFY COLUMN `createdAt` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `properties` MODIFY COLUMN `updatedAt` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `properties` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT () => import_drizzle_orm.sql`CURRENT_TIMESTAMP`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `updatedAt` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT () => import_drizzle_orm.sql`CURRENT_TIMESTAMP`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `is_active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_user_subscriptions_tier_id` ON `user_subscriptions` (`tierId`);--> statement-breakpoint
CREATE INDEX `idx_user_subscriptions_status` ON `user_subscriptions` (`status`);