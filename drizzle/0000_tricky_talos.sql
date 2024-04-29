CREATE TABLE `todos` (
	`id` text PRIMARY KEY NOT NULL,
	`description` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer NOT NULL,
	`username` text NOT NULL,
	`password_hash` text,
	`created_at` integer NOT NULL,
	`provider` text NOT NULL,
	`provider_id` text,
	`refresh_token` text,
	`profile_image` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);