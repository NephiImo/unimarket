import { NextRequest, NextResponse } from "next/server";
import {
    createListing,
    getListings,
} from "@/app/lib/listings/queries";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        const search = searchParams.get("search")?.trim() || undefined;
        const categoryParam = searchParams.get("category");

        let categoryId: number | undefined;

        if (categoryParam) {
            categoryId = Number(categoryParam);

            if (!Number.isInteger(categoryId) || categoryId <= 0) {
                return NextResponse.json(
                    { error: "Category must be a positive integer." },
                    { status: 400 },
                );
            }
        }

        const listings = await getListings(search, categoryId);

        return NextResponse.json(listings, { status: 200 });
    } catch (error) {
        console.error("Failed to fetch listings:", error);

        return NextResponse.json(
            { error: "Failed to fetch listings." },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");

        if (!userId) {
            return NextResponse.json(
                { error: "Authentication required." },
                { status: 401 },
            );
        }

        const body = await request.json();

        const {
            categoryId,
            title,
            description,
            price,
            imageUrl,
            location,
        } = body;

        if (
            !Number.isInteger(categoryId) ||
            categoryId <= 0 ||
            typeof title !== "string" ||
            !title.trim() ||
            typeof description !== "string" ||
            !description.trim() ||
            typeof price !== "number" ||
            price < 0 ||
            typeof location !== "string" ||
            !location.trim()
        ) {
            return NextResponse.json(
                { error: "Invalid listing data." },
                { status: 400 },
            );
        }

        const listing = await createListing({
            userId,
            categoryId,
            title: title.trim(),
            description: description.trim(),
            price,
            imageUrl: imageUrl ?? null,
            location: location.trim(),
        });

        return NextResponse.json(listing, { status: 201 });
    } catch (error) {
        console.error("Failed to create listing:", error);

        return NextResponse.json(
            { error: "Failed to create listing." },
            { status: 500 },
        );
    }
}