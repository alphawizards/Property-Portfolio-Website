CREATE TABLE `extra_repayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`loanId` int NOT NULL,
	`amount` int NOT NULL,
	`frequency` enum('Monthly','Fortnightly','Weekly','Annually') NOT NULL,
	`startDate` datetime NOT NULL,
	`endDate` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `extra_repayments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interest_rate_forecasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`loanId` int NOT NULL,
	`startYear` int NOT NULL,
	`endYear` int,
	`forecastRate` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interest_rate_forecasts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lump_sum_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`loanId` int NOT NULL,
	`amount` int NOT NULL,
	`paymentDate` datetime NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lump_sum_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `loans` ADD `offsetBalance` int DEFAULT 0 NOT NULL;