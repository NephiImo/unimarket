# UniMarket

UniMarket is a student marketplace that helps university students buy and sell items within their school community. Students can browse listings, post items for sale, manage their listings, and communicate with interested buyers through inquiries and messaging.

## Team Members

- Okoro Osahon
- Nephi Imo
- Ariane Arias Peralta
- Assumpta Chidinma Okpanachi
- Martha Sibiya

## Project Description

Buying and selling within a student community can be inconvenient when listings and conversations are scattered across different platforms. UniMarket brings item discovery, listing management, and buyer-seller communication together in one application.

The application provides user accounts, searchable listings, listing management, profiles, and inquiry conversations. It is designed to make it easier for students to find items, advertise products, and communicate with potential buyers.

## Technology Stack

- **Frontend:** Next.js, React, TypeScript
- **Routing:** Next.js App Router
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL
- **Authentication and security:** Server-side authentication, password hashing with `bcryptjs`, and session/token utilities using `jose`
- **Code quality:** ESLint and Prettier
- **Version control:** Git and GitHub

## Core Features

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
- Access the user dashboard
- Manage personal listings and relevant account information

### Buyer and Seller Inquiries

- Send an inquiry about a listing
- View inquiries received by sellers
- Submit a seller response
- Continue conversations through inquiry messaging
- Restrict inquiry and messaging access to authorized participants

## Application Routes

The application uses the Next.js App Router. The following routes describe the main user-facing pages; verify the current implementation before treating this list as exhaustive.

| Route | Purpose |
|---|---|
| `/` | Home page |
| `/listings` | Browse and search listings |
| `/listings/[id]` | View listing details |
| `/listings/new` | Create a listing |
| `/listings/[id]/edit` | Edit a listing |
| `/dashboard` | User dashboard and profile |
| `/inquiries/sent` | View inquiries sent by the user |
| `/inquiries/received` | View inquiries received by the user |
| `/login` | Sign in |
| `/register` | Create an account |

## API Documentation

The API routes use the Next.js App Router to handle authentication, listing operations, inquiries, and messaging.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Authenticate a user |
| POST | `/api/auth/logout` | End the user's session |

### Listings

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/listings` | Retrieve listings |
| POST | `/api/listings` | Create a listing |
| GET | `/api/listings/[id]` | Retrieve a specific listing |
| PATCH | `/api/listings/[id]` | Update a listing |
| DELETE | `/api/listings/[id]` | Delete a listing |

### Inquiries and Messaging

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/listings/[id]/inquiries` | Send an inquiry about a listing |
| GET | `/api/inquiries/received` | Retrieve inquiries received by the current user |
| GET | `/api/inquiries/[id]/messages` | Retrieve messages in an inquiry conversation |
| POST | `/api/inquiries/[id]/messages` | Send a message in an inquiry conversation |
| POST | `/api/inquiries/[id]/response` | Submit a seller response |

Protected operations require appropriate authentication and authorization. Requests are validated on the server, and access to listings and inquiry conversations is restricted according to the user's permissions.

## Database and Data Model

UniMarket uses PostgreSQL to store application data.

### Users

Stores user account information, including identity and authentication-related data.

A user can own multiple listings and send multiple inquiries.

### Listings

Represents items advertised for sale.

Each listing belongs to a user and a category. A listing can receive multiple inquiries.

### Categories

Groups listings into categories so users can browse and discover relevant items.

### Inquiries

Represents a buyer's inquiry about a listing.

Each inquiry is associated with a listing and the user who sent it. Inquiries support communication between buyers and sellers.

### Inquiry Messages

The inquiry messaging feature uses an `inquiry_messages` table to store conversation messages, including the associated inquiry, sender, message content, and creation time.

Confirm that the database migration has been applied successfully in the target environment before relying on this table.

## Design and User Experience

UniMarket uses a warm, consistent visual style intended to make browsing and managing listings straightforward.

### Color Palette

- Soft Ivory: `#FFFDFC`
- Muted Terracotta: `#C96F52`
- Cocoa Brown: `#352B28`
- Muted Text: `#746963`
- Blush Peach: `#EBC8BA`

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

- Node.js
- npm
- Git
- Access to a PostgreSQL database

### Installation

Clone the team repository:

```bash
git clone <TEAM_REPOSITORY_URL>
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

Create a `.env.local` file in the project root and configure the PostgreSQL connection:

```env
POSTGRES_URL=your_postgresql_connection_string
```

Configure any additional authentication or deployment environment variables required by the current application code.

Use the correct credentials for your development database. Never commit `.env.local`, database passwords, session secrets, or other sensitive values to GitHub.

### Database Setup

Ensure the PostgreSQL database is available and that the application's required schema and migrations have been applied before testing database-dependent features.

Use the project's existing database setup and migration scripts. Check the relevant scripts and project instructions before running migrations.

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

Run the database integration tests when the test database and required environment variables are configured:

```bash
npm run test:db
```

Run ESLint:

```bash
npm run lint
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

1. Configure the required environment variables in the hosting provider.
2. Ensure the production database schema and migrations are up to date.
3. Run the production build and resolve any build errors.
4. Deploy the application.
5. Test registration, login, logout, listing operations, inquiries, and messaging on the deployed application.

**Live application:** [Add the public deployment URL] (Waiting for you Nephi)

**GitHub repository: https://github.com/NephiImo/unimarket

## Known Issues and Future Improvements

Potential areas for continued improvement include:

- Improving Lighthouse performance and accessibility scores.
- Testing responsive layouts across different mobile screen sizes.
- Expanding automated tests for authentication, listing operations, and inquiry messaging.
- Improving the messaging experience and adding useful conversation-management features.

These are potential improvement areas, not a confirmed list of outstanding defects. Update this section to reflect the issues and improvements that remain after the final application review.

## Project Maintenance

The team uses GitHub branches, issues, and pull requests to organize development and review code changes. Microsoft Teams is used for progress updates and discussion of blockers.

Changes should be tested before merging. The README should be kept up to date as features, routes, database structure, setup requirements, and deployment details change.