CREATE TABLE `uploaded_photos` (
	`key` text PRIMARY KEY NOT NULL,
	`bytes` integer NOT NULL,
	`etag` text NOT NULL,
	`created_at` text NOT NULL
);
