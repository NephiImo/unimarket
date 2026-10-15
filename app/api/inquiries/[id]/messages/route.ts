import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import {
    createInquiryMessage,
    getInquiryForParticipant,
    getInquiryMessages,
} from "@/app/lib/inquiries/queries";
import { isInquiryId, validateInquiryText } from "@/app/lib/inquiries/validation";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function GET(
    _request: Request,
    context: RouteContext,
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
        if (!isInquiryId(id) || !(await getInquiryForParticipant(id, user.id))) {
            return NextResponse.json(
                { error: "Inquiry not found or access denied." },
                { status: 404 },
            );
        }

        const messages = await getInquiryMessages(id, user.id);

        return NextResponse.json(messages);
    } catch (error) {
        console.error("Failed to load inquiry messages:", error);

        return NextResponse.json(
            { error: "Failed to load messages." },
            { status: 500 },
        );
    }
}

export async function POST(
    request: Request,
    context: RouteContext,
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
        if (!isInquiryId(id) || !(await getInquiryForParticipant(id, user.id))) {
            return NextResponse.json(
                { error: "Inquiry not found or access denied." },
                { status: 404 },
            );
        }

        const body: unknown = await request.json().catch(() => null);
        const { value: message, error } = validateInquiryText(body);
        if (message === null) {
            return NextResponse.json(
                { error },
                { status: 400 },
            );
        }

        const savedMessage = await createInquiryMessage(
            id,
            user.id,
            message,
        );

        if (!savedMessage) {
            return NextResponse.json(
                { error: "Inquiry not found or access denied." },
                { status: 404 },
            );
        }

        return NextResponse.json(savedMessage, { status: 201 });
    } catch (error) {
        console.error("Failed to send inquiry message:", error);

        return NextResponse.json(
            { error: "Failed to send message." },
            { status: 500 },
        );
    }
}
