import sql from "@/app/lib/db";

export type Inquiry = {
    id: string;
    listing_id: string;
    sender_id: string;
    message: string;
    created_at: Date;
};

export type ReceivedInquiry = Inquiry & {
    listing_title: string;
    sender_name: string;
};

export type InquiryListing = {
    id: string;
    user_id: string;
    title: string;
    status: string;
};

export async function getInquiryListing(
    listingId: string,
): Promise<InquiryListing | null> {
    const listings = await sql<InquiryListing[]>`
        SELECT
            id,
            user_id,
            title,
            status
        FROM listings
        WHERE id = ${listingId}
        LIMIT 1
    `;

    return listings[0] ?? null;
}

export async function createInquiry(
    listingId: string,
    senderId: string,
    message: string,
): Promise<Inquiry> {
    const inquiries = await sql<Inquiry[]>`
        INSERT INTO inquiries (
            listing_id,
            sender_id,
            message
        )
        VALUES (
            ${listingId},
            ${senderId},
            ${message}
        )
        RETURNING
            id,
            listing_id,
            sender_id,
            message,
            created_at
    `;

    return inquiries[0];
}

export async function getReceivedInquiries(
    sellerId: string,
): Promise<ReceivedInquiry[]> {
    return sql<ReceivedInquiry[]>`
        SELECT
            i.id,
            i.listing_id,
            i.sender_id,
            i.message,
            i.created_at,
            l.title AS listing_title,
            u.name AS sender_name
        FROM inquiries i
        JOIN listings l ON l.id = i.listing_id
        JOIN users u ON u.id = i.sender_id
        WHERE l.user_id = ${sellerId}
        ORDER BY i.created_at DESC
    `;
}