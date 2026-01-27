ALTER TABLE `snippets` ADD `is_pinned` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `snippets` ADD `gist_id` text;--> statement-breakpoint
ALTER TABLE `snippets` ADD `gist_url` text;--> statement-breakpoint
ALTER TABLE `users` ADD `github_token` text;