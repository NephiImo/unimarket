import { NextRequest, NextResponse } from "next/server";
import { getReceivedInquiries } from "@/app/lib/inquiries/queries";

export async function GET(request: NextRequest) {
    try {
        const sellerId = request.headers.get("x-user-id");

        if (!sellerId) {
            return NextResponse.json(
                { error: "Authentication required." },
                { status: 401 },
            );
        }

        const inquiries = await getReceivedInquiries(sellerId);

        return NextResponse.json(inquiries, { status: 200 });
    } catch (error) {
        console.error("Failed to fetch received inquiries:", error);

        return NextResponse.json(
            { error: "Failed to fetch received inquiries." },
            { status: 500 },
        );
    }
}