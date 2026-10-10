import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { NextRequest, NextResponse } from "next/server";
import {
    categoryExists,
    createListing,
    getListings,
} from "@/app/lib/listings/queries";
import { validateListingInput } from "@/app/lib/listings/validation";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        const search =
            searchParams.get("query")?.trim() ||
            searchParams.get("search")?.trim() ||
            undefined;
        const categoryName =
            searchParams.get("category")?.trim() || undefined;

        const listings = await getListings(search, categoryName);

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
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { error: "Authentication required." },
                { status: 401 },
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

        const { data, errors } = validateListingInput(body);
        if (!data) {
            return NextResponse.json(
                { error: "Check the listing details and try again.", errors },
                { status: 400 },
            );
        }

        if (!(await categoryExists(data.categoryId))) {
            return NextResponse.json(
                {
                    error: "Select an available category.",
                    errors: { categoryId: "This category is no longer available." },
                },
                { status: 400 },
            );
        }

        const listing = await createListing({
            ...data,
            userId: user.id,
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
