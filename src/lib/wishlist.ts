import type { ListingStatus, Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { listingCardSelect, toListingCard, type ListingCard } from "./listings";

export type WishlistEntry = {
  addedAt: string;               // ISO
  status: ListingStatus;         // lets the UI grey out RESERVED / COMPLETED (sold) books
  listing: ListingCard;          // isWishlisted is always true here
};

export type WishlistPage = {
  items: WishlistEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/** The user's saved books, most recently saved first. Archived listings (withdrawn by the seller) are hidden. */
export async function queryWishlist(userId: string, { page, pageSize }: { page: number; pageSize: number }): Promise<WishlistPage> {
  const where: Prisma.WishlistItemWhereInput = { userId, listing: { status: { not: "ARCHIVED" } } };

  const [rows, total] = await prisma.$transaction([
    prisma.wishlistItem.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { listingId: "desc" }],   // listingId breaks ties so pages are stable
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { createdAt: true, listing: { select: { ...listingCardSelect, status: true } } },
    }),
    prisma.wishlistItem.count({ where }),
  ]);

  return {
    items: rows.map((r) => ({
      addedAt: r.createdAt.toISOString(),
      status: r.listing.status,
      listing: toListingCard(r.listing, true),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
