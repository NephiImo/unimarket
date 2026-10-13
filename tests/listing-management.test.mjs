import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./helpers/load-typescript.mjs";

const validation = loadModule("app/lib/listings/validation.ts");
const listingId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const validInput = {
    title: "  Student desk  ",
    description: "A sturdy desk.",
    categoryId: 3,
    price: 15000.5,
    location: "Campus",
    imageUrl: "https://example.com/desk.jpg",
    status: "active",
};

class TestResponse extends Response {
    static json(body, options) {
        return new TestResponse(JSON.stringify(body), {
            ...options,
            headers: { "Content-Type": "application/json" },
        });
    }
}

function routes({ user = { id: userId }, listing = { id: listingId, user_id: userId }, ...overrides } = {}) {
    const calls = [];
    const queries = {
        getListings: async () => [],
        getListingById: async () => listing,
        categoryExists: async () => true,
        createListing: async (input) => {
            calls.push({ operation: "create", input });
            return { id: listingId, ...input };
        },
        updateListing: async (id, ownerId, input) => {
            calls.push({ operation: "update", id, ownerId, input });
            return { id, user_id: ownerId, ...input };
        },
        deleteListing: async (id, ownerId) => {
            calls.push({ operation: "delete", id, ownerId });
            return true;
        },
        ...overrides,
    };
    const dependencies = {
        "next/server": { NextResponse: TestResponse },
        "@/app/lib/auth/get-current-user": { getCurrentUser: async () => user },
        "@/app/lib/listings/queries": queries,
        "@/app/lib/listings/validation": validation,
    };
    return {
        calls,
        collection: loadModule("app/api/listings/route.ts", dependencies),
        item: loadModule("app/api/listings/[id]/route.ts", dependencies),
    };
}

const context = { params: Promise.resolve({ id: listingId }) };
const request = (body) => ({ json: async () => body });

test("validation trims fields and defaults optional image/status", () => {
    const { data, errors } = validation.validateListingInput({ ...validInput, imageUrl: undefined, status: undefined });
    assert.equal(data, null);
    assert.ok(errors.status);
    const { imageUrl, status, ...required } = validInput;
    assert.ok(imageUrl && status);
    const result = validation.validateListingInput(required);
    assert.deepEqual(result.errors, {});
    assert.equal(result.data.title, "Student desk");
    assert.equal(result.data.imageUrl, null);
    assert.equal(result.data.status, "active");
});

test("validation rejects malformed bodies and field lengths", () => {
    for (const input of [null, [], "listing"]) {
        assert.equal(validation.validateListingInput(input).data, null);
    }
    const result = validation.validateListingInput({
        ...validInput,
        title: "x".repeat(151),
        description: "x".repeat(5001),
        location: "x".repeat(151),
        categoryId: 2147483648,
    });
    for (const field of ["title", "description", "location", "categoryId"]) {
        assert.ok(result.errors[field]);
    }
});

test("validation rejects invalid prices while accepting NUMERIC(10,2) boundaries", () => {
    for (const price of [NaN, Infinity, -1, 100000000, 1.005, "12.00", null]) {
        assert.ok(validation.validateListingInput({ ...validInput, price }).errors.price);
    }
    for (const price of [0, 0.29, 99999999.99]) {
        assert.equal(validation.validateListingInput({ ...validInput, price }).data.price, price);
    }
});

test("validation restricts image protocols and prevents deletion status injection", () => {
    for (const imageUrl of ["javascript:alert(1)", "ftp://example.com/image", "not-a-url", {}]) {
        assert.ok(validation.validateListingInput({ ...validInput, imageUrl }).errors.imageUrl);
    }
    assert.ok(validation.validateListingInput({ ...validInput, status: "deleted" }).errors.status);
    assert.ok(validation.validateListingInput({ ...validInput, status: null }).errors.status);
    assert.equal(validation.validateListingInput({ ...validInput, status: "sold" }).data.status, "sold");
});

test("partial validation supports image clearing and rejects empty updates", () => {
    assert.deepEqual(validation.validateListingInput({ imageUrl: " " }, true).data, { imageUrl: null });
    assert.equal(validation.validateListingInput({}, true).data, null);
    assert.equal(validation.validateListingInput({ userId: "spoof" }, true).data, null);
});

test("POST creates using the authenticated user and ignores a supplied owner/header", async () => {
    const { collection, calls } = routes();
    const req = request({ ...validInput, userId: "spoofed-owner", status: "sold" });
    req.headers = new Headers({ "x-user-id": "spoofed-owner" });
    const response = await collection.POST(req);
    assert.equal(response.status, 201);
    assert.equal((await response.json()).id, listingId);
    assert.equal(calls[0].input.userId, userId);
    assert.equal(calls[0].input.title, "Student desk");
    assert.equal(calls[0].input.status, "sold");
});

test("POST/PATCH/DELETE reject unauthenticated requests without mutations", async () => {
    const { collection, item, calls } = routes({ user: null });
    assert.equal((await collection.POST(request(validInput))).status, 401);
    assert.equal((await item.PATCH(request({ title: "changed" }), context)).status, 401);
    assert.equal((await item.DELETE({}, context)).status, 401);
    assert.deepEqual(calls, []);
});

test("POST/PATCH reject malformed JSON and nonexistent categories", async () => {
    const { collection, item, calls } = routes({ categoryExists: async () => false });
    const malformed = { json: async () => { throw new SyntaxError("Invalid JSON"); } };
    assert.equal((await collection.POST(malformed)).status, 400);
    assert.equal((await item.PATCH(malformed, context)).status, 400);
    const createResponse = await collection.POST(request(validInput));
    assert.equal(createResponse.status, 400);
    assert.ok((await createResponse.json()).errors.categoryId);
    assert.equal((await item.PATCH(request({ categoryId: 99 }), context)).status, 400);
    assert.deepEqual(calls, []);
});

test("POST/PATCH reject null JSON and deletion status without mutations", async () => {
    const { collection, item, calls } = routes();
    assert.equal((await collection.POST(request(null))).status, 400);
    assert.equal((await item.PATCH(request(null), context)).status, 400);
    assert.equal((await item.PATCH(request({ status: "deleted" }), context)).status, 400);
    assert.deepEqual(calls, []);
});

test("PATCH/DELETE reject a nonowner before changing the listing", async () => {
    const { item, calls } = routes({ listing: { id: listingId, user_id: "another-owner" } });
    assert.equal((await item.PATCH(request({ title: "changed" }), context)).status, 403);
    assert.equal((await item.DELETE({}, context)).status, 403);
    assert.deepEqual(calls, []);
});

test("PATCH saves supported availability and clears an optional image", async () => {
    const { item, calls } = routes();
    const response = await item.PATCH(request({ status: "sold", imageUrl: null }), context);
    assert.equal(response.status, 200);
    assert.deepEqual(calls[0], {
        operation: "update", id: listingId, ownerId: userId,
        input: { imageUrl: null, status: "sold" },
    });
});

test("DELETE returns success for the owner", async () => {
    const { item, calls } = routes();
    assert.equal((await item.DELETE({}, context)).status, 204);
    assert.deepEqual(calls[0], { operation: "delete", id: listingId, ownerId: userId });
});

test("missing/deleted listings produce 404 for reads and mutations", async () => {
    const { item, calls } = routes({ listing: null });
    assert.equal((await item.GET({}, context)).status, 404);
    assert.equal((await item.PATCH(request({ title: "changed" }), context)).status, 404);
    assert.equal((await item.DELETE({}, context)).status, 404);
    assert.deepEqual(calls, []);
});

test("unexpected database failures return a generic error", async () => {
    const { collection } = routes({ createListing: async () => { throw new Error("private connection details"); } });
    const response = await collection.POST(request(validInput));
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: "Failed to create listing." });
});

function queryModule(result = []) {
    const calls = [];
    const sql = async (strings, ...values) => {
        calls.push({ text: strings.join("?"), values });
        return result;
    };
    const queries = loadModule("app/lib/listings/queries.ts", {
        "@/app/lib/db": sql,
        "@/app/lib/listings/validation": validation,
    });
    return { queries, calls };
}

test("deletion updates a tombstone with ownership and keeps inquiry foreign keys intact", async () => {
    const { queries, calls } = queryModule({ count: 1 });
    assert.equal(await queries.deleteListing(listingId, userId), true);
    assert.match(calls[0].text, /UPDATE listings\s+SET status = 'deleted'/);
    assert.doesNotMatch(calls[0].text, /DELETE FROM/);
    assert.match(calls[0].text, /AND user_id = \?/);
    assert.match(calls[0].text, /AND status <> 'deleted'/);
    assert.deepEqual(calls[0].values, [listingId, userId]);
});

test("public/detail/owner listing queries hide deleted records", async () => {
    const { queries, calls } = queryModule();
    for (const args of [[], ["desk"], [undefined, "Books"], ["desk", "Books"]]) {
        await queries.getListings(...args);
        assert.match(calls.at(-1).text, /l.status = 'active'/);
    }
    await queries.getListingById(listingId);
    assert.match(calls.at(-1).text, /l.status <> 'deleted'/);
    await queries.getListingsByUserId(userId);
    assert.match(calls.at(-1).text, /l.user_id = \? AND l.status <> 'deleted'/);
});

test("updates clear images explicitly, preserve omissions, and cannot restore tombstones", async () => {
    const { queries, calls } = queryModule();
    await queries.updateListing(listingId, userId, { imageUrl: null });
    assert.match(calls[0].text, /image_url = CASE/);
    assert.equal(calls[0].values[4], true);
    assert.equal(calls[0].values[5], null);
    assert.match(calls[0].text, /AND user_id = \?/);
    assert.match(calls[0].text, /AND status <> 'deleted'/);
    await queries.updateListing(listingId, userId, { title: "New title" });
    assert.equal(calls[1].values[4], false);
});

test("invalid UUIDs are rejected before querying PostgreSQL", async () => {
    const { queries, calls } = queryModule();
    assert.equal(await queries.getListingById("not-a-uuid"), null);
    assert.equal(await queries.updateListing("not-a-uuid", userId, { title: "Test" }), null);
    assert.equal(await queries.deleteListing("not-a-uuid", userId), false);
    assert.deepEqual(calls, []);
});
