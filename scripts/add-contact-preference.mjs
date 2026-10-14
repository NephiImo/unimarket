
import postgres from "postgres";
import { existsSync } from "node:fs";

if (existsSync(".env.local")) {
    process.loadEnvFile(".env.local");
}

if (!process.env.POSTGRES_URL) {
    console.error("POSTGRES_URL is missing from .env.local or the environment.");
    process.exit(1);
}

const sql = postgres(process.env.POSTGRES_URL, {
    ssl: "require",
    prepare: false,
});

try {
    await sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS contact_preference
        VARCHAR(20) NOT NULL DEFAULT 'email'
        CHECK (contact_preference IN ('email', 'in_app'))
    `;

    console.log("Contact preference column is ready.");
} catch (error) {
    console.error("Failed to update the users table:", error);
    process.exitCode = 1;
} finally {
    await sql.end();
}
