import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./helpers/load-typescript.mjs";

// Entirely synthetic fixtures: these tests never load credentials or PostgreSQL.
const owner = {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Current student",
    email: "current-student@example.invalid",
    contact_preference: "email",
    password_hash: "synthetic-current-user-hash",
};
const other = {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Another student",
    email: "another-student@example.invalid",
    contact_preference: "in_app",
    password_hash: "synthetic-other-user-hash",
};
const publicFields = ["id", "name", "email", "contact_preference"];

function project(row, projection) {
    if (projection.trim() === "*") return { ...row };
    return Object.fromEntries(projection.split(",").map((field) => {
        const name = field.trim();
        return [name, row[name]];
    }));
}

function profileApi({ sessionUser = { ...owner }, databaseError, preference = "email" } = {}) {
    const users = new Map([
        [owner.id, { ...owner, contact_preference: preference }],
        [other.id, { ...other }],
    ]);
    const calls = [];
    const events = [];
    const sql = async (strings, ...values) => {
        events.push("sql");
        const text = strings.join("?").replace(/\s+/g, " ").trim();
        calls.push({ text, values });
        if (databaseError) throw databaseError;

        const select = /^SELECT (.+) FROM users WHERE id = \? LIMIT 1$/i.exec(text);
        if (select) {
            const row = users.get(values[0]);
            return row ? [project(row, select[1])] : [];
        }

        const update = /^UPDATE users SET (.+) WHERE id = \? RETURNING (.+)$/i.exec(text);
        if (update) {
            const row = users.get(values.at(-1));
            if (!row) return [];
            update[1].split(",").forEach((assignment, index) => {
                const field = /^(\w+)\s*=\s*\?$/.exec(assignment.trim());
                assert.ok(field, "updates must use parameter-bound values");
                row[field[1]] = values[index];
            });
            return [project(row, update[2])];
        }

        throw new Error("Unexpected profile SQL");
    };
    const api = loadModule("app/api/profile/route.ts", {
        "next/server": { NextResponse: Response },
        "@/app/lib/auth/get-current-user": {
            getCurrentUser: async () => {
                events.push("auth");
                return sessionUser;
            },
        },
        "@/app/lib/db": sql,
    });
    return { api, calls, events, users };
}

function request(body, { malformed = false } = {}) {
    return new Request(`http://localhost/api/profile?userId=${other.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-id": other.id },
        body: malformed ? "{invalid-json" : JSON.stringify(body),
    });
}

function assertSafeProfile(body, expected) {
    assert.deepEqual(Object.keys(body), ["profile"]);
    assert.deepEqual(Object.keys(body.profile).sort(), [...publicFields].sort());
    assert.deepEqual(body.profile, expected);
    assert.equal(JSON.stringify(body).includes(owner.password_hash), false);
    assert.equal(JSON.stringify(body).includes(other.password_hash), false);
}

function assertSelect(call, id = owner.id) {
    assert.equal(call.text, "SELECT id, name, email, contact_preference FROM users WHERE id = ? LIMIT 1");
    assert.deepEqual(call.values, [id]);
    assert.doesNotMatch(call.text, /password_hash|SELECT \*/i);
}

function assertUpdate(call, name, preference, id = owner.id) {
    assert.equal(call.text, "UPDATE users SET name = ?, contact_preference = ? WHERE id = ? RETURNING id, name, email, contact_preference");
    assert.deepEqual(call.values, [name, preference, id]);
    assert.doesNotMatch(call.text, /password_hash|RETURNING \*/i);
}

test("profile GET/PATCH authenticate before parsing or SQL and ignore identity headers", async () => {
    for (const method of ["GET", "PATCH"]) {
        const { api, calls, events, users } = profileApi({ sessionUser: null });
        const before = structuredClone([...users]);
        const unauthenticated = {
            headers: new Headers({ "x-user-id": owner.id }),
            json: async () => {
                events.push("parse");
                throw new Error("Unauthenticated body must not be read");
            },
        };
        const response = await api[method](unauthenticated);
        assert.equal(response.status, 401);
        assert.deepEqual(await response.json(), {
            error: method === "GET"
                ? "You must be signed in to view your profile."
                : "You must be signed in to update your profile.",
        });
        assert.deepEqual(events, ["auth"]);
        assert.deepEqual(calls, []);
        assert.deepEqual([...users], before);
    }
});

for (const preference of ["email", "in_app"]) {
    test(`own profile GET/PATCH supports ${preference}, trims names, and excludes hashes`, async () => {
        const { api, calls, users } = profileApi({ preference });
        const initial = await api.GET(new Request(`http://localhost/api/profile?id=${other.id}`, {
            headers: { "x-user-id": other.id },
        }));
        assert.equal(initial.status, 200);
        assertSafeProfile(await initial.json(), {
            id: owner.id, name: owner.name, email: owner.email, contact_preference: preference,
        });
        assertSelect(calls[0]);

        const saved = await api.PATCH(request({ name: "  Ada Student \n", contactPreference: preference }));
        assert.equal(saved.status, 200);
        assertSafeProfile(await saved.json(), {
            id: owner.id, name: "Ada Student", email: owner.email, contact_preference: preference,
        });
        assertUpdate(calls[1], "Ada Student", preference);
        assert.equal(users.get(owner.id).name, "Ada Student");
        assert.equal(users.get(owner.id).password_hash, owner.password_hash);
        assert.deepEqual(users.get(other.id), other);
    });
}

test("profile PATCH accepts a trimmed display name at the 100-character boundary", async () => {
    const { api, calls } = profileApi();
    const name = "N".repeat(100);
    const response = await api.PATCH(request({ name: ` \t${name}\n `, contactPreference: "in_app" }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).profile.name, name);
    assertUpdate(calls[0], name, "in_app");
});

test("profile PATCH rejects malformed, null, array, and scalar JSON without SQL", async () => {
    const inputs = [null, [], ["name"], "student", 42, true, false];
    for (const body of inputs) {
        const { api, calls } = profileApi();
        const response = await api.PATCH(request(body));
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { error: "Please provide valid profile information." });
        assert.deepEqual(calls, []);
    }
    const { api, calls } = profileApi();
    const response = await api.PATCH(request({}, { malformed: true }));
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Please provide valid profile information." });
    assert.deepEqual(calls, []);
});

test("profile PATCH rejects missing, nonstring, blank, and overlong display names", async () => {
    for (const name of [undefined, null, 123, true, [], {}, "", " \n\t ", "N".repeat(101)]) {
        const { api, calls, users } = profileApi();
        const response = await api.PATCH(request({ name, contactPreference: "email" }));
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { error: "Display name must be between 1 and 100 characters." });
        assert.deepEqual(calls, []);
        assert.deepEqual(users.get(owner.id), owner);
    }
});

test("profile PATCH rejects missing, nonstring, and unsupported contact preferences", async () => {
    for (const contactPreference of [undefined, null, 123, true, [], {}, "", "sms", "EMAIL", " in_app "]) {
        const { api, calls, users } = profileApi();
        const response = await api.PATCH(request({ name: "Valid student", contactPreference }));
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { error: "Please select a valid contact preference." });
        assert.deepEqual(calls, []);
        assert.deepEqual(users.get(owner.id), owner);
    }
});

test("profile PATCH cannot target another user or edit email/password through supplied fields", async () => {
    const { api, calls, users } = profileApi();
    const response = await api.PATCH(request({
        id: other.id, userId: other.id, user_id: other.id,
        email: "replacement@example.invalid",
        password_hash: "synthetic-replacement-hash", password: "ignored-test-value",
        contact_preference: "email", name: "Own updated name", contactPreference: "in_app",
    }));
    assert.equal(response.status, 200);
    assertSafeProfile(await response.json(), {
        id: owner.id, name: "Own updated name", email: owner.email, contact_preference: "in_app",
    });
    assertUpdate(calls[0], "Own updated name", "in_app");
    assert.deepEqual(users.get(other.id), other);
    assert.deepEqual(users.get(owner.id), { ...owner, name: "Own updated name", contact_preference: "in_app" });
});

test("both users receive and update only the profile selected by their session", async () => {
    const { api, calls, users } = profileApi({ sessionUser: { ...other } });
    const initial = await api.GET();
    assert.equal(initial.status, 200);
    assertSafeProfile(await initial.json(), {
        id: other.id, name: other.name, email: other.email, contact_preference: other.contact_preference,
    });
    assertSelect(calls[0], other.id);
    const response = await api.PATCH(request({ id: owner.id, userId: owner.id, name: "Other updated name", contactPreference: "email" }));
    assert.equal(response.status, 200);
    assertUpdate(calls[1], "Other updated name", "email", other.id);
    assert.equal((await response.json()).profile.id, other.id);
    assert.deepEqual(users.get(owner.id), owner);
    assert.equal(users.get(other.id).password_hash, other.password_hash);
});

test("profile GET/PATCH return 404 when the session user has no database profile", async () => {
    const missingId = "33333333-3333-4333-8333-333333333333";
    const { api, calls, users } = profileApi({ sessionUser: { id: missingId } });
    const before = structuredClone([...users]);
    assert.equal((await api.GET()).status, 404);
    const response = await api.PATCH(request({ name: "Missing student", contactPreference: "email" }));
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "Profile not found." });
    assertSelect(calls[0], missingId);
    assertUpdate(calls[1], "Missing student", "email", missingId);
    assert.deepEqual([...users], before);
});

test("profile database failures return generic GET/PATCH errors without internal details", async () => {
    for (const method of ["GET", "PATCH"]) {
        const detail = "synthetic-private-database-error";
        const { api, calls } = profileApi({ databaseError: new Error(detail) });
        const response = await api[method](request({ name: "Valid student", contactPreference: "email" }));
        assert.equal(response.status, 500);
        const body = await response.json();
        assert.deepEqual(body, {
            error: method === "GET" ? "Unable to load your profile." : "Unable to update your profile.",
        });
        assert.equal(JSON.stringify(body).includes(detail), false);
        assert.equal(JSON.stringify(body).includes(owner.password_hash), false);
        assert.equal(calls.length, 1);
    }
});
