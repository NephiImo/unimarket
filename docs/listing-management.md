# Listing management

Authenticated students can create listings at `/listings/new`, edit their own
listings at `/listings/[id]/edit`, and manage them from `/dashboard`. Both pages
use `components/ListingForm.tsx`, PostgreSQL categories, and the existing listing
API. Session authentication uses `getCurrentUser()`; submitted owner IDs and
`x-user-id` headers never identify the owner.

The form and API share validation for required fields, lengths, price precision
and range, category IDs, optional HTTP(S) image URLs, and availability. The API
also checks that a category exists. Editing can clear an image URL and change
availability between `active` and `sold`.

Owner deletion requires confirmation. It changes status to `deleted`, retains
inquiry references, and excludes the listing from browsing, details, editing,
and the dashboard. Deleted records cannot be restored through PATCH. See
`database-schema.md` for the verified database constraints.

## Verification

```sh
npx tsc --noEmit
npm run lint
npm run build
npm test
npm run inspect:listings-schema
npm run test:db
```

`npm test` runs isolated API, SQL query, and server-page tests without credentials.
`inspect:listings-schema` reads database metadata inside a read-only transaction.
`test:db` exercises the real API handlers and PostgreSQL queries with an isolated
session fixture, creates temporary users/listing/inquiry records inside one
transaction, and always rolls the transaction back. It verifies that no fixture
records remain. It covers session/owner spoofing, unauthorized mutations,
editing persistence, image clearing, public visibility, deletion, and inquiry
retention. These scripts load `.env.local` when present using Node's
`process.loadEnvFile` (Node 20.12 or newer). Credentials must never be committed.

If `POSTGRES_URL` is unavailable, schema inspection reports the blocker and the
database integration test skips. The application build and live authentication
require the existing `AUTH_SECRET` configuration.

## Pending inquiry integration

This branch is based on `feat/listings-integration` (PR #36). It leaves
`app/listings/[id]/page.tsx` unchanged so PR #41 can add its inquiry form and login
prompt. Owner edit/delete controls live in the shared listing detail component.
Dashboard changes stay within the existing My Listings section, preserving the
profile section and the place where PR #41 adds Received Inquiries. Received
inquiry joins continue to work because soft deletion retains listing rows;
PR #41's active-status guard prevents new inquiries on deleted listings.
