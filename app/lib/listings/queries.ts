import sql from "@/app/lib/db";

export type Listing = {
    id: string;
    user_id: string;
    category_id: number;
    title: string;
    description: string;
    price: number;
    image_url: string | null;
    location: string;
    status: string;
    created_at: Date;
    category_name?: string;
};

export type CreateListingInput = {
    userId: string;
    categoryId: number;
    title: string;
    description: string;
    price: number;
    imageUrl?: string | null;
    location: string;
};

export type UpdateListingInput = {
    categoryId?: number;
    title?: string;
    description?: string;
    price?: number;
    imageUrl?: string | null;
    location?: string;
    status?: string;
};

export async function getListings(
    search?: string,
    categoryId?: number,
): Promise<Listing[]> {
    if (search && categoryId) {
        return sql<Listing[]>`
      SELECT
        l.*,
        c.name AS category_name
      FROM listings l
      JOIN categories c ON c.id = l.category_id
      WHERE l.title ILIKE ${"%" + search + "%"}
        AND l.category_id = ${categoryId}
      ORDER BY l.created_at DESC
    `;
    }

    if (search) {
        return sql<Listing[]>`
      SELECT
        l.*,
        c.name AS category_name
      FROM listings l
      JOIN categories c ON c.id = l.category_id
      WHERE l.title ILIKE ${"%" + search + "%"}
      ORDER BY l.created_at DESC
    `;
    }

    if (categoryId) {
        return sql<Listing[]>`
      SELECT
        l.*,
        c.name AS category_name
      FROM listings l
      JOIN categories c ON c.id = l.category_id
      WHERE l.category_id = ${categoryId}
      ORDER BY l.created_at DESC
    `;
    }

    return sql<Listing[]>`
    SELECT
      l.*,
      c.name AS category_name
    FROM listings l
    JOIN categories c ON c.id = l.category_id
    ORDER BY l.created_at DESC
  `;
}

export async function getListingById(
    id: string,
): Promise<Listing | null> {
    const listings = await sql<Listing[]>`
    SELECT
      l.*,
      c.name AS category_name
    FROM listings l
    JOIN categories c ON c.id = l.category_id
    WHERE l.id = ${id}
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
      location
    )
    VALUES (
      ${input.userId},
      ${input.categoryId},
      ${input.title},
      ${input.description},
      ${input.price},
      ${input.imageUrl ?? null},
      ${input.location}
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
    const listings = await sql<Listing[]>`
    UPDATE listings
    SET
      category_id = COALESCE(${input.categoryId ?? null}, category_id),
      title = COALESCE(${input.title ?? null}, title),
      description = COALESCE(${input.description ?? null}, description),
      price = COALESCE(${input.price ?? null}, price),
      image_url = COALESCE(${input.imageUrl ?? null}, image_url),
      location = COALESCE(${input.location ?? null}, location),
      status = COALESCE(${input.status ?? null}, status)
    WHERE id = ${id}
      AND user_id = ${userId}
    RETURNING *
  `;

    return listings[0] ?? null;
}

export async function deleteListing(
    id: string,
    userId: string,
): Promise<boolean> {
    const result = await sql`
    DELETE FROM listings
    WHERE id = ${id}
      AND user_id = ${userId}
  `;

    return result.count > 0;
}