CREATE TABLE `lists` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`profile_image` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `profiles` SELECT `id`, `first_name`, `last_name`, `profile_image`, `created_at`, (unixepoch()) FROM `users`;--> statement-breakpoint
ALTER TABLE `tasks` RENAME TO `dropped_tasks`;--> statement-breakpoint
CREATE TABLE `tasks` (
   `id` text PRIMARY KEY NOT NULL,
   `user_id` text NOT NULL,
   `list_id` text,
	`description` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
   `priority` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
   `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
   FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
   FOREIGN KEY (`list_id`) REFERENCES `lists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `tasks` SELECT `id`, `user_id`, NULL, `description`, `status`, `priority`, `created_at`, `updated_at` FROM `dropped_tasks`;--> statement-breakpoint
DROP TABLE IF EXISTS `dropped_tasks`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `first_name`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `last_name`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `profile_image`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `created_at`;