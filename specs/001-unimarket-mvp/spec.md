# UniMarket MVP Specification

**Project Title**: UniMarket
**Feature Branch**: `001-unimarket-mvp`
**Created**: 2026-09-14
**Status**: Draft

## Description

UniMarket is a student marketplace for university communities. Authenticated students can
publish items they want to sell, discover available items, and contact sellers through
structured inquiries. The MVP focuses on a clear, safe path from account creation to
listing discovery and seller contact without adding transaction logistics.

## Purpose and Target Audience

The purpose is to make it easier for students to find affordable second-hand items from
other students and to give sellers a simple place to advertise items locally within their
university community.

The primary audience is university students who want to buy or sell used goods. A student
may act as both a buyer and a seller. The MVP assumes a small student team and a limited
initial campus audience.

## Scope and Priorities

- **P0 - Required MVP foundation**: account registration, login, logout, basic profile
  management, listing creation and management, listing browsing, and listing details.
- **P1 - Required discovery and contact**: search by item name, category filtering, seller
  information, buyer inquiries, and seller inquiry viewing.
- **P2 - Quality and readiness**: responsive and accessible presentation, validation and
  authorization safeguards, useful empty and error states, and basic automated coverage
  for important success and failure paths.

The MVP explicitly excludes online payments, delivery management, real-time chat, ratings
and reviews, auctions or bidding, AI recommendations, and push notifications.

## User Scenarios & Testing

### User Story 1 - Create and Manage an Account (Priority: P0)

As a university student, I want to create an account, sign in and out, and update basic
profile information so that I can use the marketplace and be identifiable to other users.

**Why this priority**: Accounts establish ownership of listings and inquiries and provide
the minimum boundary needed for a student marketplace.

**Independent Test**: Register a new student, sign in, update the display name, sign out,
and confirm that protected actions require signing in again.

**Acceptance Scenarios**:

1. **Given** an unused email address and valid account details, **When** the student submits
   registration, **Then** an account is created and the student can access authenticated
   features.
2. **Given** an existing account, **When** the student submits valid credentials, **Then**
   the student is signed in and can access their profile and listings.
3. **Given** an authenticated student, **When** they update their display name or contact
   preference with valid values, **Then** the updated profile information is shown on the
   next account view.
4. **Given** an authenticated student, **When** they choose logout, **Then** the session is
   ended and protected pages or actions require authentication.
5. **Given** invalid or already-used registration details, **When** registration is
   submitted, **Then** the account is not created and a clear correction message is shown.

### User Story 2 - Publish and Manage a Listing (Priority: P0)

As a student seller, I want to create, view, edit, and delete my own item listings so that
I can keep my advertised items accurate.

**Why this priority**: Listings are the marketplace's primary value and seller ownership
is required before buyers can discover items.

**Independent Test**: Sign in as a seller, create a valid listing, view it, edit it, and
delete it; confirm that another student cannot edit or delete it.

**Acceptance Scenarios**:

1. **Given** an authenticated student with valid item details, **When** they submit a new
   listing, **Then** the listing is saved with the student as seller and appears in their
   listings.
2. **Given** an owned listing, **When** the seller opens its edit flow and saves valid
   changes, **Then** the listing displays the updated details.
3. **Given** an owned listing, **When** the seller confirms deletion, **Then** the listing
   is no longer visible in browse results or the seller's listings.
4. **Given** a listing owned by another student, **When** a student attempts to edit or
   delete it, **Then** the action is denied and the listing remains unchanged.
5. **Given** missing, invalid, or overly long listing fields, **When** a listing is
   submitted, **Then** it is not saved and each invalid field has an understandable error.

### User Story 3 - Browse and Discover Items (Priority: P0)

As a student buyer, I want to browse available listings and open a listing detail page so
that I can understand what is for sale and who is selling it.

**Why this priority**: Browsing and details deliver immediate value even before search and
inquiries are added.

**Independent Test**: Seed several available listings, browse the listing collection, open
one detail page, and confirm that its item and seller information are present.

**Acceptance Scenarios**:

1. **Given** available listings exist, **When** a student opens the marketplace, **Then** a
   browse view shows each listing's item name, price, category, and availability summary.
2. **Given** a listing in the browse view, **When** the student selects it, **Then** a
   detail page shows its full description, price, category, posted date, and seller display
   name.
3. **Given** no listings match the current browse state, **When** the student views the
   browse page, **Then** a useful empty state explains that no items are currently found.
4. **Given** a listing has been deleted or cannot be found, **When** its detail page is
   opened, **Then** the student sees a clear unavailable-listing message and a path back to
   browsing.

### User Story 4 - Search and Filter Listings (Priority: P1)

As a student buyer, I want to search by item name and filter by category so that I can
 quickly narrow the marketplace to relevant items.

**Why this priority**: Discovery controls make a growing set of listings practical to use
 without expanding the MVP into recommendations or advanced ranking.

**Independent Test**: Create listings with different names and categories, search for a
 partial item name, apply a category filter, clear the controls, and compare the results.

**Acceptance Scenarios**:

1. **Given** listings with varied names, **When** a student searches for an item-name
   term, **Then** results include listings whose item name matches the term without regard
   to letter case.
2. **Given** listings in multiple categories, **When** a student selects a category,
   **Then** only listings in that category are shown.
3. **Given** an active search and category filter, **When** the student clears them, **Then**
   the browse view returns to all available listings.
4. **Given** search and filter criteria with no matches, **When** results are displayed,
   **Then** the empty state identifies that no listings match and allows the criteria to be
   changed.

### User Story 5 - Send and View Listing Inquiries (Priority: P1)

As a student buyer, I want to send an inquiry about a listing, and as a seller, I want to
view inquiries received for my listings so that interested students can make contact
without requiring real-time chat.

**Why this priority**: Inquiries create the minimum buyer-seller connection while keeping
communication simple and within the stated MVP boundary.

**Independent Test**: Sign in as a buyer to send a valid inquiry, then sign in as the
listing seller and confirm the inquiry is visible with its listing and sender context.

**Acceptance Scenarios**:

1. **Given** an authenticated buyer viewing an available listing, **When** they submit a
   non-empty inquiry, **Then** the inquiry is saved for that listing and seller with the
   buyer's identity and submission time.
2. **Given** an inquiry received for one of the seller's listings, **When** the seller opens
   received inquiries, **Then** the inquiry message, listing name, sender display name, and
   date are shown.
3. **Given** a buyer is not authenticated or submits an empty or overlong message, **When**
   they attempt to send an inquiry, **Then** the inquiry is rejected with a clear next
   action and no incomplete inquiry is saved.
4. **Given** a student is not the seller of a listing, **When** they request the seller's
   received inquiries, **Then** access is denied and other students' inquiries are not
   disclosed.
5. **Given** the listing is no longer available, **When** a buyer attempts to send an
   inquiry, **Then** the inquiry is rejected and the buyer is told that the listing is no
   longer available.

### Edge Cases

- Registration rejects duplicate email addresses and invalid or incomplete required data.
- Login failure does not reveal whether an email address is registered.
- A student cannot access another student's profile controls, listings management, or
  received inquiries.
- A listing with an empty description, invalid price, unsupported category, or excessively
  long text cannot be published.
- Deleted listings disappear from browse, search, and category results without deleting
  unrelated listings.
- Search handles leading and trailing spaces and returns a useful result for no matches.
- Listing and inquiry pages handle missing records without exposing internal details.
- User-generated text is displayed as text rather than interpreted as executable markup.
- The interface remains usable on narrow mobile screens and with keyboard navigation.

## Requirements

### Functional Requirements

- **FR-001 (P0)**: The system MUST allow a student to register with a unique email address,
  password, and required profile information.
- **FR-002 (P0)**: The system MUST allow registered students to log in and log out, and
  MUST protect authenticated actions from unauthenticated users.
- **FR-003 (P0)**: Students MUST be able to view and update their basic profile information.
- **FR-004 (P0)**: Authenticated students MUST be able to create listings with an item name,
  description, price, category, and availability status.
- **FR-005 (P0)**: Students MUST be able to view, edit, and delete only listings they own.
- **FR-006 (P0)**: The system MUST provide a browse view of available listings and an
  individual detail view for each available listing.
- **FR-007 (P1)**: The browse view MUST support case-insensitive item-name search and
  category filtering, including a clear way to remove both criteria.
- **FR-008 (P1)**: Listing details MUST show the seller's public display name and MUST NOT
  expose private account data.
- **FR-009 (P1)**: Authenticated buyers MUST be able to send a non-empty inquiry tied to an
  available listing.
- **FR-010 (P1)**: Sellers MUST be able to view inquiries received for listings they own,
  including the inquiry text, sender display name, listing, and date.
- **FR-011 (P0)**: The system MUST validate required fields, field lengths, prices, email
  addresses, categories, and inquiry messages before saving data.
- **FR-012 (P0)**: The system MUST enforce server-side ownership checks for listing changes
  and seller-only inquiry access.
- **FR-013 (P2)**: The system MUST provide understandable success, empty, unavailable,
  validation, and authorization error states without exposing sensitive internal details.
- **FR-014 (P2)**: The interface MUST support keyboard access, meaningful labels, readable
  contrast, and usable layouts on mobile and desktop screen sizes.
- **FR-015 (P2)**: Important account, listing, search, and inquiry success and failure paths
  MUST have basic automated test coverage.

### API Endpoints

The following endpoint contracts define the MVP's external behavior. All request bodies and
responses use structured data, and protected endpoints require an authenticated session.

| Method | Endpoint | Priority | Purpose |
|--------|----------|----------|---------|
| POST | `/api/auth/register` | P0 | Create a student account |
| POST | `/api/auth/login` | P0 | Authenticate a student |
| POST | `/api/auth/logout` | P0 | End the current session |
| GET | `/api/profile` | P0 | Read the current student's profile |
| PATCH | `/api/profile` | P0 | Update the current student's profile |
| GET | `/api/listings` | P0 | Browse listings; accepts `search`, `category`, and pagination filters |
| POST | `/api/listings` | P0 | Create a listing for the current student |
| GET | `/api/listings/{listingId}` | P0 | Read one listing and public seller information |
| PATCH | `/api/listings/{listingId}` | P0 | Update an owned listing |
| DELETE | `/api/listings/{listingId}` | P0 | Delete an owned listing |
| POST | `/api/listings/{listingId}/inquiries` | P1 | Send an inquiry about an available listing |
| GET | `/api/inquiries/received` | P1 | List inquiries for the current student's listings |

Endpoint behavior MUST return an appropriate success or failure result, MUST validate input,
and MUST avoid exposing private data or records the requesting student is not authorized to
access. Exact response field names may be finalized during technical planning without
changing the user-visible behavior described here.

### Out of Scope

The MVP does not process payments, coordinate delivery, provide real-time chat, collect
ratings or reviews, support auctions or bidding, generate recommendations with AI, or send
push notifications. These features require separate product decisions and MUST NOT be
implemented as hidden extensions of this specification.

### Assumptions

- A student may buy and sell using the same account.
- Email and password are sufficient for the initial account flow; university single sign-on
  is not required for the MVP.
- A small, predefined category list is maintained for the first release.
- Listings have one current availability status and are shown in browse results only while
  available.
- Inquiries are asynchronous records; the MVP does not promise delivery receipts, threads,
  or real-time responses.
- Pagination or an equivalent bounded result set is used for browse and inquiry collections
  so the student experience remains responsive as the dataset grows.

## Key Entities

- **Student Account**: A registered university student with a unique email, protected
  credential, public display name, and optional contact preference.
- **Listing**: An item offered by one student, including item name, description, price,
  category, availability status, seller reference, and timestamps.
- **Category**: A predefined label used to organize listings and filter browse results.
- **Inquiry**: A buyer's message associated with one listing and its seller, including sender,
  message text, creation date, and listing context.

## Success Criteria

### Measurable Outcomes

- **SC-001**: At least 90% of first-time test users can register, sign in, and reach the
  browse view without assistance in under 3 minutes.
- **SC-002**: At least 90% of test sellers can create a valid listing in under 3 minutes and
  can later edit or delete that listing without administrator help.
- **SC-003**: At least 95% of browse, search, and category-filter actions show the expected
  result or a clear no-results state within 2 seconds under the agreed MVP test load.
- **SC-004**: At least 90% of test buyers can find a target listing, open its details, and
  send an inquiry in under 3 minutes.
- **SC-005**: 100% of tested unauthorized attempts to modify another student's listing or
  view their received inquiries are denied without disclosing protected data.
- **SC-006**: All P0 and P1 acceptance scenarios have a repeatable test or documented
  manual verification before the MVP is released.
- **SC-007**: At least 90% of usability-test participants can complete the primary browse,
  listing, and inquiry journeys on a mobile-sized viewport using keyboard navigation where
  applicable.
