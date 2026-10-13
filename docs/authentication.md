# UniMarket Authentication

## Authentication Approach

UniMarket uses custom authentication with bcryptjs and jose.

- Passwords are hashed with bcryptjs using 12 salt rounds. Plain-text passwords are not stored.
- jose creates and verifies JWT session tokens.
- Session tokens are stored in an HTTP-only cookie named `session` with a seven-day expiry.
- The cookie uses SameSite=Lax and is marked Secure in production.
- `getCurrentUser()` verifies the session and retrieves the authenticated user.
- Protected API routes must identify users through the verified session, not a client-supplied user ID or `x-user-id` header.
- The `AUTH_SECRET` environment variable must be configured and kept private.

## Protected Features

Listing creation, listing updates and deletion, inquiries, the dashboard, and received inquiries use the authenticated user's session where applicable.

## Security Notes

Never commit secrets or expose password hashes in API responses. Unauthenticated requests to protected operations should be rejected.
