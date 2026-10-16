import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { NextRequest, NextResponse } from "next/server.js";
import postgres from "postgres";
import { loadModule } from "./helpers/load-typescript.mjs";

// This suite intentionally never loads .env.local or falls back to POSTGRES_URL.
test("PostgreSQL inquiry conversations enforce participants and roll back their isolated schema", {
    skip: !process.env.TEST_POSTGRES_URL && "TEST_POSTGRES_URL is unavailable; use a dedicated test database",
    timeout: 60000,
}, async () => {
    const sql = postgres(process.env.TEST_POSTGRES_URL, {
        ssl: "require", prepare: false, connect_timeout: 10, max: 1,
    });
    const schema = `test_inquiries_${randomUUID().replaceAll("-", "")}`;
    const rollback = new Error("Roll back isolated inquiry fixtures");
    const sellerId = randomUUID();
    const buyerId = randomUUID();
    const outsiderId = randomUUID();
    const listingId = randomUUID();

    try {
        try {
            await sql.begin(async (transaction) => {
                await transaction`SET LOCAL lock_timeout = '5s'`;
                await transaction`SET LOCAL statement_timeout = '15s'`;
                // The identifier contains a fixed prefix and generated hexadecimal characters only.
                await transaction.unsafe(`CREATE SCHEMA "${schema}"`);
                await transaction.unsafe(`SET LOCAL search_path TO "${schema}", pg_catalog`);
                await transaction`
                    CREATE TABLE users (id UUID PRIMARY KEY, name TEXT NOT NULL)
                `;
                await transaction`
                    CREATE TABLE listings (
                        id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id),
                        title TEXT NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'active'
                    )
                `;
                await transaction`
                    CREATE TABLE inquiries (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        listing_id UUID NOT NULL REFERENCES listings(id),
                        sender_id UUID NOT NULL REFERENCES users(id), message TEXT NOT NULL,
                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        seller_response TEXT, responded_at TIMESTAMP
                    )
                `;
                await transaction`
                    CREATE TABLE inquiry_messages (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
                        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        message TEXT NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    )
                `;
                await transaction`
                    CREATE INDEX inquiry_messages_inquiry_id_idx ON inquiry_messages(inquiry_id, created_at)
                `;
                await transaction`
                    INSERT INTO users (id, name) VALUES
                        (${sellerId}, 'Inquiry seller'), (${buyerId}, 'Inquiry buyer'), (${outsiderId}, 'Unrelated user')
                `;
                await transaction`
                    INSERT INTO listings (id, user_id, title) VALUES (${listingId}, ${sellerId}, 'Inquiry test listing')
                `;

                const validation = loadModule("app/lib/inquiries/validation.ts");
                const queries = loadModule("app/lib/inquiries/queries.ts", {
                    "@/app/lib/db": transaction,
                    "@/app/lib/inquiries/validation": validation,
                });
                let sessionUser = { id: buyerId };
                const dependencies = {
                    "next/server": { NextRequest, NextResponse },
                    "@/app/lib/auth/get-current-user": { getCurrentUser: async () => sessionUser },
                    "@/app/lib/inquiries/queries": queries,
                    "@/app/lib/inquiries/validation": validation,
                };
                const initial = loadModule("app/api/listings/[id]/inquiries/route.ts", dependencies);
                const messages = loadModule("app/api/inquiries/[id]/messages/route.ts", dependencies);
                const responses = loadModule("app/api/inquiries/[id]/response/route.ts", dependencies);
                const received = loadModule("app/api/inquiries/received/route.ts", dependencies);
                const context = (id) => ({ params: Promise.resolve({ id }) });
                const request = (method, body, raw = false) => new NextRequest("http://localhost/api/inquiries", {
                    method,
                    headers: { "Content-Type": "application/json", "x-user-id": sellerId },
                    ...(body !== undefined ? { body: raw ? body : JSON.stringify(body) } : {}),
                });

                const created = await initial.POST(request("POST", {
                    message: "  Is this available?  ", senderId: sellerId, userId: sellerId,
                }), context(listingId));
                assert.equal(created.status, 201);
                const inquiry = await created.json();
                assert.equal(inquiry.sender_id, buyerId);
                assert.equal(inquiry.message, "Is this available?");
                const inquiryContext = context(inquiry.id);
                assert.equal((await queries.getSentInquiries(buyerId))[0].id, inquiry.id);
                assert.equal((await queries.getReceivedInquiries(sellerId))[0].id, inquiry.id);
                assert.equal((await queries.getSentInquiries(outsiderId)).length, 0);
                assert.equal((await queries.getReceivedInquiries(outsiderId)).length, 0);
                const empty = await messages.GET(request("GET"), inquiryContext);
                assert.equal(empty.status, 200);
                assert.deepEqual(await empty.json(), []);

                sessionUser = null;
                assert.equal((await messages.GET(request("GET"), inquiryContext)).status, 401);
                assert.equal((await messages.POST(request("POST", { message: "Anonymous" }), inquiryContext)).status, 401);
                assert.equal((await responses.POST(request("POST", { response: "Anonymous" }), inquiryContext)).status, 401);

                sessionUser = { id: outsiderId };
                assert.equal(await queries.getInquiryForParticipant(inquiry.id, outsiderId), null);
                assert.equal((await queries.getInquiryMessages(inquiry.id, outsiderId)).length, 0);
                assert.equal(await queries.createInquiryMessage(inquiry.id, outsiderId, "Unauthorized SQL insert"), null);
                assert.equal((await messages.GET(request("GET"), inquiryContext)).status, 404);
                assert.equal((await messages.POST(request("POST", { message: "Unauthorized" }), inquiryContext)).status, 404);
                assert.equal((await responses.POST(request("POST", { response: "Unauthorized" }), inquiryContext)).status, 404);
                assert.equal((await received.GET()).status, 200);
                assert.deepEqual(await (await received.GET()).json(), []);

                sessionUser = { id: buyerId };
                assert.equal((await messages.GET(request("GET"), context(randomUUID()))).status, 404);
                assert.equal((await messages.GET(request("GET"), context("invalid-id"))).status, 404);
                for (const body of [null, [], { message: " " }, { message: 4 }, { message: "x".repeat(2001) }]) {
                    assert.equal((await messages.POST(request("POST", body), inquiryContext)).status, 400);
                }
                assert.equal((await messages.POST(request("POST", "{", true), inquiryContext)).status, 400);
                assert.equal((await responses.POST(request("POST", { response: "Buyer cannot respond as seller" }), inquiryContext)).status, 404);
                const buyerMessage = await messages.POST(request("POST", {
                    message: "  Can we meet on campus?  ", senderId: sellerId, userId: sellerId,
                }), inquiryContext);
                assert.equal(buyerMessage.status, 201);
                const savedBuyer = await buyerMessage.json();
                assert.equal(savedBuyer.sender_id, buyerId);
                assert.equal(savedBuyer.message, "Can we meet on campus?");
                await transaction`UPDATE inquiry_messages SET created_at = '2026-01-01 10:00:00' WHERE id = ${savedBuyer.id}`;

                sessionUser = { id: sellerId };
                const sellerMessage = await messages.POST(request("POST", { message: "Yes, at the library." }), inquiryContext);
                assert.equal(sellerMessage.status, 201);
                const savedSeller = await sellerMessage.json();
                assert.equal(savedSeller.sender_id, sellerId);
                await transaction`UPDATE inquiry_messages SET created_at = '2026-01-01 10:01:00' WHERE id = ${savedSeller.id}`;
                const reply = await responses.POST(request("POST", { response: "  Still available.  " }), inquiryContext);
                assert.equal(reply.status, 201);
                assert.equal((await reply.json()).seller_response, "Still available.");
                assert.equal((await responses.POST(request("POST", { response: "Replacement" }), inquiryContext)).status, 404);
                const conversation = await queries.getInquiryForParticipant(inquiry.id, sellerId);
                assert.equal(conversation.seller_response, "Still available.");
                assert.equal(conversation.message, "Is this available?");
                assert.deepEqual((await queries.getInquiryMessages(inquiry.id, sellerId)).map((item) => item.id), [savedBuyer.id, savedSeller.id]);

                // Soft deletion must retain authorized conversation history and seller responses.
                await transaction`UPDATE listings SET status = 'deleted' WHERE id = ${listingId}`;
                assert.equal((await queries.getReceivedInquiries(sellerId))[0].listing_title, "Inquiry test listing");
                assert.equal((await queries.getSentInquiries(buyerId))[0].seller_response, "Still available.");
                for (const userId of [buyerId, sellerId]) {
                    sessionUser = { id: userId };
                    assert.equal((await queries.getInquiryForParticipant(inquiry.id, userId)).id, inquiry.id);
                    const history = await messages.GET(request("GET"), inquiryContext);
                    assert.equal(history.status, 200);
                    assert.equal((await history.json()).length, 2);
                }
                sessionUser = { id: buyerId };
                assert.equal((await initial.POST(request("POST", { message: "New inquiry on deleted listing" }), context(listingId))).status, 400);
                const persisted = await transaction`SELECT sender_id, message FROM inquiry_messages ORDER BY created_at`;
                assert.deepEqual(persisted.map((item) => item.sender_id), [buyerId, sellerId]);

                throw rollback;
            });
            assert.fail("The test schema and all fixtures must be rolled back");
        } catch (error) {
            if (error !== rollback) throw error;
        }
        const result = await sql`SELECT to_regnamespace(${schema}) IS NULL AS removed`;
        assert.equal(result[0].removed, true, "the isolated schema must not remain after the test");
    } finally {
        await sql.end({ timeout: 5 });
    }
});
