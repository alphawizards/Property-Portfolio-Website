CREATE TABLE `scenarios` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `originalPortfolioId` int,
  `name` varchar(255) NOT NULL,
  `description` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `scenarios_id` PRIMARY KEY(`id`)
);
