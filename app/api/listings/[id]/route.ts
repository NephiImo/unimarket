import { NextRequest, NextResponse } from "next/server";
import {
    deleteListing,
    getListingById,
    updateListing,
} from "@/app/lib/listings/queries";

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
        const userId = request.headers.get("x-user-id");

        if (!userId) {
            return NextResponse.json(
                { error: "Authentication required." },
                { status: 401 },
            );
        }

        const { id } = await context.params;
        const body = await request.json();

        const {
            categoryId,
            title,
            description,
            price,
            imageUrl,
            location,
            status,
        } = body;

        if (
            categoryId !== undefined &&
            (!Number.isInteger(categoryId) || categoryId <= 0)
        ) {
            return NextResponse.json(
                { error: "Invalid category ID." },
                { status: 400 },
            );
        }

        if (
            title !== undefined &&
            (typeof title !== "string" || !title.trim())
        ) {
            return NextResponse.json(
                { error: "Invalid title." },
                { status: 400 },
            );
        }

        if (
            description !== undefined &&
            (typeof description !== "string" || !description.trim())
        ) {
            return NextResponse.json(
                { error: "Invalid description." },
                { status: 400 },
            );
        }

        if (
            price !== undefined &&
            (typeof price !== "number" || price < 0)
        ) {
            return NextResponse.json(
                { error: "Invalid price." },
                { status: 400 },
            );
        }

        if (
            location !== undefined &&
            (typeof location !== "string" || !location.trim())
        ) {
            return NextResponse.json(
                { error: "Invalid location." },
                { status: 400 },
            );
        }

        if (
            imageUrl !== undefined &&
            imageUrl !== null &&
            typeof imageUrl !== "string"
        ) {
            return NextResponse.json(
                { error: "Invalid image URL." },
                { status: 400 },
            );
        }

        if (
            status !== undefined &&
            (typeof status !== "string" || !status.trim())
        ) {
            return NextResponse.json(
                { error: "Invalid status." },
                { status: 400 },
            );
        }

        const listing = await updateListing(id, userId, {
            categoryId,
            title: title?.trim(),
            description: description?.trim(),
            price,
            imageUrl,
            location: location?.trim(),
            status: status?.trim(),
        });

        if (!listing) {
            const existingListing = await getListingById(id);

            if (!existingListing) {
                return NextResponse.json(
                    { error: "Listing not found." },
                    { status: 404 },
                );
            }

            return NextResponse.json(
                { error: "You do not have permission to update this listing." },
                { status: 403 },
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
    request: NextRequest,
    context: RouteContext,
) {
    try {
        const userId = request.headers.get("x-user-id");

        if (!userId) {
            return NextResponse.json(
                { error: "Authentication required." },
                { status: 401 },
            );
        }

        const { id } = await context.params;

        const deleted = await deleteListing(id, userId);

        if (!deleted) {
            const existingListing = await getListingById(id);

            if (!existingListing) {
                return NextResponse.json(
                    { error: "Listing not found." },
                    { status: 404 },
                );
            }

            return NextResponse.json(
                { error: "You do not have permission to delete this listing." },
                { status: 403 },
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