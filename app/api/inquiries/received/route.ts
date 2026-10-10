import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { getReceivedInquiries } from "@/app/lib/inquiries/queries";

export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { error: "Authentication required." },
                { status: 401 },
            );
        }

        const inquiries = await getReceivedInquiries(user.id);

        return NextResponse.json(inquiries, { status: 200 });
    } catch (error) {
        console.error("Failed to fetch received inquiries:", error);

        return NextResponse.json(
            { error: "Failed to fetch received inquiries." },
            { status: 500 },
        );
    }
}
