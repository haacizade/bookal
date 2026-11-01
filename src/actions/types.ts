import type { WishlistPage } from "@/lib/wishlist";

export type ErrorCode =
  | "INVALID_CREDENTIALS" | "EMAIL_TAKEN" | "WRONG_PASSWORD" | "UNAUTHENTICATED" | "VALIDATION" | "GENERIC"
  // deals, reviews, wishlist
  | "NOT_FOUND"             // also returned to non-participants, so a deal id can't be probed
  | "FORBIDDEN"
  | "OWN_LISTING"
  | "LISTING_UNAVAILABLE"
  | "ALREADY_REQUESTED"
  | "NOT_PENDING"
  | "NOT_COMPLETED"
  | "ALREADY_REVIEWED";

/** Server actions return codes, never prose; the client maps them to the active language. */
export type AuthState =
  | null
  | {
      ok: false;
      code: ErrorCode;
      fields?: string[];                       // which inputs failed validation
      values?: Record<string, string>;         // echoed back because React 19 resets the form after an action (never the password)
    }
  | { ok: true };

export type CreateListingState =
  | null
  | {
      ok: false;
      code: Extract<ErrorCode, "UNAUTHENTICATED" | "VALIDATION" | "GENERIC">;
      fields?: string[];
      values?: Record<string, string>;
    }
  | { ok: true; id: string };

// ───────────── deals, reviews, wishlist ─────────────
export type ActionFail = { ok: false; code: ErrorCode; fields?: string[] };

export type CreateTransactionResult = ActionFail | { ok: true; transactionId: string };
export type CompleteTransactionResult = ActionFail | { ok: true };
export type LeaveReviewResult = ActionFail | { ok: true; reviewId: string };
export type ToggleWishlistResult = ActionFail | { ok: true; wishlisted: boolean };
export type FetchWishlistResult = ActionFail | ({ ok: true } & WishlistPage);
