ALTER TABLE `users` ADD `providers` text DEFAULT '["email"]' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `provider`;