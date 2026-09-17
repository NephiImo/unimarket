# UniMarket Project Specification

**Feature Branch**: `docs/project-specification`  
**Created**: 2026-09-16  
**Status**: Approved for MVP  
**Input**: Create a project specification for UniMarket, a student marketplace
for buying and selling items inside a university community. Include title and
description, purpose and target audience, user stories for core workflows
(sign up, create, read, update, delete), acceptance criteria, API endpoints,
and implementation priority.

## Project Title and Description

**Title:** UniMarket

**Description:** UniMarket is a campus-only marketplace where students can
create an account, post items for sale, browse and search listings, manage
their own posts, and send an inquiry to a seller. The MVP is a focused CRUD
product with authentication, not a full payments platform.

## Purpose and Target Audience

**Purpose:** Give students a trusted, simple place to buy and sell textbooks,
electronics, furniture, and other campus goods without leaving the school
community.

**Target audience:**

- Current university students who want to sell unused items
- Current university students who want to find affordable used goods
- Course instructors reviewing a full-stack Next.js team project

**Out of scope for MVP:** payment processing, shipping, in-app chat threads,
admin moderation dashboards, and multi-campus tenancy.

## User Scenarios & Testing

### User Story 1 - Sign up and sign in (Priority: P1)

A student creates an account with name, university email, and password, then
returns later and signs in to access seller features.

**Why this priority**: Every write action depends on knowing who the user is.

**Independent Test**: Register a new user, sign out, sign back in, and confirm
the session is recognized on a protected page.

**Acceptance Scenarios**:

1. **Given** I am a new visitor, **When** I submit a valid sign-up form,
   **Then** an account is created and I am signed in.
2. **Given** I already have an account, **When** I submit the correct email and
   password, **Then** I reach the authenticated home state.
3. **Given** I submit an invalid password or unknown email, **When** I try to
   sign in, **Then** I see a generic error and I am not signed in.
4. **Given** I am signed in, **When** I choose sign out, **Then** seller
   actions are no longer available.

---

### User Story 2 - Create a listing (Priority: P1)

A signed-in student publishes an item with title, description, price,
category, condition, and at least one image URL or upload.

**Why this priority**: Without create, the marketplace has no inventory.

**Independent Test**: Sign in, submit a valid listing form, and see the new
item on the listings page and on My Listings.

**Acceptance Scenarios**:

1. **Given** I am signed in, **When** I submit a complete listing form,
   **Then** the listing is saved and visible in the catalog.
2. **Given** I omit a required field or enter a negative price, **When** I
   submit, **Then** the listing is rejected with field-level errors.
3. **Given** I am signed out, **When** I open the create page, **Then** I am
   asked to sign in.

---

### User Story 3 - Browse and read listings (Priority: P1)

Any visitor can view a catalog of listings and open a detail page for one
item.

**Why this priority**: Buyers must be able to discover items without an
account.

**Independent Test**: Open `/listings`, click one card, and confirm title,
price, description, seller name, and inquiry action are shown.

**Acceptance Scenarios**:

1. **Given** listings exist, **When** I visit the catalog, **Then** I see cards
   with title, price, and category.
2. **Given** I open a listing detail route, **When** the id is valid, **Then**
   I see the full listing.
3. **Given** I open an unknown listing id, **When** the page loads, **Then** I
   see a not-found state.
4. **Given** I type a search term, **When** results load, **Then** only
   matching titles or descriptions are shown.

---

### User Story 4 - Update a listing (Priority: P2)

The owner can edit title, description, price, category, condition, or
availability of their own listing.

**Why this priority**: Sellers need to correct mistakes and mark items sold.
This can ship after create/read.

**Independent Test**: As the owner, change the price, save, and confirm the
detail page shows the new price. As a different user, confirm the edit control
is hidden.

**Acceptance Scenarios**:

1. **Given** I own a listing, **When** I submit valid edits, **Then** the
   stored listing is updated.
2. **Given** I do not own the listing, **When** I call the update endpoint,
   **Then** I receive 403 and the listing is unchanged.
3. **Given** I mark a listing as sold, **When** a buyer views the catalog,
   **Then** the item shows a sold state and is not presented as available.

---

### User Story 5 - Delete a listing (Priority: P2)

The owner can remove a listing they no longer want public.

**Why this priority**: Required for complete CRUD, but catalog value already
exists without it.

**Independent Test**: Delete an owned listing and confirm it disappears from
the catalog and returns 404 on its detail URL.

**Acceptance Scenarios**:

1. **Given** I own a listing, **When** I confirm delete, **Then** the listing
   is removed.
2. **Given** I do not own the listing, **When** I request delete, **Then** I
   receive 403.

---

### User Story 6 - Send a seller inquiry (Priority: P3)

A signed-in buyer sends a short message to the seller about a listing.

**Why this priority**: It completes the marketplace loop without building
payments or realtime chat.

**Independent Test**: From a detail page, submit an inquiry and confirm the
seller can read it on an inquiries page.

**Acceptance Scenarios**:

1. **Given** I am signed in and viewing another student's listing, **When** I
   submit an inquiry, **Then** the seller can see the message and listing
   reference.
2. **Given** I am the listing owner, **When** I view the detail page, **Then**
   the inquiry form is not shown for my own item.

### Edge Cases

- Duplicate sign-up with an email that already exists
- Extremely long titles or descriptions
- Price of `0`, negative numbers, or non-numeric input
- Listing with a broken image URL
- Concurrent edit and delete of the same listing
- Signed-out user bookmarking `/listings/new`

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow a student to create an account with name,
  email, and password.
- **FR-002**: System MUST authenticate returning users and persist a session.
- **FR-003**: System MUST allow authenticated users to create, read, update,
  and delete their listings.
- **FR-004**: System MUST allow any visitor to browse and search listings.
- **FR-005**: System MUST validate listing input (required title, description,
  non-negative price, category).
- **FR-006**: System MUST prevent users from updating or deleting listings they
  do not own.
- **FR-007**: System MUST support a sold/available status on listings.
- **FR-008**: System MUST allow an authenticated buyer to send an inquiry to a
  listing owner.
- **FR-009**: System MUST expose JSON API endpoints under `app/api/` for the
  resources above.
- **FR-010**: Interface MUST be responsive with no horizontal scrolling on
  common mobile widths.

### Key Entities

- **User**: id, name, email, password hash, createdAt
- **Listing**: id, ownerId, title, description, price, category, condition,
  imageUrl, status (`available` | `sold`), createdAt, updatedAt
- **Inquiry**: id, listingId, buyerId, message, createdAt

## API Endpoints (MVP)

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Create session |
| POST | `/api/auth/logout` | Yes | End session |
| GET | `/api/listings` | No | List/search listings |
| POST | `/api/listings` | Yes | Create listing |
| GET | `/api/listings/[id]` | No | Read one listing |
| PATCH | `/api/listings/[id]` | Owner | Update listing |
| DELETE | `/api/listings/[id]` | Owner | Delete listing |
| GET | `/api/me/listings` | Yes | Current user's listings |
| POST | `/api/listings/[id]/inquiries` | Yes | Send inquiry |
| GET | `/api/me/inquiries` | Yes | Inquiries on my listings |

## Implementation Priority

1. Project shell, layout, design tokens, seed/sample listings (read-only)
2. Auth (sign up, sign in, sign out)
3. Create listing
4. Listing detail + search/filter
5. Update and delete (owner only)
6. Inquiries
7. Polish: empty states, loading states, accessibility, Lighthouse pass

## Success Criteria

- **SC-001**: A new student can register and publish a listing in under three
  minutes.
- **SC-002**: A visitor can find a listing from the home/catalog path without
  an account.
- **SC-003**: Owners can complete a full CRUD cycle on their own listings.
- **SC-004**: Unauthorized update/delete attempts fail with 401 or 403.
- **SC-005**: Primary pages remain usable at a 375px-wide viewport with no
  horizontal scroll.
