"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getActiveUser } from "@/lib/session";
import { idSchema } from "@/lib/validation";
import { parsePagination } from "@/lib/listing-params";
import { queryWishlist } from "@/lib/wishlist";
import { fail } from "@/lib/action-result";
import type { FetchWishlistResult, ToggleWishlistResult } from "./types";

const WISHLIST_PATH = "/dashboard/wishlist";

/**
 * Adds the listing if it isn't saved, removes it if it is. Returns the new state so the heart icon
 * can be updated without refetching.
 *
 * Remove comes first and never looks at the listing, so a sold or withdrawn book can always be
 * un-saved. Only *adding* requires the listing to be ACTIVE or RESERVED.
 */
export async function toggleWishlistAction(listingId: unknown): Promise<ToggleWishlistResult> {
  const user = await getActiveUser();
  if (!user) return fail("UNAUTHENTICATED");
  const parsed = idSchema.safeParse(listingId);
  if (!parsed.success) return fail("VALIDATION");
  const id = parsed.data;

  try {
    const removed = await prisma.wishlistItem.deleteMany({ where: { userId: user.id, listingId: id } });
    if (removed.count > 0) {
      revalidatePath(WISHLIST_PATH);
      return { ok: true, wishlisted: false };
    }

    const listing = await prisma.listing.findFirst({
      where: { id, status: { in: ["ACTIVE", "RESERVED"] } },
      select: { id: true },
    });
    if (!listing) return fail("NOT_FOUND");

    try {
      await prisma.wishlistItem.create({ data: { userId: user.id, listingId: id } });
    } catch (e) {
      // A double-click raced us and inserted the same (userId, listingId) first: the item *is* saved, which is what we report.
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
    }
    revalidatePath(WISHLIST_PATH);
    return { ok: true, wishlisted: true };
  } catch (e) {
    console.error("[toggleWishlistAction]", e);
    return fail("GENERIC");
  }
}

/**
 * The current user's wishlist with each listing's card data, newest first, paginated
 * (`{ page, pageSize }`, both optional and clamped). A Server Component can also call
 * `queryWishlist(user.id, parsePagination(await searchParams))` directly.
 */
export async function fetchWishlistAction(raw?: unknown): Promise<FetchWishlistResult> {
  const user = await getActiveUser();
  if (!user) return fail("UNAUTHENTICATED");
  try {
    return { ok: true, ...(await queryWishlist(user.id, parsePagination(raw))) };
  } catch (e) {
    console.error("[fetchWishlistAction]", e);
    return fail("GENERIC");
  }
}
