import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
    createUser,
    getUserByEmail,
} from "@/app/lib/auth/queries";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { name, email, password } = body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof email !== "string" ||
            !email.trim() ||
            typeof password !== "string" ||
            !password
        ) {
            return NextResponse.json(
                { error: "Name, email, and password are required." },
                { status: 400 },
            );
        }

        const trimmedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await getUserByEmail(normalizedEmail);

        if (existingUser) {
            return NextResponse.json(
                { error: "An account with this email already exists." },
                { status: 409 },
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await createUser(
            trimmedName,
            normalizedEmail,
            passwordHash,
        );

        return NextResponse.json(
            {
                message: "Account created successfully.",
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("Failed to register user:", error);

        return NextResponse.json(
            { error: "Failed to create account." },
            { status: 500 },
        );
    }
}