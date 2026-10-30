// Pure parsing/normalisation for listing input. No runtime imports on purpose (enum imports are
// type-only), so it is trivially unit-testable and safe to import from client components.
import type { BookCondition, BookLanguage, ListingType } from "@prisma/client";

export const PAGE_SIZE_DEFAULT = 24;
export const PAGE_SIZE_MAX = 48;
const PAGE_MAX = 1000;
const MAX_VALUES_PER_FILTER = 10;
const SLUG_RE = /^[a-z0-9_-]{1,40}$/;

/** Subjects only apply to this genre (see the comment on Listing.subjectId). Must match prisma/seed.ts. */
export const TEXTBOOK_GENRE_SLUG = "textbook";

// `satisfies Record<Enum, 1>` stops compiling if the schema adds or removes an enum value,
// so these tables can never silently drift from schema.prisma.
const LANGUAGES = { AZ: 1, EN: 1, RU: 1, TR: 1, OTHER: 1 } satisfies Record<BookLanguage, 1>;
const CONDITIONS = { NEW: 1, USED: 1, HIGHLIGHTED: 1 } satisfies Record<BookCondition, 1>;
const TYPES = { SALE: 1, EXCHANGE: 1 } satisfies Record<ListingType, 1>;

export type ListingFilters = {
  language: BookLanguage[];
  condition: BookCondition[];
  type: ListingType[];
  /** Genre / subject *slugs* (what the URL carries), not ids. */
  genre: string[];
  subject: string[];
  /** Free-text search over title + author; null when absent or shorter than 2 characters. */
  q: string | null;
  page: number;
  pageSize: number;
};

/** "az,en" and ["az","en"] and ["az,en","ru"] all mean the same thing; non-strings are dropped. */
function values(v: unknown): string[] {
  return (Array.isArray(v) ? v : [v])
    .filter((x): x is string => typeof x === "string")
    .flatMap((s) => s.split(","))
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_VALUES_PER_FILTER);
}

const uniq = <T>(a: T[]): T[] => [...new Set(a)];

/** Case-insensitive (`?language=az`); unknown values are ignored rather than failing the page. */
function enumList<T extends string>(v: unknown, table: Record<T, unknown>): T[] {
  return uniq(
    values(v)
      .map((s) => s.toUpperCase())
      .filter((s): s is T => Object.hasOwn(table, s)),
  );
}

const slugList = (v: unknown) => uniq(values(v).map((s) => s.toLowerCase()).filter((s) => SLUG_RE.test(s)));

function int(v: unknown, fallback: number, min: number, max: number): number {
  const x = Array.isArray(v) ? v[0] : v;
  const n = typeof x === "string" ? Number.parseInt(x, 10) : typeof x === "number" ? Math.trunc(x) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/** `page` / `pageSize` from untrusted input, clamped. Shared by the catalog and the wishlist. */
export function parsePagination(raw: unknown): { page: number; pageSize: number } {
  const p = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  return { page: int(p.page, 1, 1, PAGE_MAX), pageSize: int(p.pageSize, PAGE_SIZE_DEFAULT, 1, PAGE_SIZE_MAX) };
}

/**
 * Turns *untrusted* input (URL searchParams, or the argument of a Server Action, which is a public
 * POST endpoint) into a safe filter object. Never throws; anything invalid is dropped.
 */
export function parseListingFilters(raw: unknown): ListingFilters {
  const p = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const rawQ = Array.isArray(p.q) ? p.q[0] : p.q;
  const q = typeof rawQ === "string" ? rawQ.replace(/\s+/g, " ").trim().slice(0, 100) : "";

  return {
    language: enumList(p.language, LANGUAGES),
    condition: enumList(p.condition, CONDITIONS),
    type: enumList(p.type, TYPES),
    genre: slugList(p.genre),
    subject: slugList(p.subject),
    q: q.length >= 2 ? q : null,
    ...parsePagination(p),
  };
}

// ───────────── price ─────────────
/** Max 4 integer digits + 2 decimals => fits Decimal(10,2) with room to spare. */
export const PRICE_RE = /^\d{1,4}(\.\d{1,2})?$/;

/** Accepts the Azerbaijani decimal comma ("12,50"); blank means "not provided". */
export function normalizePriceInput(v: unknown): unknown {
  if (typeof v !== "string") return v;
  const s = v.trim().replace(",", ".");
  return s === "" ? undefined : s;
}
