ALTER TABLE `boards` RENAME TO `old_boards`;--> statement-breakpoint
CREATE TABLE `boards` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	`name` text NOT NULL,
	`description` text,
	`pipeline` text DEFAULT '[{"name":"pending","rgb":[0,0,0]},{"name":"on-going","rgb":[0,0,0]},{"name":"completed","rgb":[0,0,0]},{"name":"hiatus","rgb":[0,0,0]}]' NOT NULL,
	`completed_index` integer DEFAULT 2 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);--> statement-breakpoint
INSERT INTO `boards`  SELECT * FROM `old_boards`;--> statement-breakpoint
ALTER TABLE `tasks` ALTER COLUMN `board_id` TO `board_id` text NOT NULL REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE cascade;--> statement-breakpoint
ALTER TABLE `lists` ALTER COLUMN `board_id` TO `board_id` text NOT NULL REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE cascade;--> statement-breakpoint
DROP TABLE `old_boards`;--> statement-breakpoint
CREATE UNIQUE INDEX `board_name_unique` ON `boards` (`user_id`,`name`);--> statement-breakpoint