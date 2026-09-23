# UniMarket

UniMarket is a student marketplace that allows university students to buy and sell items within their school community.

## Team Members

- Okoro Osahon
- Nephi Imo
- Ariane Arias Peralta
- Assumpta Chidinma Okpanachi

## Project Description

UniMarket provides students with a simple platform to create accounts, post items for sale, browse and search listings, manage their own listings, and send inquiries to sellers.

## Technology Stack

- Next.js
- TypeScript
- Tailwind CSS
- App Router
- PostgreSQL

## Core Features

- User registration, login, and logout
- Browse and search listings
- View individual listing details
- Create, edit, and delete listings
- User profile and dashboard
- Buyer-to-seller inquiries

## Core Data Model

### User / Profile

Stores account and profile information for each student.

A user can:
- own multiple listings
- send multiple inquiries

### Listing

Represents an item posted for sale.

A listing:
- belongs to one user
- belongs to one category
- can receive multiple inquiries

### Category

Groups listings into categories.

A category can contain multiple listings.

### Inquiry

Represents a message sent by a buyer about a listing.

An inquiry:
- belongs to one listing
- is sent by one user

## Component and Page Structure

Planned routes include:

- `/` — Home page
- `/listings` — Browse and search listings
- `/listings/[id]` — Listing details
- `/listings/new` — Create a listing
- `/listings/[id]/edit` — Edit a listing
- `/dashboard` — User dashboard/profile
- `/inquiries` — Seller inquiries
- `/login` — Login
- `/register` — Registration

Reusable components include:

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

## Design Direction

### Color Palette

- Warm Porcelain — `#F6F1EA`
- Muted Terracotta — `#C96F52`
- Soft Sage — `#879B7A`
- Dusty Plum — `#765C68`
- Cocoa Brown — `#352B28`
- Soft Ivory — `#FFFDFC`
- Blush Peach — `#EBC8BA`

### Typography

- Inter

### Layout

- Responsive mobile-first design
- Consistent spacing
- Card-based listing layout
- Responsive grid
- Clear primary and secondary buttons
- Consistent border radius
- Tailwind CSS for styling

## Week 04 Priority Work

The highest-priority implementation work is tracked using the **Week 04** GitHub milestone.

Current priority issues:

- #13 — App shell and shared navigation
- #14 — UniMarket home page
- #15 — PostgreSQL schema
- #16 — Listings API and data access layer
- #17 — Listings browse UI and reusable ListingCard
- #18 — Listing detail page

## Feature Ownership

### Nephi Imo
- #13 — App shell and shared navigation
- #17 — Listings browse UI and reusable ListingCard
- #21 — Frontend/database integration
- #23 — Buyer-to-seller inquiry flow

### Assumpta Chidinma Okpanachi
- #15 — PostgreSQL schema
- #14 — UniMarket home page
- Backend/database support

### Okoro Osahon
- #18 — Listing detail page
- #19 — Create and edit listing forms
- #20 — Authentication and protected routes

### Ariane Arias Peralta
- #16 — Listings API and data access layer
- #22 — Profile and dashboard experience

## Dependencies

Important development dependencies include:

- The PostgreSQL schema should be defined before the database-backed API is completed.
- Shared TypeScript types and API contracts should be agreed on before frontend/backend integration.
- The listings API depends on the PostgreSQL schema.
- Frontend/database integration depends on both the schema and listings API.
- Authentication is required before protected listing, profile, and inquiry functionality can be completed.
- Shared layout and navigation should be established early so feature pages use a consistent structure.

## Team Coordination

The team will use Microsoft Teams for asynchronous progress updates and blockers during the week.

Team members should report:
- what they completed
- what they are currently working on
- any blockers or dependencies affecting their work

GitHub issues and pull requests will be used to track implementation and code review.