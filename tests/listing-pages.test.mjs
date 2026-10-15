import assert from 'node:assert/strict';
import test from 'node:test';
import * as React from 'react';
import { createElement } from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadModule } from './helpers/load-typescript.mjs';

const owner = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Listing owner',
  email: 'owner@example.invalid',
};
const listing = {
  id: '22222222-2222-4222-8222-222222222222',
  user_id: owner.id,
  category_id: 42,
  title: 'Study desk',
  description: 'A sturdy desk',
  price: '1200.50',
  image_url: null,
  location: 'Campus',
  status: 'sold',
  created_at: new Date('2026-10-01T00:00:00Z'),
};

function loadPage(
  relativePath,
  {
    user = owner,
    existingListing = listing,
    ownedListings = [listing],
    listingError = null,
  } = {}
) {
  const calls = { categories: 0, listing: 0 };
  const categories = [{ id: 42, name: 'Furniture' }];
  const formProps = [];
  const profileProps = [];
  const ProfileForm = loadModule('components/ProfileForm.tsx', {
    react: React,
    'react/jsx-runtime': jsxRuntime,
    'next/navigation': {
      useRouter: () => ({
        refresh() {
          calls.profileRefresh = (calls.profileRefresh ?? 0) + 1;
        },
      }),
    },
  }).default;
  const dependencies = {
    'react/jsx-runtime': jsxRuntime,
    'next/link': {
      default: ({ href, children, ...props }) =>
        createElement('a', { href, ...props }, children),
      __esModule: true,
    },
    'next/navigation': {
      redirect(href) {
        throw new Error(`redirect:${href}`);
      },
      notFound() {
        throw new Error('notFound');
      },
    },
    '@/app/lib/auth/get-current-user': { getCurrentUser: async () => user },
    '@/app/lib/listings/queries': {
      getCategories: async () => {
        calls.categories++;
        return categories;
      },
      getListingById: async () => {
        calls.listing++;
        return existingListing;
      },
      getListingsByUserId: async (userId) => {
        calls.ownerId = userId;
        if (listingError) throw listingError;
        return ownedListings;
      },
    },
    '@/components/ListingForm': {
      default: (props) => {
        formProps.push(props);
        return createElement('form', { 'data-testid': 'listing-form' });
      },
      __esModule: true,
    },
    '@/components/DeleteListingButton': {
      default: () => createElement('button', {}, 'Delete'),
      __esModule: true,
    },
    '@/components/ListingDetail': {
      default: () => createElement('article', {}, 'Listing details'),
      __esModule: true,
    },
    '@/components/InquiryForm': {
      default: () => createElement('form', { 'data-testid': 'inquiry-form' }),
      __esModule: true,
    },
    '@/components/ProfileForm': {
      default: (props) => {
        profileProps.push(props);
        return createElement(ProfileForm, props);
      },
      __esModule: true,
    },
  };
  const exports = loadModule(relativePath, dependencies);
  return { page: exports.default, calls, categories, formProps, profileProps };
}

test('new and edit pages redirect visitors before querying PostgreSQL', async () => {
  for (const file of [
    'app/listings/new/page.tsx',
    'app/listings/[id]/edit/page.tsx',
  ]) {
    const { page, calls } = loadPage(file, { user: null });
    await assert.rejects(
      page({ params: Promise.resolve({ id: listing.id }) }),
      /redirect:\/login/
    );
    assert.deepEqual(calls, { categories: 0, listing: 0 });
  }
});

test('new page passes database categories to the reusable form', async () => {
  const { page, calls, categories, formProps } = loadPage(
    'app/listings/new/page.tsx'
  );
  renderToStaticMarkup(await page());
  assert.equal(calls.categories, 1);
  assert.deepEqual(formProps[0].categories, categories);
  assert.equal(formProps[0].listing, undefined);
});

test('edit page blocks other users and does not expose an editing form', async () => {
  const { page, calls, formProps } = loadPage(
    'app/listings/[id]/edit/page.tsx',
    { user: { id: 'another-user' } }
  );
  const html = renderToStaticMarkup(
    await page({ params: Promise.resolve({ id: listing.id }) })
  );
  assert.match(html, /You cannot edit this listing/);
  assert.deepEqual(calls, { categories: 0, listing: 1 });
  assert.deepEqual(formProps, []);
});

test('edit page returns not found for unavailable listings', async () => {
  const { page, calls } = loadPage('app/listings/[id]/edit/page.tsx', {
    existingListing: null,
  });
  await assert.rejects(
    page({ params: Promise.resolve({ id: listing.id }) }),
    /notFound/
  );
  assert.equal(calls.categories, 0);
});

test('owner editing prepopulates every field and normalizes PostgreSQL price', async () => {
  const { page, formProps } = loadPage('app/listings/[id]/edit/page.tsx');
  renderToStaticMarkup(
    await page({ params: Promise.resolve({ id: listing.id }) })
  );
  assert.deepEqual(formProps[0].listing, {
    id: listing.id,
    categoryId: 42,
    title: listing.title,
    description: listing.description,
    price: 1200.5,
    imageUrl: null,
    location: listing.location,
    status: 'sold',
  });
});

test('listing details show edit/delete controls only to the owner', async () => {
  for (const user of [owner, { id: 'another-user' }, null]) {
    const { page } = loadPage('components/ListingDetail.tsx', { user });
    const html = renderToStaticMarkup(await page({ listing }));
    assert.equal(html.includes('Edit listing'), user?.id === owner.id);
    assert.equal(
      html.includes('<button>Delete</button>'),
      user?.id === owner.id
    );
  }
});

test('dashboard requires authentication before loading owned listings', async () => {
  const { page, calls } = loadPage('app/dashboard/page.tsx', { user: null });
  await assert.rejects(
    page({ searchParams: Promise.resolve({}) }),
    /redirect:\/login/
  );
  assert.equal(calls.ownerId, undefined);
});

test('dashboard preserves profile and inquiry navigation alongside owner actions', async () => {
  const { page, calls } = loadPage('app/dashboard/page.tsx');
  const html = renderToStaticMarkup(
    await page({ searchParams: Promise.resolve({ deleted: '1' }) })
  );
  assert.equal(calls.ownerId, owner.id);
  assert.match(html, /Profile Information/);
  assert.ok(html.includes(owner.email));
  assert.ok(html.includes(`href="/listings/${listing.id}"`));
  assert.ok(html.includes(`href="/listings/${listing.id}/edit"`));
  assert.match(html, /<button>Delete<\/button>/);
  assert.ok(html.includes('href="/listings/new"'));
  assert.ok(html.includes('href="/inquiries/received"'));
  assert.ok(html.includes('href="/inquiries/sent"'));
  assert.match(html, /Received Inquiries/);
  assert.match(html, /My Inquiries/);
  assert.match(html, /1,200\.50/);
  assert.match(html, /deleted successfully/);
});

test('dashboard renders the real profile form with only public account fields', async () => {
  const passwordHash = 'TEST_PASSWORD_HASH_DO_NOT_EXPOSE';
  const { page, profileProps } = loadPage('app/dashboard/page.tsx', {
    user: {
      ...owner,
      password_hash: passwordHash,
      created_at: new Date('2026-10-01T00:00:00Z'),
    },
  });
  const html = renderToStaticMarkup(
    await page({ searchParams: Promise.resolve({}) })
  );

  assert.deepEqual(profileProps, [{ name: owner.name, email: owner.email }]);
  assert.ok(!html.includes(passwordHash));
  assert.match(html, /<input\b[^>]*id="displayName"[^>]*value="Listing owner"/);
  assert.match(
    html,
    /<input\b[^>]*id="email"[^>]*readOnly=""[^>]*value="owner@example.invalid"/
  );
  assert.match(html, /<label\b[^>]*for="contactPreference"/);
  assert.match(html, /<select\b[^>]*id="contactPreference"/);
  assert.match(html, /In-app messages/);
});

test('empty and failed listing loads preserve the received-inquiries navigation', async () => {
  for (const options of [
    { ownedListings: [] },
    { listingError: new Error('INTERNAL_DATABASE_DETAILS') },
  ]) {
    const { page } = loadPage('app/dashboard/page.tsx', options);
    const html = renderToStaticMarkup(
      await page({ searchParams: Promise.resolve({}) })
    );
    assert.ok(html.includes('href="/inquiries/received"'));
    assert.ok(html.includes('href="/inquiries/sent"'));
    assert.ok(!html.includes('INTERNAL_DATABASE_DETAILS'));
    assert.match(
      html,
      options.listingError ? /load your listings/ : /do not have any listings/
    );
  }
});

test('merged listing details preserve active buyer inquiries and guest login prompts', async () => {
  for (const { user, status, canInquire, loginPrompt } of [
    {
      user: { id: 'buyer' },
      status: 'active',
      canInquire: true,
      loginPrompt: false,
    },
    { user: owner, status: 'active', canInquire: false, loginPrompt: false },
    { user: null, status: 'active', canInquire: false, loginPrompt: true },
    {
      user: { id: 'buyer' },
      status: 'sold',
      canInquire: false,
      loginPrompt: false,
    },
  ]) {
    const { page } = loadPage('app/listings/[id]/page.tsx', {
      user,
      existingListing: { ...listing, status },
    });
    const html = renderToStaticMarkup(
      await page({ params: Promise.resolve({ id: listing.id }) })
    );
    assert.equal(html.includes('data-testid="inquiry-form"'), canInquire);
    assert.equal(
      html.includes('Please log in to contact the seller.'),
      loginPrompt
    );
  }
});
