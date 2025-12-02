CREATE TABLE `capital_expenditure` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`amount` int NOT NULL,
	`date` datetime NOT NULL,
	CONSTRAINT `capital_expenditure_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `depreciation_schedule` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`asAtDate` datetime NOT NULL,
	`annualAmount` int NOT NULL,
	CONSTRAINT `depreciation_schedule_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expense_breakdown` (
	`id` int AUTO_INCREMENT NOT NULL,
	`expenseLogId` int NOT NULL,
	`category` varchar(255) NOT NULL,
	`amount` int NOT NULL,
	CONSTRAINT `expense_breakdown_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expense_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`date` datetime NOT NULL,
	`totalAmount` int NOT NULL,
	`frequency` enum('Monthly','Annual','OneTime') NOT NULL,
	`growthRate` int NOT NULL DEFAULT 0,
	CONSTRAINT `expense_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `growth_rate_periods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`startYear` int NOT NULL,
	`endYear` int,
	`growthRate` int NOT NULL,
	CONSTRAINT `growth_rate_periods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`securityPropertyId` int,
	`loanType` enum('EquityLoan','PrincipalLoan') NOT NULL,
	`lenderName` varchar(255) NOT NULL,
	`loanPurpose` enum('PropertyPurchase','Renovation','Investment','Other') NOT NULL,
	`loanStructure` enum('InterestOnly','PrincipalAndInterest') NOT NULL,
	`startDate` datetime NOT NULL,
	`originalAmount` int NOT NULL,
	`currentAmount` int NOT NULL,
	`interestRate` int NOT NULL,
	`remainingTermYears` int NOT NULL,
	`remainingIOPeriodYears` int NOT NULL DEFAULT 0,
	`repaymentFrequency` enum('Monthly','Fortnightly','Weekly') NOT NULL DEFAULT 'Monthly',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolio_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`goalYear` int NOT NULL,
	`targetEquity` int NOT NULL,
	`targetValue` int NOT NULL,
	CONSTRAINT `portfolio_goals_id` PRIMARY KEY(`id`),
	CONSTRAINT `portfolio_goals_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nickname` varchar(255) NOT NULL,
	`address` text NOT NULL,
	`state` varchar(100) NOT NULL,
	`suburb` varchar(255) NOT NULL,
	`propertyType` enum('Residential','Commercial','Industrial','Land') NOT NULL DEFAULT 'Residential',
	`ownershipStructure` enum('Trust','Individual','Company','Partnership') NOT NULL,
	`linkedEntity` varchar(255),
	`purchaseDate` datetime NOT NULL,
	`purchasePrice` int NOT NULL,
	`saleDate` datetime,
	`salePrice` int,
	`status` enum('Actual','Projected') NOT NULL DEFAULT 'Actual',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `properties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `property_ownership` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`ownerName` varchar(255) NOT NULL,
	`percentage` int NOT NULL,
	CONSTRAINT `property_ownership_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `property_usage_periods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`startDate` datetime NOT NULL,
	`endDate` datetime,
	`usageType` enum('Investment','PPOR') NOT NULL,
	CONSTRAINT `property_usage_periods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `property_valuations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`valuationDate` datetime NOT NULL,
	`value` int NOT NULL,
	CONSTRAINT `property_valuations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchase_costs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`agentFee` int NOT NULL DEFAULT 0,
	`stampDuty` int NOT NULL DEFAULT 0,
	`legalFee` int NOT NULL DEFAULT 0,
	`inspectionFee` int NOT NULL DEFAULT 0,
	`otherCosts` int NOT NULL DEFAULT 0,
	CONSTRAINT `purchase_costs_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchase_costs_propertyId_unique` UNIQUE(`propertyId`)
);
--> statement-breakpoint
CREATE TABLE `rental_income` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`startDate` datetime NOT NULL,
	`endDate` datetime,
	`amount` int NOT NULL,
	`frequency` enum('Monthly','Weekly','Fortnightly') NOT NULL DEFAULT 'Monthly',
	`growthRate` int NOT NULL DEFAULT 0,
	CONSTRAINT `rental_income_id` PRIMARY KEY(`id`)
);
