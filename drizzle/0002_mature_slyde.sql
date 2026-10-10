CREATE TABLE `signup_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`attempts` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `signups` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`event_title` text NOT NULL,
	`participant_name` text NOT NULL,
	`email` text NOT NULL,
	`email_opt_in` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`privacy_version` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `signups_event_email_name` ON `signups` (`event_id`,`email`,`participant_name`);--> statement-breakpoint
CREATE TABLE `timeline_reactions` (
	`item_id` text NOT NULL,
	`visitor_id` text NOT NULL,
	PRIMARY KEY(`item_id`, `visitor_id`)
);
