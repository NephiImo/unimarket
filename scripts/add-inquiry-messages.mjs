import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const localEnvironment = fileURLToPath(
    new URL("../.env.local", import.meta.url),
);

if (existsSync(localEnvironment)) {
    process.loadEnvFile(localEnvironment);
}

if (!process.env.POSTGRES_URL) {
    console.error("Migration failed: POSTGRES_URL is unavailable.");
    process.exitCode = 2;
} else {
    const sql = postgres(process.env.POSTGRES_URL, {
        ssl: "require",
        prepare: false,
        connect_timeout: 10,
    });

    try {
        console.log("Connecting to the database...");

        await sql`
            CREATE TABLE IF NOT EXISTS inquiry_messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                inquiry_id UUID NOT NULL
                    REFERENCES inquiries(id) ON DELETE CASCADE,
                sender_id UUID NOT NULL
                    REFERENCES users(id) ON DELETE CASCADE,
                message TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await sql`
            CREATE INDEX IF NOT EXISTS inquiry_messages_inquiry_id_idx
            ON inquiry_messages(inquiry_id, created_at)
        `;

        const result = await sql`
            SELECT to_regclass('public.inquiry_messages') AS table_name
        `;

        if (!result[0]?.table_name) {
            throw new Error("The table was not found after creation.");
        }

        console.log("SUCCESS: inquiry_messages table exists.");
    } catch (error) {
        console.error(
            "Migration failed:",
            error instanceof Error ? error.message : error,
        );
        process.exitCode = 1;
    } finally {
        await sql.end({ timeout: 5 });
    }
}