
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
        await sql`
            ALTER TABLE inquiries
            ADD COLUMN IF NOT EXISTS seller_response TEXT
        `;

        await sql`
            ALTER TABLE inquiries
            ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP
        `;

        console.log("Inquiry response columns added successfully.");
    } catch (error) {
        console.error("Migration failed:", error.code || error.name);
        process.exitCode = 1;
    } finally {
        await sql.end({ timeout: 5 });
    }
}
