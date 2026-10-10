CREATE TABLE `gallery_likes` (
	`photo_id` text NOT NULL,
	`visitor_id` text NOT NULL,
	PRIMARY KEY(`photo_id`, `visitor_id`)
);
