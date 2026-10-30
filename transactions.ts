"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getActiveUser } from "@/lib/session";
import { idSchema, reviewSchema } from "@/lib/validation";
import { Fail, fail, guarded } from "@/lib/action-result";
import type { CompleteTransactionResult, CreateTransactionResult, LeaveReviewResult } from "./types";

// Concurrency notes (Postgres, default READ COMMITTED):
//  * Every write that changes a listing's fate takes the LISTING row lock *first* (an `updateMany`
//    guarded by status), then touches transactions. One lock order everywhere => no deadlocks, and
//    two requests for the same listing are serialised instead of racing.
//  * Rolling back = throwing `Fail` inside the callback; `guarded` turns it into a typed result.

// ───────────── buyer requests a book ─────────────
/**
 * Creates a PENDING transaction for an ACTIVE listing. Several buyers may have a PENDING request on
 * the same listing; the listing only leaves the catalog when the seller completes one of them.
 * `type` and `price` are copied from the listing at this moment (the "price at the time of the deal").
 */
export async function createTransactionAction(listingId: unknown): Promise<CreateTransactionResult> {
  const user = await getActiveUser();
  if (!user) return fail("UNAUTHENTICATED");
  const parsed = idSchema.safeParse(listingId);
  if (!parsed.success) return fail("VALIDATION");
  const id = parsed.data;

  const res = await guarded("createTransactionAction", () =>
    prisma.$transaction(async (db) => {
      const listing = await db.listing.findUnique({ where: { id }, select: { sellerId: true, type: true, price: true } });
      if (!listing) throw new Fail("NOT_FOUND");
      if (listing.sellerId === user.id) throw new Fail("OWN_LISTING");   // the DB CHECK would also stop it; this gives a clean error

      // Lock the listing row and prove it is still ACTIVE in one statement.
      const locked = await db.listing.updateMany({ where: { id, status: "ACTIVE" }, data: { updatedAt: new Date() } });
      if (locked.count === 0) throw new Fail("LISTING_UNAVAILABLE");

      // Safe from double-clicks: concurrent requests for this listing queue on the lock above.
      const dup = await db.transaction.findFirst({
        where: { listingId: id, buyerId: user.id, status: "PENDING" },
        select: { id: true },
      });
      if (dup) throw new Fail("ALREADY_REQUESTED");

      const deal = await db.transaction.create({
        data: { listingId: id, sellerId: listing.sellerId, buyerId: user.id, type: listing.type, price: listing.price },
        select: { id: true },
      });
      return { ok: true as const, transactionId: deal.id };
    }),
  );
  if (res.ok) revalidatePath("/dashboard");
  return res;
}

// ───────────── seller confirms the hand-over ─────────────
/**
 * PENDING -> COMPLETED. Only the SELLER can do it: they are the one who knows the book changed
 * hands, and a buyer-side button would let anyone "complete" a deal that never happened.
 * In the same DB transaction the listing becomes COMPLETED and every other PENDING request on it is CANCELLED.
 */
export async function completeTransactionAction(transactionId: unknown): Promise<CompleteTransactionResult> {
  const user = await getActiveUser();
  if (!user) return fail("UNAUTHENTICATED");
  const parsed = idSchema.safeParse(transactionId);
  if (!parsed.success) return fail("VALIDATION");
  const id = parsed.data;

  const res = await guarded("completeTransactionAction", () =>
    prisma.$transaction(async (db) => {
      const deal = await db.transaction.findUnique({
        where: { id },
        select: { sellerId: true, buyerId: true, listingId: true, status: true },
      });
      // Strangers get NOT_FOUND, not FORBIDDEN, so deal ids can't be probed.
      if (!deal || (deal.sellerId !== user.id && deal.buyerId !== user.id)) throw new Fail("NOT_FOUND");
      if (deal.sellerId !== user.id) throw new Fail("FORBIDDEN");        // the buyer can see it but not complete it
      if (deal.status !== "PENDING") throw new Fail("NOT_PENDING");

      // 1) listing lock first (see the lock-order note at the top). Two sellers' requests for one listing: the loser fails here.
      const listing = await db.listing.updateMany({
        where: { id: deal.listingId, status: { in: ["ACTIVE", "RESERVED"] } },
        data: { status: "COMPLETED" },
      });
      if (listing.count === 0) throw new Fail("LISTING_UNAVAILABLE");

      // 2) the guarded update makes "already completed / cancelled" impossible to overwrite
      const done = await db.transaction.updateMany({
        where: { id, sellerId: user.id, status: "PENDING" },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      if (done.count === 0) throw new Fail("NOT_PENDING");

      // 3) nobody else can get this copy any more
      await db.transaction.updateMany({
        where: { listingId: deal.listingId, id: { not: id }, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
      return { ok: true as const };
    }),
  );
  if (res.ok) {
    revalidatePath("/");
    revalidatePath("/dashboard");
  }
  return res;
}

// ───────────── review the other party ─────────────
/**
 * `input` is `{ transactionId, rating (1-5), comment? }` or the equivalent FormData.
 * Allowed only when the transaction is COMPLETED and the caller is its buyer or seller; the
 * reviewed user is always "the other side", never taken from the client. One review per party per
 * deal (DB unique on transactionId + authorId). The reviewed user's ratingAvg / ratingCount are
 * updated in the same DB transaction.
 */
export async function leaveReviewAction(input: unknown): Promise<LeaveReviewResult> {
  const user = await getActiveUser();
  if (!user) return fail("UNAUTHENTICATED");

  const raw = input instanceof FormData ? Object.fromEntries(input) : input;
  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) return fail("VALIDATION", Object.keys(parsed.error.flatten().fieldErrors));
  const { transactionId, rating, comment } = parsed.data;

  const deal = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: { status: true, sellerId: true, buyerId: true },
  });
  const targetId = !deal ? null : deal.sellerId === user.id ? deal.buyerId : deal.buyerId === user.id ? deal.sellerId : null;
  if (!deal || targetId === null) return fail("NOT_FOUND");               // missing or not a participant: indistinguishable on purpose
  if (deal.status !== "COMPLETED") return fail("NOT_COMPLETED");          // a COMPLETED deal never reverts, so checking outside the DB transaction is safe

  const res = await guarded("leaveReviewAction", () =>
    prisma.$transaction(async (db) => {
      const review = await db.review
        .create({ data: { transactionId, authorId: user.id, targetId, rating, comment: comment ?? null }, select: { id: true } })
        .catch((e: unknown) => {
          // @@unique([transactionId, authorId]) is the real duplicate guard; it also holds under double-submits.
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new Fail("ALREADY_REVIEWED");
          throw e;
        });

      // Take the reviewed user's row lock BEFORE aggregating. Two simultaneous reviews of the same
      // person then run one after the other, and the second aggregate sees the first review.
      await db.user.update({ where: { id: targetId }, data: { ratingCount: { increment: 1 } }, select: { id: true } });
      const agg = await db.review.aggregate({ where: { targetId }, _avg: { rating: true }, _count: { _all: true } });
      const target = await db.user.update({
        where: { id: targetId },
        data: { ratingAvg: Math.round((agg._avg.rating ?? 0) * 100) / 100, ratingCount: agg._count._all },
        select: { username: true },
      });
      return { ok: true as const, reviewId: review.id, username: target.username };
    }),
  );
  if (!res.ok) return res;

  revalidatePath(`/u/${res.username}`);                                   // public profile shows the rating
  return { ok: true, reviewId: res.reviewId };
}
