CREATE TABLE `tutors` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`cohort` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tutors_cohort_name_idx` ON `tutors` (`cohort`,`name`);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`cohort` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `students_cohort_idx` ON `students` (`cohort`,`id`);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`tutor_id` text NOT NULL,
	`student_id` text NOT NULL,
	`start_at` integer NOT NULL,
	`end_at` integer NOT NULL,
	`first_session` integer DEFAULT false NOT NULL,
	`rating` integer,
	`rescheduled` integer DEFAULT false NOT NULL,
	`no_show` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`tutor_id`) REFERENCES `tutors`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tutor_daily_metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tutor_id` text NOT NULL,
	`date` text DEFAULT (date('now')) NOT NULL,
	`sessions_count` integer DEFAULT 0 NOT NULL,
	`first_sessions` integer DEFAULT 0 NOT NULL,
	`first_session_failures` integer DEFAULT 0 NOT NULL,
	`reschedules` integer DEFAULT 0 NOT NULL,
	`no_shows` integer DEFAULT 0 NOT NULL,
	`average_rating` real DEFAULT 0 NOT NULL,
	`rating_count` integer DEFAULT 0 NOT NULL,
	`rating_sum` real DEFAULT 0 NOT NULL,
	`trailing7_no_show_rate` real DEFAULT 0 NOT NULL,
	`trailing7_reschedule_rate` real DEFAULT 0 NOT NULL,
	`trailing7_first_session_fail_rate` real DEFAULT 0 NOT NULL,
	`trailing7_average_rating` real DEFAULT 0 NOT NULL,
	`trailing_no_show_rate` real DEFAULT 0 NOT NULL,
	`trailing_reschedule_rate` real DEFAULT 0 NOT NULL,
	`trailing_first_session_fail_rate` real DEFAULT 0 NOT NULL,
	`trailing_average_rating` real DEFAULT 0 NOT NULL,
	`score` real DEFAULT 0 NOT NULL,
	`drivers` text DEFAULT '[]' NOT NULL,
	FOREIGN KEY (`tutor_id`) REFERENCES `tutors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tutor_daily_metrics_tutor_date_idx` ON `tutor_daily_metrics` (`tutor_id`,`date`);
