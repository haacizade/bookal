import { z } from "zod";
import { BookCondition, BookLanguage, ListingType } from "@prisma/client";
import { PRICE_RE, normalizePriceInput } from "./listing-params";

const email = z.string().trim().toLowerCase().email().max(254);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email,
  // bcrypt only uses the first 72 bytes, so cap there instead of silently truncating
  password: z.string().min(8).max(72).regex(/[A-Za-z]/).regex(/\d/),
  university: z.string().trim().max(120).optional(),
  phone: z.string().trim().regex(/^\+?[\d\s-]{7,18}$/).optional().or(z.literal("")),
});

// ───────────── profile ─────────────
const phone = z.string().trim().regex(/^\+?[\d\s-]{7,18}$/).optional().or(z.literal(""));

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  university: z.string().trim().max(120).optional(),
  phone,
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(72),
  password: z.string().min(8).max(72).regex(/[A-Za-z]/).regex(/\d/),
});

/** The avatar is a small (<= 256px) image the browser resized itself and sent as a data URL. */
export const AVATAR_MAX_CHARS = 120_000;
export const AVATAR_RE = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

export const loginSchema = z.object({ email, password: z.string().min(1).max(72) });

// ───────────── listings ─────────────
// Empty form inputs arrive as "", which should mean "not provided" for optional fields.
const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const dbInt = z.coerce.number().int().positive().max(2_147_483_647);   // Postgres int4: anything bigger would throw in the DB

export const createListingSchema = z.object({
  title: z.string().trim().min(2).max(150),
  author: z.string().trim().min(2).max(120),
  description: z.preprocess(blankToUndefined, z.string().trim().max(2000).optional()),
  language: z.nativeEnum(BookLanguage),
  condition: z.nativeEnum(BookCondition),
  type: z.nativeEnum(ListingType),
  genreId: dbInt,
  subjectId: z.preprocess(blankToUndefined, dbInt.optional()),
  // Required for SALE (0 = free), ignored for EXCHANGE. That cross-field rule lives in the action
  // so every field error is reported in one pass instead of only after the others are fixed.
  price: z.preprocess(normalizePriceInput, z.string().regex(PRICE_RE).optional()),
  // https only (no mixed content). Uploading is a separate concern; this takes the resulting URL.
  coverUrl: z.preprocess(blankToUndefined, z.string().trim().max(500).url().startsWith("https://").optional()),
});

// ───────────── deals & reviews ─────────────
/** Ids are cuids; all we insist on here is "short non-empty string". Existence is checked against the DB. */
export const idSchema = z.string().trim().min(1).max(40);

export const reviewSchema = z.object({
  transactionId: idSchema,
  rating: z.coerce.number().int().min(1).max(5),          // coerce: FormData sends "4"
  comment: z.preprocess(blankToUndefined, z.string().trim().max(1000).optional()),
});
