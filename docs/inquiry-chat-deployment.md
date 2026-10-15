# Inquiry chat deployment

PR #47 adds buyer sent inquiries, a one-time seller response, and two-way messages
between an inquiry's buyer and the listing owner. Both participants can read the
original inquiry, the seller response, and subsequent chat. The response remains
in `inquiries.seller_response`; existing responses are not copied into chat.
Listings use soft deletion, so existing conversation history remains available
to its participants after a listing is removed. New inquiries require an active
listing. Authentication always comes from the verified session.

## Database requirements

The existing `users`, `listings`, and `inquiries` tables are described in
[database-schema.md](database-schema.md). This feature additionally needs:

| Object | Required definition |
| --- | --- |
| `inquiries.seller_response` | Nullable `TEXT`, with no non-null default |
| `inquiries.responded_at` | Nullable `TIMESTAMP`, with no non-null default |
| `inquiry_messages.id` | `UUID` primary key, defaults to `gen_random_uuid()` |
| `inquiry_messages.inquiry_id` | Required `UUID`, references `inquiries(id)` with `ON DELETE CASCADE` |
| `inquiry_messages.sender_id` | Required `UUID`, references `users(id)` with `ON DELETE CASCADE` |
| `inquiry_messages.message` | Required `TEXT` |
| `inquiry_messages.created_at` | Required `TIMESTAMP`, defaults to `CURRENT_TIMESTAMP` |
| `inquiry_messages_inquiry_id_idx` | Valid non-unique btree index on `(inquiry_id, created_at)` |

The cascade policies only apply to hard deletion of an inquiry or user. Listing
removal retains its row and its existing `inquiries.listing_id` foreign key with
`NO ACTION`. No migration changes existing listing deletion behavior.

A read-only catalog inspection of the configured database on **2026-10-15**
confirmed that both response columns, the message table, its primary key and
foreign keys, and the conversation index already exist with these definitions.
No migrations or database writes were performed during that inspection. Other
deployment environments must be checked individually.

## Pre-deployment review

1. Confirm the deployment commit and intended database with the deployment owner.
   Keep `POSTGRES_URL` and `AUTH_SECRET` private and configured on the server.
2. Take a database backup or provider snapshot and confirm the restore procedure
   before approving schema changes. Review them on a staging database first.
3. Inspect the catalog using a read-only database session. The following SQL
   reads metadata only and can be run in the provider's SQL console:

   ```sql
   BEGIN TRANSACTION READ ONLY;

   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_schema = 'public'
     AND ((table_name = 'inquiries'
           AND column_name IN ('seller_response', 'responded_at'))
          OR table_name = 'inquiry_messages')
   ORDER BY table_name, ordinal_position;

   SELECT c.conname, c.contype, c.convalidated,
          pg_get_constraintdef(c.oid) AS definition
   FROM pg_constraint c
   WHERE c.conrelid IN (
       to_regclass('public.inquiries'),
       to_regclass('public.inquiry_messages')
   )
   ORDER BY c.conrelid, c.conname;

   SELECT t.relname AS table_name, idx.relname AS index_name,
          i.indisvalid, i.indisready, pg_get_indexdef(i.indexrelid) AS definition
   FROM pg_index i
   JOIN pg_class t ON t.oid = i.indrelid
   JOIN pg_namespace n ON n.oid = t.relnamespace
   JOIN pg_class idx ON idx.oid = i.indexrelid
   WHERE n.nspname = 'public' AND t.relname = 'inquiry_messages';

   SELECT to_regprocedure('gen_random_uuid()') IS NOT NULL AS uuid_default_available;
   COMMIT;
   ```

4. Compare the metadata with the requirements above. An existing name alone does
   not establish compatibility. Investigate mismatched types, defaults, nullability,
   foreign keys, or invalid indexes before proceeding; the scripts do not repair
   incompatible existing definitions automatically.

## Authorized migration commands

These commands are manual database changes. Run them only after the target and
backup have been reviewed and the deployment owner has explicitly authorized
migrations for that environment. Do not run them as part of install, build, or
automatic deployment hooks. If the required structures are already present and
compatible, no migration is needed.

From the repository root, using the approved environment's `POSTGRES_URL`:

```sh
node scripts/add-inquiry-responses.mjs
node scripts/add-inquiry-messages.mjs
```

Run the response migration first: both inquiry list pages select its columns.
Run the message migration second, then repeat the read-only checks before
deploying the feature. Each script loads `.env.local` when it exists; check the
intended environment without printing connection strings or secrets. Node.js
20.12 or newer is required for `process.loadEnvFile`.

Each script uses one transaction, a five-second lock timeout and a thirty-second
statement timeout. It verifies existing definitions before reporting success.
`IF NOT EXISTS` permits repeat runs against compatible schemas; it does not skip
verification. A verification failure rolls back that script's changes. The two
scripts use separate transactions, so a completed response migration remains
if the message migration fails. Both changes are additive; neither script
backfills conversations, rewrites existing rows, or drops existing data.

For application rollback, redeploy the previous application version and retain
the additive columns and table. Do not drop message data or response columns as
an automatic rollback step.

## Verification

Application checks:

```sh
npm test
npx tsc --noEmit
npm run lint
npm run build
```

`npm test` includes API authorization/validation tests and catalog-contract tests
for migration guards. These mocked checks do not establish actual database
persistence. A build requires the normal server environment, including
`AUTH_SECRET`.

Database persistence checks require a separately provisioned, explicitly approved
test database and `TEST_POSTGRES_URL` in the process environment. Neither suite
loads `.env.local` or falls back to `POSTGRES_URL`. Do not point this variable at
production. Run only after database test writes have been authorized:

```sh
node --test tests/inquiry-database.integration.mjs
node --test tests/listing-database.integration.mjs
```

The new inquiry suite creates a uniquely named schema inside one transaction,
sets a transaction-local search path that excludes `public`, and rolls back all
tables and fixtures on success or failure. It verifies the schema is gone after
rollback. Its test role needs `CREATE` permission on the dedicated test database.
It exercises real PostgreSQL queries and API handlers with an isolated session
fixture: buyer/seller messages, spoofed owner IDs, unauthorized access, input
validation, original inquiries, one-time seller responses, and history after
listing soft deletion. The existing listing suite operates on the test database's
prepared application schema and rolls back its fixture rows.

When `TEST_POSTGRES_URL` is absent, both database suites skip without connecting.
It was unavailable during the 2026-10-15 review, so database persistence execution
was not performed. The configured application database was inspected read-only.

After deploying, verify sent/received pages, the original inquiry and response,
both participants' messages, refresh behavior, understandable failure messages,
and keyboard navigation. Use explicitly approved test accounts/listings; do not
create production records automatically for a smoke test.
