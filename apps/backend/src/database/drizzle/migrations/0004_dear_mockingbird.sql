ALTER TABLE "ticket_events" ADD COLUMN "translations" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "translated_names" jsonb DEFAULT '{}'::jsonb NOT NULL;