# UniMarket

UniMarket is a student marketplace that helps university students buy and sell items within their school community. Students can browse listings, post items for sale, manage their listings, and send inquiries to sellers.

## Team Members

- Okoro Osahon
- Nephi Imo
- Ariane Arias Peralta
- Assumpta Chidinma Okpanachi
- Martha Sibiya

## Project Description

Buying and selling within a student community can be inconvenient when listings and conversations are scattered across different platforms. UniMarket brings item discovery, listing management, and buyer-seller communication together in one application.

The application provides user accounts, searchable listings, listing management, editable profiles with saved contact preferences, and listing inquiries. It is designed to make it easier for students to find items, advertise products, and contact potential sellers.

## Technology Stack

- **Frontend:** Next.js, React, TypeScript
- **Routing:** Next.js App Router
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL
- **Authentication and security:** Server-side authentication, password hashing with `bcryptjs`, and session/token utilities using `jose`
- **Code quality:** ESLint and Prettier
- **Version control:** Git and GitHub

## Core Features

The features below are currently merged into `main`.

### User Authentication

- User registration
- User login and logout
- Password hashing
- Protected pages and actions
- Authentication checks for restricted operations

### Listings

- Browse available listings
- Search for items
- View individual listing details
- Create listings
- Edit and delete listings
- Associate listings with their owners and categories

### Profiles and Dashboard

- View profile information
- Edit the display name and save a contact preference (`email` or `in_app`)
- View the account email address as a read-only field
- Access the user dashboard
- Manage personal listings

Profile updates were merged through [PR #45](https://github.com/NephiImo/unimarket/pull/45). Contact preferences are stored settings; selecting a preference does not enable email notifications or automatic message delivery.

### Buyer and Seller Inquiries

- Send an inquiry about a listing
- View inquiries received by sellers
- Restrict received inquiries to the authenticated listing owner

### Accessibility

- Improved text contrast across the homepage, listings, authentication pages, and dashboard
- Darker button hover states and opaque muted text and placeholders
- Visible keyboard-focus outlines and stronger form-control focus rings

These improvements were merged through [PR #50](https://github.com/NephiImo/unimarket/pull/50). See the [W06 color contrast audit](docs/w06-color-contrast.md) for measured color pairs and the remaining manual checks.

## Features Under Review

These features are proposed in open pull requests and are not yet merged into `main`:

- [PR #47 — Two-way inquiry chat](https://github.com/NephiImo/unimarket/pull/47): buyer sent-inquiries pages (`/inquiries/sent`), seller responses, and ongoing buyer/seller conversations. This includes conversation APIs and an `inquiry_messages` migration.

## Application Routes

The application uses the Next.js App Router. These are the user-facing pages currently merged into `main`.

| Route | Purpose |
|---|---|
| `/` | Home page |
| `/listings` | Browse and search listings |
| `/listings/[id]` | View listing details |
| `/listings/new` | Create a listing |
| `/listings/[id]/edit` | Edit a listing |
| `/dashboard` | User dashboard and profile |
| `/inquiries/received` | View inquiries received by the user |
| `/login` | Sign in |
| `/register` | Create an account |

## API Documentation

The merged API routes use the Next.js App Router to handle authentication, profiles, listing operations, and inquiries.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Authenticate a user |
| POST | `/api/auth/logout` | End the user's session |

### Profiles

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/profile` | Retrieve the authenticated user's profile |
| PATCH | `/api/profile` | Update the authenticated user's display name and contact preference |

Both endpoints require a session and operate only on the current user's account. Successful responses contain `{ profile: { id, name, email, contact_preference } }`; password hashes are excluded.

`PATCH` requires both `name` and `contactPreference`. The display name is trimmed and must contain 1–100 characters; the preference must be `email` or `in_app`. Email and password changes are not supported by this endpoint. Malformed or invalid input returns `400`, unauthenticated requests return `401`, and a missing profile returns `404`.

### Listings

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/listings` | Retrieve listings |
| POST | `/api/listings` | Create a listing |
| GET | `/api/listings/[id]` | Retrieve a specific listing |
| PATCH | `/api/listings/[id]` | Update a listing |
| DELETE | `/api/listings/[id]` | Delete a listing |

### Inquiries

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/listings/[id]/inquiries` | Send an inquiry about a listing |
| GET | `/api/inquiries/received` | Retrieve inquiries received by the current user |

Protected operations require session authentication and server-side authorization. Listing updates and deletion are owner-only; received inquiries are visible only to the listing owner.

### APIs Under Review

These endpoints are introduced by open PRs and are not available in merged `main` yet:

| PR | Method | Endpoint | Proposed behavior |
|---|---|---|---|
| #47 | GET | `/api/inquiries/[id]/messages` | Retrieve messages in an inquiry conversation |
| #47 | POST | `/api/inquiries/[id]/messages` | Send a message in an inquiry conversation |
| #47 | POST | `/api/inquiries/[id]/response` | Submit a seller response |

## Database and Data Model

UniMarket uses PostgreSQL to store application data. The merged schema has four core tables: `users`, `listings`, `categories`, and `inquiries`.

### Users

Stores user account information, including identity and authentication-related data.

The merged profile feature also requires `users.contact_preference`: `VARCHAR(20) NOT NULL DEFAULT 'email'`, constrained to `email` or `in_app`. When the column is added by the provided migration, existing accounts receive `email`; new registrations use the same database default.

A user can own multiple listings and send multiple inquiries.

### Listings

Represents items advertised for sale.

Each listing belongs to a user and a category. A listing can receive multiple inquiries.

### Categories

Groups listings into categories so users can browse and discover relevant items.

### Inquiries

Represents a buyer's inquiry about a listing.

Each inquiry is associated with a listing and the user who sent it. Inquiries support communication between buyers and sellers.

### Inquiry Messages (Under Review)

PR #47 proposes an `inquiry_messages` table to store conversation messages, including the associated inquiry, sender, message content, and creation time. This table and its migration belong to the feature still under review.

After the feature is approved, confirm that its migration has been applied in the intended environment before relying on this table.

## Design and User Experience

UniMarket uses a warm, consistent visual style intended to make browsing and managing listings straightforward.

### Color Palette

- Soft Ivory: `#FFFDFC`
- Decorative Terracotta: `#C96F52`
- Terracotta Text and CTA Backgrounds: `#783322` (CTA hover: `#5C2618`)
- Cocoa Brown: `#352B28`
- Muted Text and Placeholders: `#514741`
- Sage Text and Availability Badge Background: `#3A5634`
- Listing Category Badge Text: `#503A45`
- HowItWorks Background: `#422B35`
- Blush Peach: `#EBC8BA`

Decorative colors, pastel borders, and translucent backgrounds remain part of the design. The HowItWorks section retains peach labels on its darker plum background.

### Contrast and Keyboard Focus

The updated text pairs measured in the [W06 audit](docs/w06-color-contrast.md) exceed 7:1, including default and hover states. A global 2px focus-visible outline with a 3px offset and explicit component focus styles improve keyboard focus visibility.

These measured improvements do not establish full WCAG AA or AAA conformance. Browser checks for responsive layouts, zoom, focus clipping or obscuration, validation states, and unchanged non-text boundaries remain outstanding.

### Typography and Layout

- Inter typography
- Responsive layouts for desktop and mobile
- Card-based listing presentation
- Consistent spacing and border radius
- Clear primary and secondary actions
- Reusable components for a consistent experience

## Getting Started

### Prerequisites

Install the following before running the application locally:

- Node.js 20.12 or newer (the database tooling uses `process.loadEnvFile`)
- npm
- Git
- Access to a PostgreSQL database

### Installation

Clone the team repository:

```bash
git clone https://github.com/NephiImo/unimarket.git
```

Move into the project directory:

```bash
cd unimarket
```

Install dependencies:

```bash
npm install
```

### Environment Configuration

Create a `.env.local` file in the project root and configure both required server-side environment variables:

```env
POSTGRES_URL=your_postgresql_connection_string
AUTH_SECRET=your_private_random_session_signing_secret
```

- `POSTGRES_URL` connects the application to PostgreSQL.
- `AUTH_SECRET` signs and verifies session tokens. Replace the placeholder with a private, cryptographically random secret.

Set both variables in your hosting provider's environment settings as well. Keep them server-side; do not expose them through `NEXT_PUBLIC_` variables.

Use the correct credentials for your development database. Never commit `.env.local`, database passwords, session secrets, or other sensitive values to GitHub.

### Database Setup

Ensure the PostgreSQL database is available and that the application's required schema and migrations have been applied before testing database-dependent features.

See the [documented database schema](docs/database-schema.md) for the core tables and relationships. The merged profile feature requires the contact-preference column described above. For a database without that column, review the intended environment and apply the merged migration from the project root:

```bash
node scripts/add-contact-preference.mjs
```

The script uses `POSTGRES_URL` from the environment or `.env.local`. It uses `ADD COLUMN IF NOT EXISTS`; if the column already exists, verify its type, default, nullability, and allowed-value constraint rather than assuming the script repairs its definition. Installation, development startup, and production builds do not run this migration automatically.

Inquiry-response and inquiry-message migrations remain part of PR #47 under review. Do not treat those proposed schema changes as requirements for the current `main` release; review and authorize their use in each intended environment after that feature is approved.

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing and Code Quality

Run the automated test suite:

```bash
npm test
```

Run the database integration tests only against a dedicated test database with the required environment variables configured. These tests create transactional fixtures and roll them back; do not run them against production:

```bash
npm run test:db
```

Run ESLint:

```bash
npm run lint
```

Check TypeScript:

```bash
npx tsc --noEmit
```

Format files using Prettier when needed:

```bash
npx prettier --write .
```

Create a production build:

```bash
npm run build
```

After a successful production build, run the application locally with:

```bash
npm start
```

## Deployment

UniMarket requires a hosting environment that supports Next.js and can connect securely to the configured PostgreSQL database.

Before deploying:

1. Configure `POSTGRES_URL` and `AUTH_SECRET` in the hosting provider.
2. Ensure the database has the merged application's required schema, including `users.contact_preference`; verify the profile migration separately for each deployment environment.
3. Run the production build and resolve any build errors.
4. Deploy the application.
5. Test registration, login, logout, listing operations, inquiry submission, and received inquiries on the deployed application. Verify display-name and contact-preference updates persist after refreshing the dashboard.
6. Check text contrast in interactive states and keyboard focus visibility across the deployed pages, alongside the remaining checks in the [W06 audit](docs/w06-color-contrast.md).

Two-way inquiry messaging remains under review in PR #47 and is not part of the current merged release. Verify that feature separately after it is merged and its approved migrations are applied.

**Live application:** [UniMarket](https://unimarket-psi.vercel.app)

**GitHub repository:** [NephiImo/unimarket](https://github.com/NephiImo/unimarket)

## Known Issues and Future Improvements

Current limitations and remaining verification:

- The W06 contrast changes have measured results, but a complete browser accessibility audit is still required; full WCAG conformance has not been established.
- Contact preferences are saved, but email notifications and preference-driven message delivery are not implemented.
- Buyer sent-inquiries pages, seller responses, and ongoing inquiry chat remain under review in PR #47.

Potential areas for continued improvement include:

- Improving Lighthouse performance and accessibility scores.
- Testing responsive layouts across different mobile screen sizes.
- Expanding automated tests for authentication, listing operations, and inquiry messaging.
- Improving the messaging experience and adding useful conversation-management features.

The improvement areas are not a confirmed list of defects. Update this section as manual verification is completed and reviewed features are merged.

## Project Maintenance

The team uses GitHub branches, issues, and pull requests to organize development and review code changes. Microsoft Teams is used for progress updates and discussion of blockers.

Changes should be tested before merging. The README should be kept up to date as features, routes, database structure, setup requirements, and deployment details change.
