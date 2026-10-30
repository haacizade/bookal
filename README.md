# Bookal — step 1: schema + authentication

```bash
npm install
cp .env.example .env            # fill DATABASE_URL, AUTH_SECRET (openssl rand -base64 32)
npx prisma migrate dev --name init
psql "$DATABASE_URL" -f prisma/constraints.sql   # CHECK constraints Prisma can't express
npm run db:seed                 # genres + subjects
npm run dev
```

Without `RESEND_API_KEY` the verification link is printed in the server console.
Pinned to Prisma 6 and Next.js 15 (`middleware.ts`); Next 16 renames it to `proxy.ts`, Prisma 7 moves `url` into `prisma.config.ts`.

## Step 2 (part 1): listings

- `src/actions/auth.ts` (step 1) already covers register / verify / resend / login / logout. Use `getActiveUser()` from `src/lib/session.ts` in any new Server Action that must return a result instead of redirecting.
- `src/actions/listings.ts`
  - `createListingAction(prev, formData)` for `useActionState`; returns `{ ok: true, id }` or `{ ok: false, code, fields, values }`.
  - `fetchListingsAction(params)` for client-side filtering / "load more".
- In a Server Component, skip the action and query directly:

```ts
const filters = parseListingFilters(await searchParams);        // src/lib/listing-params.ts
const page = await queryListings(filters, session?.user?.id);   // src/lib/listings.ts
```

Filter params (all optional, comma-separated or repeated, case-insensitive):
`language=az,en  condition=used  type=sale|exchange  genre=textbook  subject=physics  q=calculus  page=2  pageSize=24`

## Step 2 (part 2): deals, reviews, wishlist

All actions return `{ ok: true, … }` or `{ ok: false, code, fields? }` (codes live in `src/actions/types.ts`, texts in `src/lib/copy.ts`).

| Action | Who | Notes |
|---|---|---|
| `createTransactionAction(listingId)` | logged-in buyer | ACTIVE listing, not your own, one PENDING request per buyer; copies `type` + `price` |
| `completeTransactionAction(transactionId)` | the **seller** only | PENDING → COMPLETED, listing → COMPLETED, other PENDING requests → CANCELLED, all in one DB transaction |
| `leaveReviewAction({ transactionId, rating, comment? })` or `FormData` | buyer or seller of a COMPLETED deal | one review per party; updates the other party's `ratingAvg`/`ratingCount` atomically |
| `toggleWishlistAction(listingId)` | logged-in user | returns `{ wishlisted }`; safe under double-clicks |
| `fetchWishlistAction({ page?, pageSize? })` | logged-in user | items = `{ addedAt, status, listing: ListingCard }`; archived listings hidden |

Locking: every write that changes a listing locks the listing row first, then touches transactions (no deadlocks, no double-complete).
