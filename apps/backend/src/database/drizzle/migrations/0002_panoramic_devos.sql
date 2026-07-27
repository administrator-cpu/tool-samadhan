ALTER TABLE "password_reset_otps" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "password_reset_otps" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "password_reset_otps" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;