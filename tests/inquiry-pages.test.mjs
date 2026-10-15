import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadModule } from './helpers/load-typescript.mjs';

const user = { id: '11111111-1111-4111-8111-111111111111', name: 'Account', password_hash: 'PRIVATE_HASH' };
const inquiry = {
  id: '22222222-2222-4222-8222-222222222222',
  listing_id: '33333333-3333-4333-8333-333333333333',
  sender_id: '44444444-4444-4444-8444-444444444444',
  listing_title: 'Study desk',
  sender_name: 'Buyer',
  seller_name: 'Seller',
  message: 'Is this still available?',
  created_at: new Date('2026-10-01T00:00:00Z'),
  seller_response: 'Yes, it is.',
  responded_at: new Date('2026-10-02T00:00:00Z'),
};

function loadPage(file, { sessionUser = user, inquiries = [inquiry] } = {}) {
  const calls = { received: [], sent: [], chat: [], response: [] };
  const chat = {
    __esModule: true,
    default: (props) => {
      calls.chat.push(props);
      return createElement('section', { 'data-testid': 'chat' }, 'Conversation');
    },
  };
  const responses = {
    __esModule: true,
    default: (props) => {
      calls.response.push(props);
      return createElement('section', {}, props.existingResponse);
    },
  };
  const received = loadModule('components/ReceivedInquiries.tsx', {
    'react/jsx-runtime': jsxRuntime,
    '@/components/InquiryChat': chat,
    '@/components/SellerResponseForm': responses,
  });
  const content = loadModule('components/InquiriesPageContent.tsx', {
    'react/jsx-runtime': jsxRuntime,
    '@/components/ReceivedInquiries': { ...received, __esModule: true },
  });
  const page = loadModule(file, {
    'react/jsx-runtime': jsxRuntime,
    'next/navigation': { redirect: (href) => { throw new Error(`redirect:${href}`); } },
    '@/app/lib/auth/get-current-user': { getCurrentUser: async () => sessionUser },
    '@/app/lib/inquiries/queries': {
      getReceivedInquiries: async (id) => { calls.received.push(id); return inquiries; },
      getSentInquiries: async (id) => { calls.sent.push(id); return inquiries; },
    },
    '@/components/InquiryChat': chat,
    '@/components/InquiriesPageContent': { ...content, __esModule: true },
  });
  return { ...page, calls };
}

test('both inquiry pages authenticate before loading conversations', async () => {
  for (const file of ['app/inquiries/sent/page.tsx', 'app/inquiries/received/page.tsx']) {
    const { default: page, calls } = loadPage(file, { sessionUser: null });
    await assert.rejects(page(), /redirect:\/login/);
    assert.deepEqual(calls, { received: [], sent: [], chat: [], response: [] });
  }
});

test('buyer page preserves original inquiries, seller replies and session-bound chat', async () => {
  const { default: page, calls, metadata } = loadPage('app/inquiries/sent/page.tsx');
  const html = renderToStaticMarkup(await page());
  assert.deepEqual(calls.sent, [user.id]);
  assert.deepEqual(calls.received, []);
  assert.deepEqual(calls.chat, [{ inquiryId: inquiry.id, currentUserId: user.id }]);
  assert.ok(html.includes(inquiry.message));
  assert.ok(html.includes(inquiry.seller_response));
  assert.match(html, /Seller: Seller/);
  assert.match(html, /October 2, 2026/);
  assert.ok(!html.includes(user.password_hash));
  assert.match(metadata.title, /My Inquiries/);
});

test('seller page preserves sender, sent date, initial response and session-bound chat', async () => {
  const { default: page, calls, metadata } = loadPage('app/inquiries/received/page.tsx');
  const html = renderToStaticMarkup(await page());
  assert.deepEqual(calls.received, [user.id]);
  assert.deepEqual(calls.sent, []);
  assert.deepEqual(calls.chat, [{ inquiryId: inquiry.id, currentUserId: user.id }]);
  assert.deepEqual(calls.response, [{ inquiryId: inquiry.id, existingResponse: inquiry.seller_response }]);
  assert.match(html, /From Buyer/);
  assert.match(html, /October 1, 2026/);
  assert.ok(html.includes(inquiry.message));
  assert.ok(html.includes(inquiry.seller_response));
  assert.ok(!html.includes(user.password_hash));
  assert.match(metadata.title, /Received Inquiries/);
});

test('empty inboxes render an empty state without mounting chat or response forms', async () => {
  for (const file of ['app/inquiries/sent/page.tsx', 'app/inquiries/received/page.tsx']) {
    const { default: page, calls } = loadPage(file, { inquiries: [] });
    const html = renderToStaticMarkup(await page());
    assert.match(html, /No inquiries yet/);
    assert.deepEqual(calls.chat, []);
    assert.deepEqual(calls.response, []);
  }
});
