CREATE TABLE `site_content` (
	`id` text PRIMARY KEY NOT NULL,
	`draft_content` text NOT NULL,
	`published_content` text,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL,
	`published_at` text
);
