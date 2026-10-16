import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./helpers/load-typescript.mjs";

const inquiryId = "11111111-1111-4111-8111-111111111111";
const buyerId = "22222222-2222-4222-8222-222222222222";
const sellerId = "33333333-3333-4333-8333-333333333333";
const outsiderId = "44444444-4444-4444-8444-444444444444";
const messageId = "55555555-5555-4555-8555-555555555555";
const validation = loadModule("app/lib/inquiries/validation.ts");
const conversation = {
    id: inquiryId, sender_id: buyerId, seller_id: sellerId,
    message: "Original question", seller_response: null,
};
const savedMessage = {
    id: messageId, inquiry_id: inquiryId, sender_id: buyerId,
    message: "A follow-up", created_at: "2026-10-15T09:00:00.000Z",
};
const context = (id = inquiryId) => ({ params: Promise.resolve({ id }) });

function harness({ userId = buyerId, messages = [savedMessage], ...overrides } = {}) {
    const calls = [];
    const events = [];
    const queries = {
        getInquiryForParticipant: async (id, participantId) => {
            events.push("participant");
            calls.push({ operation: "participant", id, userId: participantId });
            return id === inquiryId && [buyerId, sellerId].includes(participantId) ? conversation : null;
        },
        getInquiryMessages: async (id, participantId) => {
            calls.push({ operation: "read", id, userId: participantId });
            return messages;
        },
        createInquiryMessage: async (id, senderId, message) => {
            calls.push({ operation: "message", id, senderId, message });
            return { ...savedMessage, inquiry_id: id, sender_id: senderId, message };
        },
        createSellerResponse: async (id, participantId, response) => {
            calls.push({ operation: "response", id, sellerId: participantId, response });
            return { ...conversation, seller_response: response };
        },
        ...overrides,
    };
    const dependencies = {
        "next/server": { NextResponse: Response },
        "@/app/lib/auth/get-current-user": {
            getCurrentUser: async () => {
                events.push("auth");
                return userId === null ? null : { id: userId, password_hash: "synthetic-session-hash" };
            },
        },
        "@/app/lib/inquiries/queries": queries,
        "@/app/lib/inquiries/validation": validation,
    };
    return {
        calls, events,
        messages: loadModule("app/api/inquiries/[id]/messages/route.ts", dependencies),
        response: loadModule("app/api/inquiries/[id]/response/route.ts", dependencies),
    };
}

function request(body, malformed = false) {
    return new Request("http://localhost/api/inquiries/example/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": outsiderId },
        body: malformed ? "{invalid-json" : JSON.stringify(body),
    });
}

test("inquiry message and response routes authenticate before params, parsing, or queries", async () => {
    const { messages, response, calls, events } = harness({ userId: null });
    const unreadable = { json: async () => { throw new Error("Body must not be parsed"); }, headers: new Headers({ "x-user-id": sellerId }) };
    const unreadableContext = { get params() { throw new Error("Params must not be read"); } };
    for (const invoke of [
        () => messages.GET(unreadable, unreadableContext),
        () => messages.POST(unreadable, unreadableContext),
        () => response.POST(unreadable, unreadableContext),
    ]) {
        const result = await invoke();
        assert.equal(result.status, 401);
        assert.deepEqual(await result.json(), { error: "Authentication required." });
    }
    assert.deepEqual(events, ["auth", "auth", "auth"]);
    assert.deepEqual(calls, []);
});

for (const userId of [buyerId, sellerId]) {
    test(`participant ${userId === buyerId ? "buyer" : "seller"} can read and send session-owned messages`, async () => {
        const api = harness({ userId });
        const loaded = await api.messages.GET({}, context());
        assert.equal(loaded.status, 200);
        assert.deepEqual(await loaded.json(), [savedMessage]);
        assert.deepEqual(api.calls[1], { operation: "read", id: inquiryId, userId });

        const result = await api.messages.POST(request({
            message: "  Follow-up from participant \n", sender_id: outsiderId,
            senderId: outsiderId, userId: outsiderId, inquiryId: outsiderId,
        }), context());
        assert.equal(result.status, 201);
        const body = await result.json();
        assert.equal(body.sender_id, userId);
        assert.equal(body.inquiry_id, inquiryId);
        assert.equal(body.message, "Follow-up from participant");
        assert.equal(JSON.stringify(body).includes("synthetic-session-hash"), false);
        assert.deepEqual(api.calls.at(-1), {
            operation: "message", id: inquiryId, senderId: userId, message: "Follow-up from participant",
        });
    });
}

test("legitimate empty conversations return 200 while outsiders and missing inquiries return 404", async () => {
    const participant = harness({ messages: [] });
    const empty = await participant.messages.GET({}, context());
    assert.equal(empty.status, 200);
    assert.deepEqual(await empty.json(), []);

    for (const options of [{ userId: outsiderId }, { getInquiryForParticipant: async () => null }]) {
        const api = harness(options);
        let parsed = false;
        const unreadable = { json: async () => { parsed = true; return { message: "private" }; } };
        assert.equal((await api.messages.GET({}, context())).status, 404);
        assert.equal((await api.messages.POST(unreadable, context())).status, 404);
        assert.equal(parsed, false);
        assert.equal(api.calls.some(({ operation }) => operation === "read" || operation === "message"), false);
    }
});

test("malformed inquiry UUIDs return 404 before querying or parsing", async () => {
    for (const id of ["not-a-uuid", "1", "' OR true --", ""]) {
        const api = harness({ userId: sellerId });
        const unreadable = { json: async () => { throw new Error("Body must not be parsed"); } };
        assert.equal((await api.messages.GET({}, context(id))).status, 404);
        assert.equal((await api.messages.POST(unreadable, context(id))).status, 404);
        assert.equal((await api.response.POST(unreadable, context(id))).status, 404);
        assert.deepEqual(api.calls, []);
    }
});

for (const field of ["message", "response"]) {
    test(`${field} endpoint rejects malformed JSON and invalid bodies/text with 400`, async () => {
        const invalid = [
            null, [], "text", 42, true, {},
            { [field]: null }, { [field]: 123 }, { [field]: [] }, { [field]: {} },
            { [field]: "" }, { [field]: " \t\n " }, { [field]: "X".repeat(2001) },
        ];
        for (const body of invalid) {
            const api = harness({ userId: field === "response" ? sellerId : buyerId });
            const result = await api[field === "message" ? "messages" : "response"].POST(request(body), context());
            assert.equal(result.status, 400);
            assert.equal(typeof (await result.json()).error, "string");
            assert.deepEqual(api.calls.map(({ operation }) => operation), ["participant"]);
        }
        const api = harness({ userId: field === "response" ? sellerId : buyerId });
        assert.equal((await api[field === "message" ? "messages" : "response"].POST(request({}, true), context())).status, 400);
        assert.deepEqual(api.calls.map(({ operation }) => operation), ["participant"]);
    });

    test(`${field} endpoint accepts the trimmed 2000-character boundary`, async () => {
        const api = harness({ userId: field === "response" ? sellerId : buyerId });
        const value = "X".repeat(2000);
        const result = await api[field === "message" ? "messages" : "response"].POST(request({ [field]: `  ${value}\n` }), context());
        assert.equal(result.status, 201);
        const body = await result.json();
        assert.equal(field === "response" ? body.seller_response : body.message, value);
        assert.equal(api.calls.at(-1)[field], value);
    });
}

test("legacy seller response remains seller-only and cannot overwrite an existing response", async () => {
    for (const userId of [buyerId, outsiderId]) {
        const api = harness({ userId });
        const result = await api.response.POST(request({ response: "Unauthorized", sellerId }), context());
        assert.equal(result.status, 404);
        assert.equal(api.calls.some(({ operation }) => operation === "response"), false);
    }
    const api = harness({ userId: sellerId, createSellerResponse: async () => null });
    assert.equal((await api.response.POST(request({ response: "Second response" }), context())).status, 404);
});

test("a failed participant-guarded insert returns 404 instead of claiming persistence", async () => {
    const api = harness({ createInquiryMessage: async () => null });
    const result = await api.messages.POST(request({ message: "Not persisted" }), context());
    assert.equal(result.status, 404);
    assert.deepEqual(await result.json(), { error: "Inquiry not found or access denied." });
});

test("database failures return generic errors without conversation or internal details", async () => {
    const fail = async () => { throw new Error("synthetic-private-database-details"); };
    const cases = [
        { method: "GET", endpoint: "messages", getInquiryForParticipant: fail, error: "Failed to load messages." },
        { method: "GET", endpoint: "messages", getInquiryMessages: fail, error: "Failed to load messages." },
        { method: "POST", endpoint: "messages", getInquiryForParticipant: fail, error: "Failed to send message." },
        { method: "POST", endpoint: "messages", createInquiryMessage: fail, error: "Failed to send message." },
        { method: "POST", endpoint: "response", createSellerResponse: fail, error: "Failed to submit seller response." },
    ];
    for (const { method, endpoint, error, ...overrides } of cases) {
        const api = harness({ userId: sellerId, ...overrides });
        const result = await api[endpoint][method](request({ message: "Valid", response: "Valid" }), context());
        assert.equal(result.status, 500);
        assert.deepEqual(await result.json(), { error });
    }
});
