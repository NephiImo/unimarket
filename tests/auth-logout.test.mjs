import assert from 'node:assert/strict';
import test from 'node:test';
import { loadModule } from './helpers/load-typescript.mjs';

function loadLogoutApi() {
  const cookies = [];
  const api = loadModule('app/api/auth/logout/route.ts', {
    'next/server': {
      NextResponse: {
        json(body) {
          return {
            status: 200,
            async json() { return body; },
            cookies: {
              set(name, value, options) {
                cookies.push({ name, value, options });
              },
            },
          };
        },
      },
    },
  });
  return { api, cookies };
}

test('logout responds successfully without exposing session data', async () => {
  const { api } = loadLogoutApi();
  const response = await api.POST();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    message: 'Logged out successfully.',
  });
});

test('logout expires the session cookie for the entire application', async () => {
  const { api, cookies } = loadLogoutApi();
  await api.POST();
  assert.equal(cookies.length, 1);
  const [{ name, value, options }] = cookies;
  assert.equal(name, 'session');
  assert.equal(value, '');
  assert.equal(options.httpOnly, true);
  assert.equal(options.path, '/');
  assert.ok(options.expires instanceof Date);
  assert.equal(options.expires.getTime(), 0);
});

test('repeated logout requests remain safe and expire the session each time', async () => {
  const { api, cookies } = loadLogoutApi();
  const first = await api.POST();
  const second = await api.POST();
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(cookies.length, 2);
  assert.ok(cookies.every(({ name, value }) => name === 'session' && value === ''));
});
