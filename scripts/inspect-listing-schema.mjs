import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const localEnvironment = fileURLToPath(new URL("../.env.local", import.meta.url));
if (existsSync(localEnvironment)) process.loadEnvFile(localEnvironment);

console.log(JSON.stringify({
    POSTGRES_URL: Boolean(process.env.POSTGRES_URL),
    AUTH_SECRET: Boolean(process.env.AUTH_SECRET),
}));

if (!process.env.POSTGRES_URL) {
    console.error("Schema inspection blocked: POSTGRES_URL is unavailable.");
    process.exitCode = 2;
} else {
    const sql = postgres(process.env.POSTGRES_URL, {
        ssl: "require",
        prepare: false,
        connect_timeout: 10,
    });
    try {
        // A read-only transaction prevents this diagnostic from changing data.
        const metadata = await sql.begin("READ ONLY", async (transaction) => {
            const columns = await transaction`
                SELECT table_name, column_name, data_type, udt_name,
                    character_maximum_length, numeric_precision, numeric_scale,
                    column_default, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public'
                    AND table_name IN ('listings', 'categories', 'inquiries')
                ORDER BY table_name, ordinal_position
            `;
            const constraints = await transaction`
                SELECT t.relname AS table_name, c.conname, c.contype,
                    pg_get_constraintdef(c.oid) AS definition
                FROM pg_constraint c
                JOIN pg_class t ON t.oid = c.conrelid
                JOIN pg_namespace n ON n.oid = t.relnamespace
                WHERE n.nspname = 'public'
                    AND t.relname IN ('listings', 'categories', 'inquiries')
                ORDER BY t.relname, c.conname
            `;
            const statusEnum = await transaction`
                SELECT e.enumlabel
                FROM pg_enum e
                JOIN pg_attribute a ON a.atttypid = e.enumtypid
                JOIN pg_class t ON t.oid = a.attrelid
                JOIN pg_namespace n ON n.oid = t.relnamespace
                WHERE n.nspname = 'public' AND t.relname = 'listings'
                    AND a.attname = 'status'
                ORDER BY e.enumsortorder
            `;
            return { columns, constraints, statusEnum };
        });
        console.log(JSON.stringify(metadata, null, 2));
    } catch (error) {
        // Connection messages may include connection details; report only the code.
        console.error("Schema inspection failed:", error.code || error.name);
        process.exitCode = 1;
    } finally {
        await sql.end({ timeout: 5 });
    }
}
