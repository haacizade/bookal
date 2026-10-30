-- Run once after the first `prisma migrate dev` (or paste into a custom migration:
-- `prisma migrate dev --create-only`, edit migration.sql, then apply).
-- Prisma can't express CHECK constraints, and these rules must hold even if app code has a bug.
ALTER TABLE "Review"
  ADD CONSTRAINT review_rating_range CHECK (rating BETWEEN 1 AND 5),
  ADD CONSTRAINT review_no_self_review CHECK ("authorId" <> "targetId");

ALTER TABLE "Transaction"
  ADD CONSTRAINT tx_buyer_not_seller CHECK ("buyerId" <> "sellerId");

ALTER TABLE "Listing"
  ADD CONSTRAINT listing_price_nonneg CHECK (price >= 0);
