import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/app/lib/auth/queries";
import { createSessionToken } from "@/app/lib/auth/session";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { email, password } = body;

        if (
            typeof email !== "string" ||
            !email.trim() ||
            typeof password !== "string" ||
            !password
        ) {
            return NextResponse.json(
                { error: "Invalid email or password." },
                { status: 401 },
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await getUserByEmail(normalizedEmail);

        if (!user) {
            return NextResponse.json(
                { error: "Invalid email or password." },
                { status: 401 },
            );
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash,
        );

        if (!passwordMatches) {
            return NextResponse.json(
                { error: "Invalid email or password." },
                { status: 401 },
            );
        }

        const sessionToken = await createSessionToken(user.id);

        const response = NextResponse.json({
            message: "Login successful.",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });

        response.cookies.set("session", sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Failed to log in user:", error);

        return NextResponse.json(
            { error: "Failed to log in." },
            { status: 500 },
        );
    }
}