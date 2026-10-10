import sql from "@/app/lib/db";
import {
    isListingId,
    type ListingInput,
    type ListingStatus,
} from "@/app/lib/listings/validation";

export type Category = {
    id: number;
    name: string;
};

export type Listing = {
    id: string;
    user_id: string;
    category_id: number;
    title: string;
    description: string;
    price: number;
    image_url: string | null;
    location: string;
    status: ListingStatus;
    created_at: Date;
    category_name?: string;
    seller_name?: string;
};

export type CreateListingInput = ListingInput & {
    userId: string;
};

export type UpdateListingInput = Partial<ListingInput>;

export async function getCategories(): Promise<Category[]> {
    return sql<Category[]>`SELECT id, name FROM categories ORDER BY name`;
}

export async function categoryExists(id: number): Promise<boolean> {
    const categories = await sql<{ id: number }[]>`
        SELECT id FROM categories WHERE id = ${id} LIMIT 1
    `;
    return categories.length > 0;
}

export async function getListingsByUserId(userId: string): Promise<Listing[]> {
    return sql<Listing[]>`
        SELECT l.*, c.name AS category_name
        FROM listings l
        JOIN categories c ON c.id = l.category_id
        WHERE l.user_id = ${userId} AND l.status <> 'deleted'
        ORDER BY l.created_at DESC
    `;
}

export async function getListings(
    search?: string,
    categoryName?: string,
): Promise<Listing[]> {
    if (search && categoryName) {
        return sql<Listing[]>`
      SELECT
        l.*,
        c.name AS category_name,
        u.name AS seller_name
      FROM listings l
      JOIN categories c ON c.id = l.category_id
      JOIN users u ON u.id = l.user_id
      WHERE l.status = 'active'
        AND l.title ILIKE ${"%" + search + "%"}
        AND c.name ILIKE ${categoryName}
      ORDER BY l.created_at DESC
    `;
    }

    if (search) {
        return sql<Listing[]>`
      SELECT
        l.*,
        c.name AS category_name,
        u.name AS seller_name
      FROM listings l
      JOIN categories c ON c.id = l.category_id
      JOIN users u ON u.id = l.user_id
      WHERE l.status = 'active'
        AND l.title ILIKE ${"%" + search + "%"}
      ORDER BY l.created_at DESC
    `;
    }

    if (categoryName) {
        return sql<Listing[]>`
      SELECT
        l.*,
        c.name AS category_name,
        u.name AS seller_name
      FROM listings l
      JOIN categories c ON c.id = l.category_id
      JOIN users u ON u.id = l.user_id
      WHERE l.status = 'active'
        AND c.name ILIKE ${categoryName}
      ORDER BY l.created_at DESC
    `;
    }

    return sql<Listing[]>`
    SELECT
      l.*,
      c.name AS category_name,
      u.name AS seller_name
    FROM listings l
    JOIN categories c ON c.id = l.category_id
    JOIN users u ON u.id = l.user_id
    WHERE l.status = 'active'
    ORDER BY l.created_at DESC
  `;
}

export async function getListingById(
    id: string,
): Promise<Listing | null> {
    if (!isListingId(id)) return null;

    const listings = await sql<Listing[]>`
    SELECT
      l.*,
      c.name AS category_name,
      u.name AS seller_name
    FROM listings l
    JOIN categories c ON c.id = l.category_id
    JOIN users u ON u.id = l.user_id
    WHERE l.id = ${id} AND l.status <> 'deleted'
    LIMIT 1
  `;

    return listings[0] ?? null;
}

export async function createListing(
    input: CreateListingInput,
): Promise<Listing> {
    const listings = await sql<Listing[]>`
    INSERT INTO listings (
      user_id,
      category_id,
      title,
      description,
      price,
      image_url,
      location,
      status
    )
    VALUES (
      ${input.userId},
      ${input.categoryId},
      ${input.title},
      ${input.description},
      ${input.price},
      ${input.imageUrl ?? null},
      ${input.location},
      ${input.status}
    )
    RETURNING *
  `;

    return listings[0];
}

export async function updateListing(
    id: string,
    userId: string,
    input: UpdateListingInput,
): Promise<Listing | null> {
    if (!isListingId(id)) return null;

    const listings = await sql<Listing[]>`
    UPDATE listings
    SET
      category_id = COALESCE(${input.categoryId ?? null}, category_id),
      title = COALESCE(${input.title ?? null}, title),
      description = COALESCE(${input.description ?? null}, description),
      price = COALESCE(${input.price ?? null}, price),
      image_url = CASE
        WHEN ${Object.prototype.hasOwnProperty.call(input, "imageUrl")}
        THEN ${input.imageUrl ?? null}
        ELSE image_url
      END,
      location = COALESCE(${input.location ?? null}, location),
      status = COALESCE(${input.status ?? null}, status)
    WHERE id = ${id}
      AND user_id = ${userId}
      AND status <> 'deleted'
    RETURNING *
  `;

    return listings[0] ?? null;
}

export async function deleteListing(
    id: string,
    userId: string,
): Promise<boolean> {
    if (!isListingId(id)) return false;

    const result = await sql`
    UPDATE listings
    SET status = 'deleted'
    WHERE id = ${id}
      AND user_id = ${userId}
      AND status <> 'deleted'
  `;

    return result.count > 0;
}
