
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { createSellerResponse, getInquiryForParticipant } from "@/app/lib/inquiries/queries";
import { isInquiryId, validateInquiryText } from "@/app/lib/inquiries/validation";

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { error: "Authentication required." },
                { status: 401 },
            );
        }

        const { id } = await context.params;
        if (!isInquiryId(id)) {
            return NextResponse.json(
                { error: "Inquiry not found or access denied." },
                { status: 404 },
            );
        }

        const conversation = await getInquiryForParticipant(id, user.id);
        if (!conversation || conversation.seller_id !== user.id) {
            return NextResponse.json(
                { error: "Inquiry not found or access denied." },
                { status: 404 },
            );
        }

        const body: unknown = await request.json().catch(() => null);
        const { value: response, error } = validateInquiryText(body, "response");
        if (response === null) {
            return NextResponse.json(
                { error },
                { status: 400 },
            );
        }

        const inquiry = await createSellerResponse(
            id,
            user.id,
            response,
        );

        if (!inquiry) {
            return NextResponse.json(
                {
                    error:
                        "Inquiry not found, access denied, or a response already exists.",
                },
                { status: 404 },
            );
        }

        return NextResponse.json(inquiry, { status: 201 });
    } catch (error) {
        console.error("Failed to submit seller response:", error);

        return NextResponse.json(
            { error: "Failed to submit seller response." },
            { status: 500 },
        );
    }
}
