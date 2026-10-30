"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getActiveUser } from "@/lib/session";
import { createListingSchema } from "@/lib/validation";
import { parseListingFilters, TEXTBOOK_GENRE_SLUG } from "@/lib/listing-params";
import { queryListings, type ListingPage } from "@/lib/listings";
import type { CreateListingState } from "./types";

// Form inputs echoed back on failure (React 19 resets the form after an action).
const ECHO = ["title", "author", "description", "language", "condition", "type", "genreId", "subjectId", "price", "coverUrl"] as const;

// ───────────── create ─────────────
export async function createListingAction(_prev: CreateListingState, fd: FormData): Promise<CreateListingState> {
  // The seller always comes from the session, never from the form, so nobody can post as someone else.
  const user = await getActiveUser();
  if (!user) return { ok: false, code: "UNAUTHENTICATED" };

  const input = Object.fromEntries(fd) as Record<string, unknown>;
  const values = Object.fromEntries(ECHO.map((k) => [k, typeof input[k] === "string" ? (input[k] as string) : ""]));
  const invalid = (fields: string[]): CreateListingState => ({ ok: false, code: "VALIDATION", fields, values });

  const parsed = createListingSchema.safeParse(input);
  if (!parsed.success) return invalid(Object.keys(parsed.error.flatten().fieldErrors));
  const { title, author, description, language, condition, type, genreId, subjectId, coverUrl } = parsed.data;

  // SALE needs an explicit price (0 = free). EXCHANGE has no price, so whatever was sent is discarded.
  const price = type === "EXCHANGE" ? "0" : parsed.data.price;
  if (price === undefined) return invalid(["price"]);

  // Check the lookup ids up front so a stale/forged id is a field error, not a foreign-key crash.
  const [genre, subject] = await Promise.all([
    prisma.genre.findUnique({ where: { id: genreId }, select: { slug: true } }),
    subjectId ? prisma.subject.findUnique({ where: { id: subjectId }, select: { id: true } }) : null,
  ]);
  if (!genre) return invalid(["genreId"]);
  if (subjectId && !subject) return invalid(["subjectId"]);

  try {
    const listing = await prisma.listing.create({
      data: {
        sellerId: user.id,
        title, author, language, condition, type, price, genreId,
        description: description ?? null,
        // A subject is only meaningful for textbooks; drop it for other genres instead of storing noise.
        subjectId: genre.slug === TEXTBOOK_GENRE_SLUG ? (subjectId ?? null) : null,
        coverUrl: coverUrl ?? null,
        // status defaults to ACTIVE
      },
      select: { id: true },
    });
    revalidatePath("/");                      // the catalog (home page from step 2 on)
    return { ok: true, id: listing.id };
  } catch (e) {
    console.error("[createListingAction]", e);
    return { ok: false, code: "GENERIC", values };
  }
}

// ───────────── list + filter + paginate ─────────────
/**
 * For client-side "load more" / filter changes. Server Components can skip the action and call
 * `queryListings(parseListingFilters(await searchParams), userId)` directly.
 *
 * Server Actions are public POST endpoints, so `raw` is untrusted: `parseListingFilters` validates
 * it, drops what it doesn't understand, and clamps page / pageSize.
 */
export async function fetchListingsAction(raw: unknown): Promise<ListingPage> {
  const viewerId = (await auth())?.user?.id ?? null;
  return queryListings(parseListingFilters(raw), viewerId);
}
