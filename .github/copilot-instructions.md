# UniMarket GitHub Copilot Instructions

## Project Overview

UniMarket is a student marketplace for university students to buy and sell items within their school community.

The application supports authentication, listings, search and filtering, user profiles, and buyer-to-seller inquiries.

## Technology Stack

- Next.js
- TypeScript
- App Router
- Tailwind CSS
- PostgreSQL

## Terminology

Use the following project terminology consistently:

- `Listing`, not Product
- `ListingCard`, not ProductCard
- `ListingForm`, not ProductForm
- `Inquiry` for buyer-to-seller messages
- `/listings` for the marketplace catalog

Do not introduce alternative terminology unless the team explicitly changes the architecture.

## Core Entities

### User / Profile
A user can own many Listings and send many Inquiries.

### Listing
A Listing belongs to one User and one Category and can receive many Inquiries.

### Category
A Category contains many Listings.

### Inquiry
An Inquiry belongs to a Listing and has a sender.

## Application Routes

Planned routes include:

- `/`
- `/listings`
- `/listings/[id]`
- `/listings/new`
- `/listings/[id]/edit`
- `/dashboard`
- `/inquiries`
- `/login`
- `/register`

## API Conventions

Listing APIs should use:

- `GET /api/listings`
- `POST /api/listings`
- `GET /api/listings/[id]`
- `PATCH /api/listings/[id]`
- `DELETE /api/listings/[id]`

Inquiry APIs should use:

- `POST /api/listings/[id]/inquiries`
- `GET /api/inquiries/received`

Use appropriate HTTP status codes and typed request/response data.

## Component Conventions

Prefer reusable components such as:

- Header
- Footer
- Navigation
- SearchBar
- FilterBar
- ListingCard
- ListingForm
- ListingDetails
- Button
- Loading states

Avoid duplicating UI logic that can reasonably be shared.

## TypeScript

Use TypeScript types for:

- domain entities
- component props
- API data
- form values

Shared domain types should be centralized where practical so frontend and backend code use consistent contracts.

Avoid `any` unless there is a clear reason.

## Authentication and Authorization

Protected actions must verify the authenticated user.

Only listing owners may edit or delete their listings.

Users must not be able to access another user's private profile controls.

Sellers must only be able to view inquiries associated with their own listings.

Never store passwords or authentication secrets in plain text.

## Database

PostgreSQL is the project's database.

Do not use hardcoded listing arrays as the final production data source.

Database-backed features should follow the agreed User/Profile, Listing, Category, and Inquiry relationships.

## Styling

Use Tailwind CSS.

Design choices include:

- Inter typography
- responsive layouts
- consistent spacing
- card-based listing presentation
- responsive grids
- consistent border radius

Project palette:

- Warm Porcelain `#F6F1EA`
- Muted Terracotta `#C96F52`
- Soft Sage `#879B7A`
- Dusty Plum `#765C68`
- Cocoa Brown `#352B28`
- Soft Ivory `#FFFDFC`
- Blush Peach `#EBC8BA`

## Development Practices

- Keep features aligned with their GitHub issues and acceptance criteria.
- Prefer small, focused pull requests.
- Do not merge unfinished work simply to close an issue.
- Keep components and APIs typed.
- Handle loading, empty, error, and not-found states.
- Preserve mobile responsiveness.
- Reuse existing project patterns before creating new abstractions.