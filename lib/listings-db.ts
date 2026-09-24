import type { Listing } from './types';

// TODO(issue #16): Replace this in-memory stub with a Neon PostgreSQL query.
// Owned by the teammate assigned to issue #16 (Implement listings API and data access layer).

const STUB_LISTINGS: Listing[] = [
  {
    id: 1,
    name: 'Calculus Textbook (Stewart, 8th Edition)',
    description:
      'Used for one semester. Some highlighting in chapters 1–5, otherwise in great condition. Perfect for MATH 112 or 113.',
    price: 45.0,
    category: 'Books',
    availability: 'available',
    sellerId: 101,
    sellerName: 'Nephi I.',
    createdAt: '2026-09-20',
  },
  {
    id: 2,
    name: 'Mini Fridge (3.2 cu ft)',
    description:
      'Compact fridge, works perfectly. Selling because I am moving off campus. Pickup only.',
    price: 80.0,
    category: 'Appliances',
    availability: 'available',
    sellerId: 102,
    sellerName: 'Assumpta O.',
    createdAt: '2026-09-18',
  },
  {
    id: 3,
    name: 'Mountain Bike — Trek 3500',
    description:
      'Great starter bike for campus commuting. Recently tuned up, new brake pads. Includes a U-lock.',
    price: 150.0,
    category: 'Sports',
    availability: 'sold',
    sellerId: 103,
    sellerName: 'Ariane P.',
    createdAt: '2026-09-15',
  },
];

export async function getListingById(id: number): Promise<Listing | null> {
  return STUB_LISTINGS.find((l) => l.id === id) ?? null;
}