import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import {
    categoryExists,
    deleteListing,
    getListingById,
    updateListing,
} from "@/app/lib/listings/queries";
import { validateListingInput } from "@/app/lib/listings/validation";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function GET(
    _request: NextRequest,
    context: RouteContext,
) {
    try {
        const { id } = await context.params;
        const listing = await getListingById(id);

        if (!listing) {
            return NextResponse.json(
                { error: "Listing not found." },
                { status: 404 },
            );
        }

        return NextResponse.json(listing, { status: 200 });
    } catch (error) {
        console.error("Failed to fetch listing:", error);
        return NextResponse.json(
            { error: "Failed to fetch listing." },
            { status: 500 },
        );
    }
}

export async function PATCH(
    request: NextRequest,
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
        const existingListing = await getListingById(id);
        if (!existingListing) {
            return NextResponse.json(
                { error: "Listing not found." },
                { status: 404 },
            );
        }
        if (existingListing.user_id !== user.id) {
            return NextResponse.json(
                { error: "You do not have permission to update this listing." },
                { status: 403 },
            );
        }

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: "Send listing details as valid JSON." },
                { status: 400 },
            );
        }

        const { data, errors } = validateListingInput(body, true);
        if (!data) {
            return NextResponse.json(
                { error: "Check the listing details and try again.", errors },
                { status: 400 },
            );
        }

        if (data.categoryId !== undefined && !(await categoryExists(data.categoryId))) {
            return NextResponse.json(
                {
                    error: "Select an available category.",
                    errors: { categoryId: "This category is no longer available." },
                },
                { status: 400 },
            );
        }

        // Ownership and the deletion guard are checked again in the UPDATE itself.
        const listing = await updateListing(id, user.id, data);
        if (!listing) {
            return NextResponse.json(
                { error: "Listing not found." },
                { status: 404 },
            );
        }
        return NextResponse.json(listing, { status: 200 });
    } catch (error) {
        console.error("Failed to update listing:", error);
        return NextResponse.json(
            { error: "Failed to update listing." },
            { status: 500 },
        );
    }
}

export async function DELETE(
    _request: NextRequest,
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
        const existingListing = await getListingById(id);
        if (!existingListing) {
            return NextResponse.json(
                { error: "Listing not found." },
                { status: 404 },
            );
        }
        if (existingListing.user_id !== user.id) {
            return NextResponse.json(
                { error: "You do not have permission to delete this listing." },
                { status: 403 },
            );
        }

        // Keep the row so existing inquiries retain their listing reference.
        const deleted = await deleteListing(id, user.id);
        if (!deleted) {
            return NextResponse.json(
                { error: "Listing not found." },
                { status: 404 },
            );
        }
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Failed to delete listing:", error);
        return NextResponse.json(
            { error: "Failed to delete listing." },
            { status: 500 },
        );
    }
}
