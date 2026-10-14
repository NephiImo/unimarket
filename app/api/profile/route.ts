import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import sql from "@/app/lib/db";

const allowedContactPreferences = ["email", "in_app"];

export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { error: "You must be signed in to view your profile." },
                { status: 401 }
            );
        }

        const profiles = await sql`
            SELECT id, name, email, contact_preference
            FROM users
            WHERE id = ${user.id}
            LIMIT 1
        `;

        if (profiles.length === 0) {
            return NextResponse.json(
                { error: "Profile not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({ profile: profiles[0] });
    } catch (error) {
        console.error("Failed to load profile:", error);

        return NextResponse.json(
            { error: "Unable to load your profile." },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { error: "You must be signed in to update your profile." },
                { status: 401 }
            );
        }

        const body = await request.json().catch(() => null);

        if (!body || typeof body !== "object" || Array.isArray(body)) {
            return NextResponse.json(
                { error: "Please provide valid profile information." },
                { status: 400 }
            );
        }

        const name =
            typeof body.name === "string" ? body.name.trim() : "";
        const contactPreference = body.contactPreference;

        if (!name || name.length > 100) {
            return NextResponse.json(
                { error: "Display name must be between 1 and 100 characters." },
                { status: 400 }
            );
        }

        if (
            typeof contactPreference !== "string" ||
            !allowedContactPreferences.includes(contactPreference)
        ) {
            return NextResponse.json(
                { error: "Please select a valid contact preference." },
                { status: 400 }
            );
        }

        const profiles = await sql`
            UPDATE users
            SET
                name = ${name},
                contact_preference = ${contactPreference}
            WHERE id = ${user.id}
            RETURNING id, name, email, contact_preference
        `;

        if (profiles.length === 0) {
            return NextResponse.json(
                { error: "Profile not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({ profile: profiles[0] });
    } catch (error) {
        console.error("Failed to update profile:", error);

        return NextResponse.json(
            { error: "Unable to update your profile." },
            { status: 500 }
        );
    }
}