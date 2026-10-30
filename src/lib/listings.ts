import type { BookCondition, BookLanguage, ListingType, Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { ListingFilters } from "./listing-params";

/** What a catalog card needs, and nothing more. Plain JSON: Decimal/Date are converted so it can cross the Server Action boundary. */
export type ListingCard = {
  id: string;
  title: string;
  author: string;
  language: BookLanguage;
  condition: BookCondition;
  type: ListingType;
  price: number;                 // 0 on a SALE = free
  coverUrl: string | null;
  hasPdf: boolean;               // the URL itself is never exposed in lists (VIP feature)
  genre: string;                 // slug; display names come from the i18n dictionaries
  subject: string | null;
  createdAt: string;             // ISO
  isWishlisted: boolean;         // always false for guests
  seller: {
    username: string;
    name: string;
    university: string | null;
    avatarUrl: string | null;
    isVip: boolean;
    ratingAvg: number;
    ratingCount: number;
  };
};

export type ListingPage = {
  items: ListingCard[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/** Single source of truth for what a card may expose. Explicit `select`: seller email / phone / passwordHash can't leak by accident. */
export const listingCardSelect = {
  id: true, title: true, author: true, language: true, condition: true, type: true,
  price: true, coverUrl: true, pdfUrl: true, createdAt: true,
  genre: { select: { slug: true } },
  subject: { select: { slug: true } },
  seller: {
    select: { username: true, name: true, university: true, avatarUrl: true, isVip: true, ratingAvg: true, ratingCount: true },
  },
} satisfies Prisma.ListingSelect;

export function toListingCard(r: Prisma.ListingGetPayload<{ select: typeof listingCardSelect }>, isWishlisted: boolean): ListingCard {
  return {
    id: r.id,
    title: r.title,
    author: r.author,
    language: r.language,
    condition: r.condition,
    type: r.type,
    price: r.price.toNumber(),
    coverUrl: r.coverUrl,
    hasPdf: r.pdfUrl !== null,
    genre: r.genre.slug,
    subject: r.subject?.slug ?? null,
    createdAt: r.createdAt.toISOString(),
    isWishlisted,
    seller: { ...r.seller, ratingAvg: r.seller.ratingAvg.toNumber() },
  };
}

/**
 * Catalog query. Callable straight from a Server Component
 * (`queryListings(parseListingFilters(await searchParams), session?.user?.id)`) and wrapped by
 * `fetchListingsAction` for client-side "load more". `filters` must come from `parseListingFilters`.
 */
export async function queryListings(filters: ListingFilters, viewerId: string | null = null): Promise<ListingPage> {
  const { language, condition, type, genre, subject, q, page, pageSize } = filters;

  const where: Prisma.ListingWhereInput = {
    status: "ACTIVE",
    ...(language.length > 0 && { language: { in: language } }),
    ...(condition.length > 0 && { condition: { in: condition } }),
    ...(type.length > 0 && { type: { in: type } }),
    ...(genre.length > 0 && { genre: { slug: { in: genre } } }),
    ...(subject.length > 0 && { subject: { slug: { in: subject } } }),
    ...(q !== null
      ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { author: { contains: q, mode: "insensitive" } }] }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.listing.findMany({
      where,
      // `id` breaks ties between listings created in the same instant, so pages never overlap or skip rows.
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: listingCardSelect,
    }),
    prisma.listing.count({ where }),
  ]);

  // One indexed lookup (PK = userId + listingId) instead of a join per row.
  const wished = new Set<string>();
  if (viewerId && rows.length > 0) {
    const hits = await prisma.wishlistItem.findMany({
      where: { userId: viewerId, listingId: { in: rows.map((r) => r.id) } },
      select: { listingId: true },
    });
    for (const h of hits) wished.add(h.listingId);
  }

  return {
    items: rows.map((r) => toListingCard(r, wished.has(r.id))),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
