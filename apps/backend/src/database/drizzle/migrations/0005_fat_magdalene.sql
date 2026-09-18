ALTER TYPE "public"."user_role" ADD VALUE 'GUEST';--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "contact_phone" varchar(20);