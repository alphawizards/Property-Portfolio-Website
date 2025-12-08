CREATE TABLE `documents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `property_id` int NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_url` varchar(512) NOT NULL,
  `category` varchar(50) NOT NULL,
  `mime_type` varchar(100),
  `uploaded_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
