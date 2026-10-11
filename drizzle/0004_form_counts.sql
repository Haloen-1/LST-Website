CREATE TABLE `form_counts` (
	`id` text PRIMARY KEY NOT NULL,
	`form_url` text NOT NULL,
	`response_count` integer NOT NULL,
	`accepting` integer NOT NULL,
	`observed_at` integer NOT NULL
);
