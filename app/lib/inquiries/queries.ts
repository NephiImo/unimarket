
import sql from "@/app/lib/db";
import { isInquiryId, validateInquiryText } from "@/app/lib/inquiries/validation";

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
    seller_response: string | null;
    responded_at: Date | null;
};

export type SentInquiry = Inquiry & {
    listing_title: string;
    seller_name: string;
    seller_response: string | null;
    responded_at: Date | null;
};

export type InquiryListing = {
    id: string;
    user_id: string;
    title: string;
    status: string;
};

export type InquiryConversation = Inquiry & {
    listing_title: string;
    seller_id: string;
    seller_name: string;
    sender_name: string;
    seller_response: string | null;
    responded_at: Date | null;
};

export async function getInquiryForParticipant(
    inquiryId: string,
    userId: string,
): Promise<InquiryConversation | null> {
    if (!isInquiryId(inquiryId) || !isInquiryId(userId)) return null;

    const inquiries = await sql<InquiryConversation[]>`
        SELECT
            i.id, i.listing_id, i.sender_id, i.message, i.created_at,
            i.seller_response, i.responded_at,
            l.title AS listing_title, l.user_id AS seller_id,
            seller.name AS seller_name, buyer.name AS sender_name
        FROM inquiries i
        JOIN listings l ON l.id = i.listing_id
        JOIN users seller ON seller.id = l.user_id
        JOIN users buyer ON buyer.id = i.sender_id
        WHERE i.id = ${inquiryId}
            AND (i.sender_id = ${userId} OR l.user_id = ${userId})
        LIMIT 1
    `;

    return inquiries[0] ?? null;
}

export async function getInquiryListing(
    listingId: string,
): Promise<InquiryListing | null> {
    if (!isInquiryId(listingId)) return null;

    const listings = await sql<InquiryListing[]>`
        SELECT id, user_id, title, status
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
        RETURNING id, listing_id, sender_id, message, created_at
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
            i.seller_response,
            i.responded_at,
            l.title AS listing_title,
            u.name AS sender_name
        FROM inquiries i
        JOIN listings l ON l.id = i.listing_id
        JOIN users u ON u.id = i.sender_id
        WHERE l.user_id = ${sellerId}
        ORDER BY i.created_at DESC
    `;
}

export async function createSellerResponse(
    inquiryId: string,
    sellerId: string,
    response: string,
): Promise<ReceivedInquiry | null> {
    if (!isInquiryId(inquiryId) || !isInquiryId(sellerId)) return null;
    const { value } = validateInquiryText({ response }, "response");
    if (value === null) return null;

    const inquiries = await sql<ReceivedInquiry[]>`
        UPDATE inquiries AS i
        SET
            seller_response = ${value},
            responded_at = CURRENT_TIMESTAMP
        FROM listings AS l, users AS u
        WHERE i.id = ${inquiryId}
            AND l.id = i.listing_id
            AND l.user_id = ${sellerId}
            AND u.id = i.sender_id
            AND i.seller_response IS NULL
        RETURNING
            i.id,
            i.listing_id,
            i.sender_id,
            i.message,
            i.created_at,
            i.seller_response,
            i.responded_at,
            l.title AS listing_title,
            u.name AS sender_name
    `;

    return inquiries[0] ?? null;
}

export async function getSentInquiries(
    buyerId: string,
): Promise<SentInquiry[]> {
    return sql<SentInquiry[]>`
        SELECT
            i.id,
            i.listing_id,
            i.sender_id,
            i.message,
            i.created_at,
            i.seller_response,
            i.responded_at,
            l.title AS listing_title,
            u.name AS seller_name
        FROM inquiries i
        JOIN listings l ON l.id = i.listing_id
        JOIN users u ON u.id = l.user_id
        WHERE i.sender_id = ${buyerId}
        ORDER BY i.created_at DESC
    `;
}
export type InquiryMessage = {
    id: string;
    inquiry_id: string;
    sender_id: string;
    sender_name: string;
    message: string;
    created_at: Date;
};

export async function getInquiryMessages(
    inquiryId: string,
    userId: string,
): Promise<InquiryMessage[]> {
    if (!isInquiryId(inquiryId) || !isInquiryId(userId)) return [];

    return sql<InquiryMessage[]>`
        SELECT
            m.id,
            m.inquiry_id,
            m.sender_id,
            u.name AS sender_name,
            m.message,
            m.created_at
        FROM inquiry_messages m
        JOIN users u ON u.id = m.sender_id
        WHERE m.inquiry_id = ${inquiryId}
            AND EXISTS (
                SELECT 1
                FROM inquiries i
                JOIN listings l ON l.id = i.listing_id
                WHERE i.id = m.inquiry_id
                    AND (
                        i.sender_id = ${userId}
                        OR l.user_id = ${userId}
                    )
            )
        ORDER BY m.created_at ASC, m.id ASC
    `;
}

export async function createInquiryMessage(
    inquiryId: string,
    senderId: string,
    message: string,
): Promise<Omit<InquiryMessage, "sender_name"> | null> {
    if (!isInquiryId(inquiryId) || !isInquiryId(senderId)) return null;
    const { value } = validateInquiryText({ message });
    if (value === null) return null;

    const messages = await sql<Omit<InquiryMessage, "sender_name">[]>`
        INSERT INTO inquiry_messages (
            inquiry_id,
            sender_id,
            message
        )
        SELECT i.id, ${senderId}, ${value}
        FROM inquiries i
        JOIN listings l ON l.id = i.listing_id
        WHERE i.id = ${inquiryId}
            AND (
                i.sender_id = ${senderId}
                OR l.user_id = ${senderId}
            )
        RETURNING id, inquiry_id, sender_id, message, created_at
    `;

    return messages[0] ?? null;
}
