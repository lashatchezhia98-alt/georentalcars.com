-- Safe additive migration: keeps every existing booking and backfills a public code.
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'CANCELLED_BY_CUSTOMER';

DO $$ BEGIN
  CREATE TYPE "CancellationSource" AS ENUM ('CUSTOMER_SELF_SERVICE', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "bookingCode" TEXT,
  ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancellationSource" "CancellationSource";

UPDATE "Booking"
SET "bookingCode" = 'GRC-' || UPPER(SUBSTRING(MD5("id") FROM 1 FOR 8))
WHERE "bookingCode" IS NULL;

ALTER TABLE "Booking"
  ALTER COLUMN "bookingCode" SET DEFAULT ('GRC-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8))),
  ALTER COLUMN "bookingCode" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Booking_bookingCode_key" ON "Booking"("bookingCode");

CREATE TABLE IF NOT EXISTS "BookingCancellationToken" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BookingCancellationToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BookingCancellationToken_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "BookingCancellationToken_tokenHash_key" ON "BookingCancellationToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "BookingCancellationToken_bookingId_expiresAt_idx" ON "BookingCancellationToken"("bookingId", "expiresAt");

CREATE TABLE IF NOT EXISTS "CancellationRequestAttempt" (
  "id" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CancellationRequestAttempt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CancellationRequestAttempt_keyHash_createdAt_idx" ON "CancellationRequestAttempt"("keyHash", "createdAt");
