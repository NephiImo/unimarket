
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

class SchemaMismatchError extends Error {
    name = "SchemaMismatchError";
}

export function assertInquiryResponseColumns(columns) {
    for (const [name, type] of [
        ["seller_response", "text"],
        ["responded_at", "timestamp without time zone"],
    ]) {
        const column = columns.find((item) => item.column_name === name);
        if (!column || column.data_type !== type || column.is_nullable !== "YES"
            || (column.column_default !== null && !/^NULL(?:::[a-z ]+)?$/i.test(column.column_default))) {
            throw new SchemaMismatchError(`Incompatible public.inquiries schema: ${name} must be nullable ${type} with no non-null default.`);
        }
    }
}

export async function migrateInquiryResponses(sql) {
    await sql.begin(async (transaction) => {
        await transaction`SET LOCAL lock_timeout = '5s'`;
        await transaction`SET LOCAL statement_timeout = '30s'`;
        await transaction`
            ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS seller_response TEXT
        `;
        await transaction`
            ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP
        `;
        const columns = await transaction`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'inquiries'
                AND column_name IN ('seller_response', 'responded_at')
        `;
        assertInquiryResponseColumns(columns);
    });
}

async function main() {
    const localEnvironment = fileURLToPath(new URL("../.env.local", import.meta.url));
    if (existsSync(localEnvironment)) process.loadEnvFile(localEnvironment);
    if (!process.env.POSTGRES_URL) {
        console.error("Migration failed: POSTGRES_URL is unavailable.");
        process.exitCode = 2;
        return;
    }
    const sql = postgres(process.env.POSTGRES_URL, {
        ssl: "require", prepare: false, connect_timeout: 10, max: 1,
    });
    try {
        await migrateInquiryResponses(sql);
        console.log("Inquiry response columns and nullable defaults verified successfully.");
    } catch (error) {
        console.error("Migration failed:", error.name === "SchemaMismatchError" ? error.message : error.code || error.name);
        process.exitCode = 1;
    } finally {
        await sql.end({ timeout: 5 });
    }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    await main();
}
