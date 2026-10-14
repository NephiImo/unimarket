
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { createSellerResponse } from "@/app/lib/inquiries/queries";

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
        const body = await request.json();

        if (typeof body.response !== "string") {
            return NextResponse.json(
                { error: "A response message is required." },
                { status: 400 },
            );
        }

        const response = body.response.trim();

        if (!response || response.length > 2000) {
            return NextResponse.json(
                { error: "Response must be between 1 and 2000 characters." },
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
