# UniMarket PostgreSQL Database Schema

## Overview

UniMarket uses PostgreSQL to store users, marketplace listings, categories, and inquiries.

The database contains four core tables:

* `users`
* `categories`
* `listings`
* `inquiries`

## Tables

### Users

Stores registered UniMarket users.

| Column          | Type         | Constraints                          |
| --------------- | ------------ | ------------------------------------ |
| `id`            | UUID         | Primary key, generated automatically |
| `name`          | VARCHAR(100) | Required                             |
| `email`         | VARCHAR(255) | Required, unique                     |
| `password_hash` | TEXT         | Required                             |
| `created_at`    | TIMESTAMP    | Required, defaults to current time   |

### Categories

Stores the categories available for marketplace listings.

| Column | Type         | Constraints      |
| ------ | ------------ | ---------------- |
| `id`   | SERIAL       | Primary key      |
| `name` | VARCHAR(100) | Required, unique |

Current categories include:

* Electronics
* Fashion
* Books
* Furniture
* Vehicles
* Food
* Other

### Listings

Stores items posted for sale by users.

| Column        | Type          | Constraints                          |
| ------------- | ------------- | ------------------------------------ |
| `id`          | UUID          | Primary key, generated automatically |
| `user_id`     | UUID          | Foreign key → `users.id`             |
| `category_id` | INTEGER       | Foreign key → `categories.id`        |
| `title`       | VARCHAR(150)  | Required                             |
| `description` | TEXT          | Required                             |
| `price`       | NUMERIC(10,2) | Required                             |
| `image_url`   | TEXT          | Optional                             |
| `location`    | VARCHAR(150)  | Required                             |
| `status`      | VARCHAR(20)   | Required, defaults to `active`       |
| `created_at`  | TIMESTAMP     | Required, defaults to current time   |

### Inquiries

Stores messages sent by users about marketplace listings.

| Column       | Type      | Constraints                          |
| ------------ | --------- | ------------------------------------ |
| `id`         | UUID      | Primary key, generated automatically |
| `listing_id` | UUID      | Foreign key → `listings.id`          |
| `sender_id`  | UUID      | Foreign key → `users.id`             |
| `message`    | TEXT      | Required                             |
| `created_at` | TIMESTAMP | Required, defaults to current time   |

## Relationships

```text
User
 ├── has many Listings
 └── sends many Inquiries

Category
 └── has many Listings

Listing
 └── receives many Inquiries
```

### Foreign Keys

* `listings.user_id` → `users.id`
* `listings.category_id` → `categories.id`
* `inquiries.listing_id` → `listings.id`
* `inquiries.sender_id` → `users.id`

## Authentication

The `users` table is the foundation for the application's future registration and login features.

New users will be created through the registration functionality and their generated `id` will be used to associate their listings and inquiries with their account.

Password values should be securely hashed by the authentication system before being stored in `password_hash`.

## Backend Usage

The backend can use these relationships to:

1. Create and authenticate users.
2. Create listings belonging to the authenticated user.
3. Organize listings by category.
4. Retrieve listings belonging to a specific user.
5. Allow users to send inquiries about listings.
6. Retrieve inquiries associated with a listing or user.
