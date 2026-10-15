import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

class SchemaMismatchError extends Error {
    name = "SchemaMismatchError";
}

const sameColumns = (actual, expected) =>
    Array.isArray(actual) && actual.join(",") === expected.join(",");

export function assertInquiryMessagesSchema({ table, columns, constraints, indexes }) {
    const fail = (reason) => {
        throw new SchemaMismatchError(`Incompatible public.inquiry_messages schema: ${reason}.`);
    };
    if (table?.relkind !== "r") fail("expected an ordinary table");

    const expectedColumns = {
        id: "uuid",
        inquiry_id: "uuid",
        sender_id: "uuid",
        message: "text",
        created_at: "timestamp without time zone",
    };
    for (const [name, type] of Object.entries(expectedColumns)) {
        const column = columns.find((item) => item.column_name === name);
        if (!column || column.data_type !== type || column.is_nullable !== "NO") {
            fail(`expected required ${name} column with type ${type}`);
        }
    }
    const defaults = Object.fromEntries(columns.map((column) => [column.column_name, column.column_default]));
    if (!/^(?:[a-z_][a-z0-9_]*\.)?gen_random_uuid\(\)$/i.test(defaults.id ?? "")) {
        fail("id must default to gen_random_uuid()");
    }
    if (!/^(?:CURRENT_TIMESTAMP|now\(\))$/i.test(defaults.created_at ?? "")) {
        fail("created_at must default to CURRENT_TIMESTAMP or now()");
    }
    if (columns.some((column) => !(column.column_name in expectedColumns)
        && column.is_nullable === "NO" && column.column_default === null)) {
        fail("additional required columns need defaults for application inserts");
    }
    if (!constraints.some((constraint) => constraint.contype === "p"
        && sameColumns(constraint.column_names, ["id"]))) {
        fail("expected a primary key on id");
    }
    for (const [column, target] of [["inquiry_id", "inquiries"], ["sender_id", "users"]]) {
        if (!constraints.some((constraint) => constraint.contype === "f"
            && constraint.convalidated === true
            && sameColumns(constraint.column_names, [column])
            && constraint.referenced_schema === "public"
            && constraint.referenced_table === target
            && sameColumns(constraint.referenced_columns, ["id"])
            && constraint.confdeltype === "c"
            && constraint.confupdtype === "a")) {
            fail(`expected validated ${column} foreign key to public.${target}(id) with ON DELETE CASCADE`);
        }
    }
    const index = indexes.find((item) => item.index_name === "inquiry_messages_inquiry_id_idx");
    if (!index || index.amname !== "btree" || index.indisvalid !== true
        || index.indisready !== true || index.indisunique !== false
        || index.predicate !== null || index.expressions !== null
        || !sameColumns(index.column_names, ["inquiry_id", "created_at"])
        || !sameColumns(index.option_flags, [0, 0])) {
        fail("expected a valid non-unique btree index on inquiry_id, created_at (ascending, without a predicate)");
    }
}

export async function verifyInquiryMessagesSchema(sql) {
    const tables = await sql`
        SELECT c.relkind FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'inquiry_messages'
    `;
    const columns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'inquiry_messages'
    `;
    const constraints = await sql`
        SELECT c.contype, c.convalidated, c.confdeltype, c.confupdtype,
            ARRAY(SELECT a.attname FROM unnest(c.conkey) WITH ORDINALITY AS k(attnum, position)
                JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
                ORDER BY k.position) AS column_names,
            rn.nspname AS referenced_schema, r.relname AS referenced_table,
            ARRAY(SELECT a.attname FROM unnest(c.confkey) WITH ORDINALITY AS k(attnum, position)
                JOIN pg_attribute a ON a.attrelid = c.confrelid AND a.attnum = k.attnum
                ORDER BY k.position) AS referenced_columns
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        LEFT JOIN pg_class r ON r.oid = c.confrelid
        LEFT JOIN pg_namespace rn ON rn.oid = r.relnamespace
        WHERE n.nspname = 'public' AND t.relname = 'inquiry_messages'
    `;
    const indexes = await sql`
        SELECT idx.relname AS index_name, am.amname,
            i.indisvalid, i.indisready, i.indisunique,
            pg_get_expr(i.indpred, i.indrelid) AS predicate,
            pg_get_expr(i.indexprs, i.indrelid) AS expressions,
            ARRAY(SELECT a.attname FROM unnest(i.indkey::smallint[]) WITH ORDINALITY AS k(attnum, position)
                JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum
                WHERE k.position <= i.indnkeyatts ORDER BY k.position) AS column_names,
            i.indoption::smallint[] AS option_flags
        FROM pg_index i
        JOIN pg_class t ON t.oid = i.indrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        JOIN pg_class idx ON idx.oid = i.indexrelid
        JOIN pg_am am ON am.oid = idx.relam
        WHERE n.nspname = 'public' AND t.relname = 'inquiry_messages'
    `;
    assertInquiryMessagesSchema({ table: tables[0], columns, constraints, indexes });
}

export async function migrateInquiryMessages(sql) {
    await sql.begin(async (transaction) => {
        await transaction`SET LOCAL lock_timeout = '5s'`;
        await transaction`SET LOCAL statement_timeout = '30s'`;
        await transaction`
            CREATE TABLE IF NOT EXISTS public.inquiry_messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
                sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
                message TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await transaction`
            CREATE INDEX IF NOT EXISTS inquiry_messages_inquiry_id_idx
            ON public.inquiry_messages(inquiry_id, created_at)
        `;
        await verifyInquiryMessagesSchema(transaction);
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
        await migrateInquiryMessages(sql);
        console.log("Inquiry messages table, foreign keys, defaults, and index verified successfully.");
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
