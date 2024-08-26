ALTER TABLE `users` RENAME COLUMN `encrypted_password` TO `encoded_password`;--> statement-breakpoint
ALTER TABLE `users` RENAME COLUMN `refresh_token` TO `encoded_refresh_token`;