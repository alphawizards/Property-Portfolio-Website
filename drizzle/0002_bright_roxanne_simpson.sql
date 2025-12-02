ALTER TABLE `users` ADD `subscriptionTier` enum('FREE','PREMIUM_MONTHLY','PREMIUM_ANNUAL') DEFAULT 'FREE' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` enum('active','canceled','past_due','trialing','incomplete');--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionEndDate` timestamp;