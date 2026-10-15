import assert from 'node:assert/strict';
import test from 'node:test';
import { NextResponse } from 'next/server.js';
import { loadModule } from './helpers/load-typescript.mjs';

const buyer = '11111111-1111-4111-8111-111111111111';
const seller = '22222222-2222-4222-8222-222222222222';
const listingId = '33333333-3333-4333-8333-333333333333';
const context = { params: Promise.resolve({ id: listingId }) };

function load({ user = { id: buyer }, status = 'active', missing = false, failure = false } = {}) {
  const calls = [];
  const api = loadModule('app/api/listings/[id]/inquiries/route.ts', {
    'next/server': { NextResponse },
    '@/app/lib/auth/get-current-user': { getCurrentUser: async () => user },
    '@/app/lib/inquiries/queries': {
      getInquiryListing: async (id) => {
        calls.push(['lookup', id]);
        if (failure) throw new Error('PRIVATE_DATABASE_DETAILS');
        return missing ? null : { id, user_id: seller, status };
      },
      createInquiry: async (...args) => {
        calls.push(['create', ...args]);
        return { id: 'saved-inquiry', listing_id: args[0], sender_id: args[1], message: args[2] };
      },
    },
  });
  return { api, calls };
}
const request = (body) => new Request('http://localhost/api/listings/inquiries', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-id': seller }, body: JSON.stringify(body),
});

test('initial inquiry keeps its 1000-character limit, trims text and uses the session sender', async () => {
  const { api, calls } = load();
  const response = await api.POST(request({ message: '  Still available?  ', senderId: seller }), context);
  assert.equal(response.status, 201);
  assert.equal((await response.json()).sender_id, buyer);
  assert.deepEqual(calls, [['lookup', listingId], ['create', listingId, buyer, 'Still available?']]);
  for (const message of ['', '  ', 3, 'x'.repeat(1001)]) {
    const invalid = load();
    assert.equal((await invalid.api.POST(request({ message }), context)).status, 400);
    assert.deepEqual(invalid.calls, []);
  }
});

test('initial inquiry rejects malformed or nonobject JSON with 400 without database access', async () => {
  for (const body of ['{', 'null', '[]', '123', '"message"']) {
    const { api, calls } = load();
    const response = await api.POST(new Request('http://localhost/api/listings/inquiries', { method: 'POST', body }), context);
    assert.equal(response.status, 400);
    assert.deepEqual(calls, []);
  }
});

test('initial inquiry still blocks guests, owners, inactive and nonexistent listings', async () => {
  for (const [options, expected] of [[{ user: null }, 401], [{ user: { id: seller } }, 400], [{ status: 'sold' }, 400], [{ status: 'deleted' }, 400], [{ missing: true }, 404]]) {
    const { api, calls } = load(options);
    assert.equal((await api.POST(request({ message: 'Interested' }), context)).status, expected);
    assert.ok(calls.every(([type]) => type !== 'create'));
  }
});

test('initial inquiry failures do not expose database details', async () => {
  const { api } = load({ failure: true });
  const response = await api.POST(request({ message: 'Interested' }), context);
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'Failed to send inquiry.' });
});
