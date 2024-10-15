ALTER TABLE `boards` RENAME TO `old_boards`;--> statement-breakpoint
CREATE TABLE `boards` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`pipeline` text DEFAULT '[{"name":"hiatus","rgb":[0,0,0]},{"name":"pending","rgb":[0,0,0]},{"name":"on-going","rgb":[0,0,0]}]' NOT NULL,
   `completed_status` text DEFAULT '{"name":"completed","rgb":[0, 0, 0]}',
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `boards` (
   `id`,
   `user_id`,
   `name`,
   `description`,
   `pipeline`,
   `created_at`,
   `updated_at`
) SELECT * FROM `old_boards`;--> statement-breakpoint
DROP TABLE `old_boards`;--> statement-breakpoint
CREATE UNIQUE INDEX `board_name_unique` ON `boards` (`user_id`,`name`);