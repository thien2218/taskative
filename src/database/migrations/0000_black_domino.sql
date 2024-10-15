CREATE TABLE `boards` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	`name` text NOT NULL,
	`description` text,
	`pipeline` text DEFAULT '[{"name":"pending","rgb":[0,0,0]},{"name":"on-going","rgb":[0,0,0]},{"name":"hiatus","rgb":[0,0,0]}]' NOT NULL,
	`completed_status` text DEFAULT '{"name":"completed","rgb":[0,0,0]}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lists` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	`name` text NOT NULL,
	`board_id` text NOT NULL REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE cascade,
	`description` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	`content` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`profile_image` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	`board_id` text NOT NULL REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE cascade,
	`list_id` text REFERENCES `lists`(`id`) ON UPDATE no action ON DELETE set null,
	`description` text NOT NULL,
	`status` text NOT NULL,
	`priority` text NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`encoded_password` text,
	`providers` text DEFAULT '["email"]' NOT NULL,
	`encoded_refresh_token` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `board_name_unique` ON `boards` (`user_id`,`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `list_name_unique` ON `lists` (`user_id`,`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);