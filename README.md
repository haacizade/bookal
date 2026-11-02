# Bookal — step 1: schema + authentication

```bash
npm install
cp .env.example .env            # fill DATABASE_URL, AUTH_SECRET (openssl rand -base64 32)
npx prisma migrate dev --name init
psql "$DATABASE_URL" -f prisma/constraints.sql   # CHECK constraints Prisma can't express
npm run db:seed                 # genres + subjects
npm run dev
```

Registration signs the user in immediately; there is no email verification.
Pinned to Prisma 6 and Next.js 15 (`middleware.ts`); Next 16 renames it to `proxy.ts`, Prisma 7 moves `url` into `prisma.config.ts`.

## Marketplace controls

- The header language cookie supports Azerbaijani (`az`), Turkish (`tr`) and English (`en`). Theme choice is stored in `localStorage`.
- Listings are created at `/listings/new`, require a valid seller phone number, and enter `PENDING_APPROVAL`. Approved listings become visible in the catalog; rejected or removed listings are archived to preserve transaction history.
- `/admin` re-checks the user's database role on each request. The seed script grants the role to the account matching `ADMIN_EMAIL`.
- VIP access is granted after an administrator approves a request and expires after one year. No payment provider is configured, so the current flow is an approval request rather than a checkout.

For an existing database, create and apply a Prisma migration after changing the schema:

```bash
npm run db:migrate -- --name marketplace_controls
psql "$DATABASE_URL" -f prisma/constraints.sql
```

The SQL file adds the one-pending-VIP-request-per-user partial unique index in addition to the application checks.

## Step 2 (part 1): listings

- `src/actions/auth.ts` (step 1) already covers register / login / logout. Use `getActiveUser()` from `src/lib/session.ts` in any new Server Action that must return a result instead of redirecting.
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

## JSON endpoints (for `index.html`)

`POST /api/wishlist/toggle`, `GET /api/wishlist/list`, `POST /api/transactions/create`, `POST /api/transactions/complete`, `POST /api/reviews/create` are thin wrappers around the Server Actions above. They answer `{ ok: true, … }` or `{ ok: false, code }` with a matching HTTP status.
