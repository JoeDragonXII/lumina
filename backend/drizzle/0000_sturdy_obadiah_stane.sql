CREATE TABLE `collection_photos` (
	`collection_id` text NOT NULL,
	`asset_id` text NOT NULL,
	`position` integer NOT NULL,
	`alt` text DEFAULT '' NOT NULL,
	PRIMARY KEY(`collection_id`, `asset_id`),
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`asset_id`) REFERENCES `photo_assets`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `collection_photos_position_index` ON `collection_photos` (`collection_id`,`position`);--> statement-breakpoint
CREATE TABLE `collection_tags` (
	`collection_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`collection_id`, `tag_id`),
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`story` text DEFAULT '' NOT NULL,
	`category` text DEFAULT '摄影作品' NOT NULL,
	`visibility` text DEFAULT 'draft' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`date_start` text,
	`date_end` text,
	`location_id` text,
	`cover_asset_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`cover_asset_id`) REFERENCES `photo_assets`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collections_slug_unique` ON `collections` (`slug`);--> statement-breakpoint
CREATE INDEX `collections_visibility_index` ON `collections` (`visibility`);--> statement-breakpoint
CREATE INDEX `collections_date_index` ON `collections` (`date_start`);--> statement-breakpoint
CREATE TABLE `locations` (
	`id` text PRIMARY KEY NOT NULL,
	`country_code` text NOT NULL,
	`country_name` text NOT NULL,
	`region_code` text,
	`region_name` text,
	`city` text,
	`display_name` text NOT NULL,
	`latitude` real,
	`longitude` real,
	`source` text DEFAULT 'manual' NOT NULL,
	`confirmed` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `photo_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`sha256` text NOT NULL,
	`original_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`extension` text NOT NULL,
	`original_path` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`taken_at` text,
	`camera_make` text,
	`camera_model` text,
	`lens` text,
	`focal_length` real,
	`aperture` real,
	`shutter_speed` text,
	`iso` integer,
	`latitude` real,
	`longitude` real,
	`status` text DEFAULT 'ready' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `photo_assets_sha256_unique` ON `photo_assets` (`sha256`);--> statement-breakpoint
CREATE TABLE `photo_variants` (
	`asset_id` text NOT NULL,
	`variant` text NOT NULL,
	`relative_path` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`mime_type` text DEFAULT 'image/webp' NOT NULL,
	`bytes` integer NOT NULL,
	PRIMARY KEY(`asset_id`, `variant`),
	FOREIGN KEY (`asset_id`) REFERENCES `photo_assets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);