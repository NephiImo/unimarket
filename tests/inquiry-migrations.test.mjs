import assert from "node:assert/strict";
import test from "node:test";
import { assertInquiryMessagesSchema } from "../scripts/add-inquiry-messages.mjs";
import { assertInquiryResponseColumns, migrateInquiryResponses } from "../scripts/add-inquiry-responses.mjs";

function messageSchema() {
    return {
        table: { relkind: "r" },
        columns: [
            { column_name: "id", data_type: "uuid", is_nullable: "NO", column_default: "gen_random_uuid()" },
            { column_name: "inquiry_id", data_type: "uuid", is_nullable: "NO", column_default: null },
            { column_name: "sender_id", data_type: "uuid", is_nullable: "NO", column_default: null },
            { column_name: "message", data_type: "text", is_nullable: "NO", column_default: null },
            { column_name: "created_at", data_type: "timestamp without time zone", is_nullable: "NO", column_default: "CURRENT_TIMESTAMP" },
        ],
        constraints: [
            { contype: "p", column_names: ["id"] },
            ...[["inquiry_id", "inquiries"], ["sender_id", "users"]].map(([column, target]) => ({
                contype: "f", convalidated: true, column_names: [column],
                referenced_schema: "public", referenced_table: target,
                referenced_columns: ["id"], confdeltype: "c", confupdtype: "a",
            })),
        ],
        indexes: [{
            index_name: "inquiry_messages_inquiry_id_idx", amname: "btree",
            indisvalid: true, indisready: true, indisunique: false,
            predicate: null, expressions: null,
            column_names: ["inquiry_id", "created_at"], option_flags: [0, 0],
        }],
    };
}

const responseColumns = () => [
    { column_name: "seller_response", data_type: "text", is_nullable: "YES", column_default: null },
    { column_name: "responded_at", data_type: "timestamp without time zone", is_nullable: "YES", column_default: null },
];

test("message migration accepts the documented schema, including qualified UUID defaults", () => {
    const schema = messageSchema();
    assert.doesNotThrow(() => assertInquiryMessagesSchema(schema));
    schema.columns[0].column_default = "public.gen_random_uuid()";
    schema.columns[4].column_default = "now()";
    assert.doesNotThrow(() => assertInquiryMessagesSchema(schema));
});

test("an existing table with incompatible columns or defaults is rejected", () => {
    for (const mutate of [
        (schema) => { schema.table.relkind = "v"; },
        (schema) => { schema.columns.splice(3, 1); },
        (schema) => { schema.columns[1].data_type = "text"; },
        (schema) => { schema.columns[2].is_nullable = "YES"; },
        (schema) => { schema.columns[0].column_default = null; },
        (schema) => { schema.columns[4].column_default = null; },
        (schema) => { schema.columns.push({ column_name: "required_extra", is_nullable: "NO", column_default: null }); },
    ]) {
        const schema = messageSchema();
        mutate(schema);
        assert.throws(() => assertInquiryMessagesSchema(schema), /Incompatible public.inquiry_messages schema/);
    }
});

test("foreign keys must use the correct targets and cascade policy", () => {
    for (const overrides of [
        { referenced_schema: "other_schema" }, { referenced_table: "listings" },
        { referenced_columns: ["wrong_id"] }, { confdeltype: "a" },
        { convalidated: false },
    ]) {
        const schema = messageSchema();
        Object.assign(schema.constraints[1], overrides);
        assert.throws(() => assertInquiryMessagesSchema(schema), /foreign key/);
    }
    const schema = messageSchema();
    schema.constraints.shift();
    assert.throws(() => assertInquiryMessagesSchema(schema), /primary key/);
});

test("an index name alone does not establish a compatible conversation index", () => {
    for (const overrides of [
        { indisvalid: false }, { indisready: false }, { indisunique: true },
        { column_names: ["created_at", "inquiry_id"] }, { option_flags: [0, 1] },
        { predicate: "message IS NOT NULL" }, { expressions: "lower(message)" },
        { amname: "hash" },
    ]) {
        const schema = messageSchema();
        Object.assign(schema.indexes[0], overrides);
        assert.throws(() => assertInquiryMessagesSchema(schema), /btree index/);
    }
});

test("seller response columns remain nullable with the expected types and defaults", () => {
    assert.doesNotThrow(() => assertInquiryResponseColumns(responseColumns()));
    for (const overrides of [
        { data_type: "character varying" }, { is_nullable: "NO" },
        { column_default: "'Already answered'::text" },
    ]) {
        const columns = responseColumns();
        Object.assign(columns[0], overrides);
        assert.throws(() => assertInquiryResponseColumns(columns), /must be nullable text/);
    }
    const columns = responseColumns();
    columns[1].data_type = "timestamp with time zone";
    assert.throws(() => assertInquiryResponseColumns(columns), /timestamp without time zone/);
});

test("a response schema mismatch prevents the migration transaction from committing", async () => {
    const statements = [];
    let committed = false;
    let rolledBack = false;
    const transaction = async (parts) => {
        const statement = parts.join("");
        statements.push(statement);
        return [];
    };
    const sql = {
        async begin(callback) {
            try {
                await callback(transaction);
                committed = true;
            } catch (error) {
                rolledBack = true;
                throw error;
            }
        },
    };
    await assert.rejects(migrateInquiryResponses(sql), /Incompatible public.inquiries schema/);
    assert.equal(committed, false);
    assert.equal(rolledBack, true);
    assert.ok(statements.some((statement) => statement.includes("lock_timeout")));
    assert.ok(statements.some((statement) => statement.includes("statement_timeout")));
});
