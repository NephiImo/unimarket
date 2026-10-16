import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./helpers/load-typescript.mjs";

const inquiryId = "11111111-1111-4111-8111-111111111111";
const buyerId = "22222222-2222-4222-8222-222222222222";
const sellerId = "33333333-3333-4333-8333-333333333333";
const listingId = "44444444-4444-4444-8444-444444444444";
const validation = loadModule("app/lib/inquiries/validation.ts");

function harness(rows = []) {
    const calls = [];
    const sql = async (strings, ...values) => {
        calls.push({ text: strings.join("?").replace(/\s+/g, " ").trim(), values });
        return rows;
    };
    return {
        calls,
        queries: loadModule("app/lib/inquiries/queries.ts", {
            "@/app/lib/db": sql,
            "@/app/lib/inquiries/validation": validation,
        }),
    };
}

function assertPrivateProjection(text) {
    assert.doesNotMatch(text, /password_hash|\bemail\b|SELECT \*/i);
}

test("participant lookup binds inquiry and both participant identities in SQL without excluding deleted history", async () => {
    const row = { id: inquiryId, sender_id: buyerId, seller_id: sellerId };
    for (const userId of [buyerId, sellerId]) {
        const { queries, calls } = harness([row]);
        assert.deepEqual(await queries.getInquiryForParticipant(inquiryId, userId), row);
        assert.match(calls[0].text, /WHERE i.id = \? AND \(i.sender_id = \? OR l.user_id = \?\) LIMIT 1/);
        assert.deepEqual(calls[0].values, [inquiryId, userId, userId]);
        assert.match(calls[0].text, /l.title AS listing_title/);
        assert.doesNotMatch(calls[0].text, /l.status|status = 'active'|status <> 'deleted'/);
        assertPrivateProjection(calls[0].text);
    }
    const { queries } = harness();
    assert.equal(await queries.getInquiryForParticipant(inquiryId, buyerId), null);
});

test("message reads independently require buyer or seller participation and use stable ordering", async () => {
    const rows = [{ id: "message", inquiry_id: inquiryId, message: "Persisted follow-up" }];
    const { queries, calls } = harness(rows);
    assert.deepEqual(await queries.getInquiryMessages(inquiryId, buyerId), rows);
    assert.match(calls[0].text, /WHERE m.inquiry_id = \? AND EXISTS/);
    assert.match(calls[0].text, /WHERE i.id = m.inquiry_id AND \( i.sender_id = \? OR l.user_id = \? \)/);
    assert.match(calls[0].text, /ORDER BY m.created_at ASC, m.id ASC/);
    assert.deepEqual(calls[0].values, [inquiryId, buyerId, buyerId]);
    assert.doesNotMatch(calls[0].text, /l.status/);
    assertPrivateProjection(calls[0].text);
});

test("message inserts bind text and session sender while enforcing participant ownership inside INSERT", async () => {
    const text = "Hello'); DROP TABLE users; --";
    const row = { id: "new-message", inquiry_id: inquiryId, sender_id: buyerId, message: text };
    const { queries, calls } = harness([row]);
    assert.deepEqual(await queries.createInquiryMessage(inquiryId, buyerId, `  ${text}\n`), row);
    assert.match(calls[0].text, /INSERT INTO inquiry_messages/);
    assert.match(calls[0].text, /SELECT i.id, \?, \? FROM inquiries i JOIN listings l/);
    assert.match(calls[0].text, /WHERE i.id = \? AND \( i.sender_id = \? OR l.user_id = \? \)/);
    assert.match(calls[0].text, /RETURNING id, inquiry_id, sender_id, message, created_at/);
    assert.deepEqual(calls[0].values, [buyerId, text, inquiryId, buyerId, buyerId]);
    assert.equal(calls[0].text.includes(text), false);
    assert.equal(calls[0].text.includes(buyerId), false);
    assert.doesNotMatch(calls[0].text, /l.status/);
    const empty = harness();
    assert.equal(await empty.queries.createInquiryMessage(inquiryId, buyerId, "Not authorized"), null);
});

test("legacy response SQL remains seller-only and one-time with bound normalized text", async () => {
    const row = { id: inquiryId, seller_response: "Seller reply" };
    const { queries, calls } = harness([row]);
    assert.deepEqual(await queries.createSellerResponse(inquiryId, sellerId, "  Seller reply \n"), row);
    assert.match(calls[0].text, /UPDATE inquiries AS i SET seller_response = \?/);
    assert.match(calls[0].text, /WHERE i.id = \?.*AND l.user_id = \?.*AND i.seller_response IS NULL/);
    assert.deepEqual(calls[0].values, ["Seller reply", inquiryId, sellerId]);
    assert.doesNotMatch(calls[0].text, /inquiry_messages|l.status/);
    assertPrivateProjection(calls[0].text);
    const empty = harness();
    assert.equal(await empty.queries.createSellerResponse(inquiryId, buyerId, "Not seller"), null);
});

test("received/sent queries keep ownership filters and legacy responses after listing soft deletion", async () => {
    const { queries, calls } = harness();
    await queries.getReceivedInquiries(sellerId);
    await queries.getSentInquiries(buyerId);
    assert.match(calls[0].text, /WHERE l.user_id = \?/);
    assert.deepEqual(calls[0].values, [sellerId]);
    assert.match(calls[1].text, /WHERE i.sender_id = \?/);
    assert.deepEqual(calls[1].values, [buyerId]);
    for (const { text } of calls) {
        assert.match(text, /i.seller_response/);
        assert.match(text, /i.responded_at/);
        assert.match(text, /JOIN listings l ON l.id = i.listing_id/);
        assert.doesNotMatch(text, /l.status/);
        assertPrivateProjection(text);
    }
});

test("initial inquiry creation preserves its original row and has no new message-table dependency", async () => {
    const row = { id: inquiryId, listing_id: listingId, sender_id: buyerId, message: "Original inquiry" };
    const { queries, calls } = harness([row]);
    assert.deepEqual(await queries.createInquiry(listingId, buyerId, "Original inquiry"), row);
    assert.deepEqual(calls[0].values, [listingId, buyerId, "Original inquiry"]);
    assert.match(calls[0].text, /INSERT INTO inquiries/);
    assert.doesNotMatch(calls[0].text, /inquiry_messages/);
});

test("invalid inquiry/user UUIDs are rejected without touching PostgreSQL", async () => {
    const { queries, calls } = harness();
    assert.equal(await queries.getInquiryForParticipant("invalid", buyerId), null);
    assert.equal(await queries.getInquiryForParticipant(inquiryId, "invalid"), null);
    assert.deepEqual(await queries.getInquiryMessages("invalid", buyerId), []);
    assert.deepEqual(await queries.getInquiryMessages(inquiryId, "invalid"), []);
    assert.equal(await queries.createInquiryMessage("invalid", buyerId, "Valid"), null);
    assert.equal(await queries.createInquiryMessage(inquiryId, "invalid", "Valid"), null);
    assert.equal(await queries.createSellerResponse("invalid", sellerId, "Valid"), null);
    assert.equal(await queries.createSellerResponse(inquiryId, "invalid", "Valid"), null);
    assert.equal(await queries.getInquiryListing("invalid"), null);
    assert.deepEqual(calls, []);
});

test("persistence helpers reject invalid text before SQL and accept the normalized 2000 boundary", async () => {
    const { queries, calls } = harness();
    for (const text of [null, undefined, 123, [], {}, "", " \n ", "X".repeat(2001)]) {
        assert.equal(await queries.createInquiryMessage(inquiryId, buyerId, text), null);
        assert.equal(await queries.createSellerResponse(inquiryId, sellerId, text), null);
    }
    assert.deepEqual(calls, []);
    const value = "X".repeat(2000);
    await queries.createInquiryMessage(inquiryId, buyerId, ` ${value} `);
    await queries.createSellerResponse(inquiryId, sellerId, ` ${value} `);
    assert.equal(calls[0].values[1], value);
    assert.equal(calls[1].values[0], value);
});
