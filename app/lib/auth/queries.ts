import sql from "@/app/lib/db";

export type User = {
    id: string;
    name: string;
    email: string;
    password_hash: string;
    created_at: Date;
};

export async function getUserByEmail(
    email: string,
): Promise<User | null> {
    const users = await sql<User[]>`
        SELECT
            id,
            name,
            email,
            password_hash,
            created_at
        FROM users
        WHERE email = ${email}
        LIMIT 1
    `;

    return users[0] ?? null;
}

export async function createUser(
    name: string,
    email: string,
    passwordHash: string,
): Promise<User> {
    const users = await sql<User[]>`
        INSERT INTO users (
            name,
            email,
            password_hash
        )
        VALUES (
            ${name},
            ${email},
            ${passwordHash}
        )
        RETURNING
            id,
            name,
            email,
            password_hash,
            created_at
    `;

    return users[0];
}