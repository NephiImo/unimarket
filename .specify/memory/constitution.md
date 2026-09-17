# UniMarket Constitution

## Core Principles

### I. TypeScript Strictness (NON-NEGOTIABLE)

All application code is written in TypeScript with `strict` mode enabled.
`any` is not allowed. Prefer explicit interfaces or type aliases for props,
API payloads, and database records. Unknown incoming data is validated
before it is treated as a known type.

### II. Next.js App Router First

Use the App Router and file-based routing under `app/`. Default to Server
Components. Add `"use client"` only when the component needs browser APIs,
local state, or event handlers. Route handlers live in `app/api/` and are
named by resource (`app/api/listings/route.ts`).

### III. Tailwind Utility-First

Style with Tailwind utility classes. Do not add custom CSS unless a utility
cannot express the design. Keep design tokens (colors, spacing, type scale)
consistent. Avoid unused CSS and one-off hex values that break contrast.

### IV. Component Extraction

Reusable UI is extracted into typed components (`components/`). Props are
typed with interfaces. Semantic HTML is required: `header`, `nav`, `main`,
`article`, `footer`, `button`, `label`. Every interactive control has an
accessible name.

### V. Small, Reviewable Changes

Work happens on feature branches. Pull requests stay small enough to review
in one sitting. Every PR explains what changed and how to verify it. At
least one teammate must approve before merge into `main`.

## Technology Constraints

Required stack for this course project:

- Next.js (App Router)
- TypeScript (strict, no `any`)
- Tailwind CSS (utility-first)
- Node.js API route handlers under `app/api/`
- Persistent data store to be selected in Week 03 (Prisma + SQLite or
  equivalent is acceptable for MVP)

Testing expectations for later weeks:

- Unit tests for validation helpers and mapping functions
- Route-handler tests for happy path and 4xx validation errors
- Manual checklist for each user story before a story is marked Done

Naming conventions:

- Files: `kebab-case` for routes and utilities, `PascalCase` for components
- Components: `ListingCard.tsx`, `SignInForm.tsx`
- Branches: `feature/user-auth`, `feature/create-listing`, `fix/contrast`
- Issues: prefix with area, e.g. `[auth]`, `[listings]`, `[docs]`

## Team Collaboration

- `main` is protected. No direct pushes.
- All work ships through pull requests reviewed by at least one other member.
- Issues are the source of truth. Do not start work that is not on the board.
- Communicate blockers in Microsoft Teams the same day they appear.
- Constitution changes require a PR and agreement from at least two members.

## Governance

This constitution governs implementation choices. If generated Spec-Kit
content conflicts with this document or with the course stack, this
constitution and the course requirements win. Complexity must be justified
in the PR description.

**Version**: 1.0.0 | **Ratified**: 2026-09-16 | **Last Amended**: 2026-09-16
