import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { NextRequest, NextResponse } from "next/server.js";
import postgres from "postgres";
import { loadModule } from "./helpers/load-typescript.mjs";

const localEnvironment = fileURLToPath(new URL("../.env.local", import.meta.url));
if (existsSync(localEnvironment)) process.loadEnvFile(localEnvironment);

test("PostgreSQL listing and inquiry lifecycle rolls back all fixtures", {
    skip: !process.env.POSTGRES_URL && "POSTGRES_URL is unavailable",
    timeout: 60000,
}, async () => {
    const sql = postgres(process.env.POSTGRES_URL, {
        ssl: "require", prepare: false, connect_timeout: 10, max: 1,
    });
    const ownerId = randomUUID();
    const otherId = randomUUID();
    const fixtureLabel = `listing-integration-${randomUUID()}`;
    const rollback = new Error("Rollback listing integration fixtures");
    let listingId;
    let inquiryId;
    let fixtureCategoryId;

    try {
        try {
            await sql.begin(async (transaction) => {
                await transaction`
                    INSERT INTO users (id, name, email, password_hash)
                    VALUES
                        (${ownerId}, 'Listing test owner', ${`${ownerId}@example.invalid`}, 'test-only-unusable-hash'),
                        (${otherId}, 'Listing test buyer', ${`${otherId}@example.invalid`}, 'test-only-unusable-hash')
                `;
                const categories = await transaction`SELECT id FROM categories ORDER BY id LIMIT 1`;
                let categoryId = categories[0]?.id;
                if (categoryId === undefined) {
                    // Explicit ID avoids advancing a nontransactional SERIAL sequence.
                    fixtureCategoryId = 2147483647;
                    await transaction`INSERT INTO categories (id, name) VALUES (${fixtureCategoryId}, ${fixtureLabel})`;
                    categoryId = fixtureCategoryId;
                }

                const validation = loadModule("app/lib/listings/validation.ts");
                const queries = loadModule("app/lib/listings/queries.ts", {
                    "@/app/lib/db": transaction,
                    "@/app/lib/listings/validation": validation,
                });
                const inquiryQueries = loadModule("app/lib/inquiries/queries.ts", {
                    "@/app/lib/db": transaction,
                });
                let sessionUser = { id: ownerId };
                const dependencies = {
                    "next/server": { NextRequest, NextResponse },
                    "@/app/lib/auth/get-current-user": { getCurrentUser: async () => sessionUser },
                    "@/app/lib/listings/queries": queries,
                    "@/app/lib/listings/validation": validation,
                    "@/app/lib/inquiries/queries": inquiryQueries,
                };
                const collection = loadModule("app/api/listings/route.ts", dependencies);
                const item = loadModule("app/api/listings/[id]/route.ts", dependencies);
                const sendInquiry = loadModule("app/api/listings/[id]/inquiries/route.ts", dependencies);
                const receivedInquiries = loadModule("app/api/inquiries/received/route.ts", dependencies);
                const request = (method, body, claimedUserId = otherId) => new NextRequest("http://localhost/api/listings", {
                    method,
                    headers: { "Content-Type": "application/json", "x-user-id": claimedUserId },
                    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
                });

                const created = await collection.POST(request("POST", {
                    categoryId, title: fixtureLabel, description: "Integration fixture listing.",
                    price: 123.45, imageUrl: "https://example.com/fixture.jpg",
                    location: "Test campus", status: "active", userId: otherId,
                }));
                assert.equal(created.status, 201);
                const listing = await created.json();
                listingId = listing.id;
                assert.equal(listing.user_id, ownerId, "session user must override supplied owner/header");
                assert.equal(Number(listing.price), 123.45);
                assert.equal((await queries.getListingsByUserId(ownerId)).length, 1);
                const context = { params: Promise.resolve({ id: listingId }) };

                assert.equal((await sendInquiry.POST(request("POST", {
                    message: "Owner must not inquire about own listing.",
                }), context)).status, 400);

                sessionUser = { id: otherId };
                const sent = await sendInquiry.POST(request("POST", {
                    message: "  Test inquiry that must be preserved.  ",
                    senderId: ownerId, userId: ownerId,
                }, ownerId), context);
                assert.equal(sent.status, 201);
                const inquiry = await sent.json();
                inquiryId = inquiry.id;
                assert.equal(inquiry.sender_id, otherId, "inquiry sender must come from the session");
                assert.equal(inquiry.listing_id, listingId);
                assert.equal(inquiry.message, "Test inquiry that must be preserved.");
                assert.equal((await inquiryQueries.getReceivedInquiries(otherId)).length, 0);
                const buyerReceived = await receivedInquiries.GET(request("GET", undefined, ownerId));
                assert.equal(buyerReceived.status, 200);
                assert.deepEqual(await buyerReceived.json(), [], "buyer must not see another seller's inquiries");
                assert.equal((await item.PATCH(request("PATCH", { title: "Unauthorized change" }), context)).status, 403);
                assert.equal((await item.DELETE(request("DELETE"), context)).status, 403);
                sessionUser = null;
                assert.equal((await collection.POST(request("POST", {}))).status, 401);
                assert.equal((await item.PATCH(request("PATCH", { price: 1 }), context)).status, 401);
                assert.equal((await item.DELETE(request("DELETE"), context)).status, 401);
                assert.equal((await sendInquiry.POST(request("POST", { message: "Anonymous message" }), context)).status, 401);
                assert.equal((await receivedInquiries.GET()).status, 401);
                const unchanged = await queries.getListingById(listingId);
                assert.equal(unchanged.title, fixtureLabel);
                assert.equal(Number(unchanged.price), 123.45);

                sessionUser = { id: ownerId };
                const received = await inquiryQueries.getReceivedInquiries(ownerId);
                assert.equal(received.length, 1);
                assert.equal(received[0].id, inquiryId);
                assert.equal(received[0].listing_title, fixtureLabel);
                assert.equal(received[0].sender_name, "Listing test buyer");
                const ownerReceived = await receivedInquiries.GET();
                assert.equal(ownerReceived.status, 200);
                assert.equal((await ownerReceived.json())[0].id, inquiryId);
                const saved = await item.PATCH(request("PATCH", {
                    price: 99.95, status: "sold", imageUrl: null,
                }), context);
                assert.equal(saved.status, 200);
                const persisted = await queries.getListingById(listingId);
                assert.equal(Number(persisted.price), 99.95);
                assert.equal(persisted.status, "sold");
                assert.equal(persisted.image_url, null);

                sessionUser = { id: otherId };
                assert.equal((await sendInquiry.POST(request("POST", {
                    message: "Sold listings must reject new inquiries.",
                }), context)).status, 400);
                sessionUser = { id: ownerId };

                assert.equal((await item.PATCH(request("PATCH", { status: "active" }), context)).status, 200);
                assert.equal((await queries.getListings(fixtureLabel)).length, 1);

                assert.equal((await item.DELETE(request("DELETE"), context)).status, 204);
                const tombstones = await transaction`SELECT status FROM listings WHERE id = ${listingId}`;
                assert.equal(tombstones[0].status, "deleted");
                const inquiries = await transaction`
                    SELECT i.id, l.title FROM inquiries i
                    JOIN listings l ON l.id = i.listing_id
                    WHERE i.id = ${inquiryId}
                `;
                assert.equal(inquiries.length, 1);
                assert.equal(inquiries[0].title, fixtureLabel);
                const retained = await inquiryQueries.getReceivedInquiries(ownerId);
                assert.equal(retained.length, 1);
                assert.equal(retained[0].id, inquiryId);
                assert.equal(retained[0].listing_title, fixtureLabel);
                const retainedResponse = await receivedInquiries.GET();
                assert.equal(retainedResponse.status, 200);
                assert.equal((await retainedResponse.json())[0].id, inquiryId);
                sessionUser = { id: otherId };
                assert.equal((await sendInquiry.POST(request("POST", {
                    message: "Deleted listings must reject new inquiries.",
                }), context)).status, 400);
                assert.equal((await inquiryQueries.getReceivedInquiries(otherId)).length, 0);
                sessionUser = { id: ownerId };
                assert.equal(await queries.getListingById(listingId), null);
                assert.equal((await queries.getListingsByUserId(ownerId)).length, 0);
                assert.equal((await queries.getListings(fixtureLabel)).length, 0);
                assert.equal((await item.GET(request("GET"), context)).status, 404);
                assert.equal((await item.PATCH(request("PATCH", { status: "active" }), context)).status, 404);
                assert.equal(await queries.updateListing(listingId, ownerId, { status: "active" }), null);
                assert.equal((await item.DELETE(request("DELETE"), context)).status, 404);

                // This is unconditional: success also rolls back every inserted row.
                throw rollback;
            });
            assert.fail("Fixture transaction must always roll back");
        } catch (error) {
            if (error !== rollback) throw error;
        }

        const users = await sql`SELECT id FROM users WHERE id IN (${ownerId}, ${otherId})`;
        assert.equal(users.length, 0, "fixture users must be rolled back");
        const listings = await sql`SELECT id FROM listings WHERE id = ${listingId}`;
        assert.equal(listings.length, 0, "fixture listing must be rolled back");
        const inquiries = await sql`SELECT id FROM inquiries WHERE id = ${inquiryId}`;
        assert.equal(inquiries.length, 0, "fixture inquiry must be rolled back");
        const fixtureInquiries = await sql`
            SELECT id FROM inquiries WHERE listing_id = ${listingId} OR sender_id IN (${ownerId}, ${otherId})
        `;
        assert.equal(fixtureInquiries.length, 0, "all API-generated fixture inquiries must be rolled back");
        if (fixtureCategoryId !== undefined) {
            const categories = await sql`SELECT id FROM categories WHERE id = ${fixtureCategoryId}`;
            assert.equal(categories.length, 0, "fixture category must be rolled back");
        }
    } finally {
        await sql.end({ timeout: 5 });
    }
});
