import { NextRequest, NextResponse } from "next/server";
import {
    createInquiry,
    getInquiryListing,
} from "@/app/lib/inquiries/queries";

type RouteContext = {
    params: Promise<{ id: string }>;
};

const MAX_MESSAGE_LENGTH = 1000;

export async function POST(
    request: NextRequest,
    context: RouteContext,
) {
    try {
        const senderId = request.headers.get("x-user-id");

        if (!senderId) {
            return NextResponse.json(
                { error: "Authentication required." },
                { status: 401 },
            );
        }

        const { id } = await context.params;
        const body = await request.json();
        const { message } = body;

        if (typeof message !== "string" || !message.trim()) {
            return NextResponse.json(
                { error: "Inquiry message is required." },
                { status: 400 },
            );
        }

        const trimmedMessage = message.trim();

        if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
            return NextResponse.json(
                {
                    error: `Inquiry message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`,
                },
                { status: 400 },
            );
        }

        const listing = await getInquiryListing(id);

        if (!listing) {
            return NextResponse.json(
                { error: "Listing not found." },
                { status: 404 },
            );
        }

        if (listing.status !== "active") {
            return NextResponse.json(
                { error: "Inquiries can only be sent for active listings." },
                { status: 400 },
            );
        }

        if (listing.user_id === senderId) {
            return NextResponse.json(
                { error: "You cannot send an inquiry about your own listing." },
                { status: 400 },
            );
        }

        const inquiry = await createInquiry(
            id,
            senderId,
            trimmedMessage,
        );

        return NextResponse.json(inquiry, { status: 201 });
    } catch (error) {
        console.error("Failed to create inquiry:", error);

        return NextResponse.json(
            { error: "Failed to send inquiry." },
            { status: 500 },
        );
    }
}