export type Availability = 'available' | 'sold' | 'reserved';

export interface Listing {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  availability: Availability;
  sellerId: number;
  sellerName: string;
  createdAt: string; // ISO date string
}