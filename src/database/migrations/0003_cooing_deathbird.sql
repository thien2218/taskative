ALTER TABLE `users` RENAME COLUMN `profile_picture` TO `profile_image`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `created_at`;--> statement-breakpoint
ALTER TABLE `users` ADD `created_at` integer DEFAULT (unixepoch()) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `email_verified` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `provider` text DEFAULT 'email' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `refresh_token` text;