import type { Listing } from "./types";

export const listings: Listing[] = [
  {
    id: 1,
    sellerName: "Ada",
    title: "Used MacBook Air",
    description: "2020 Air, 8GB RAM, good battery.",
    price: 280000,
    category: "Electronics",
    status: "available",
  },
  {
    id: 2,
    sellerName: "Chidi",
    title: "Calculus textbook",
    description: "Stewart Calculus, light highlighting.",
    price: 8000,
    category: "Books",
    status: "available",
  },
  {
    id: 3,
    sellerName: "Tomi",
    title: "Mini fridge",
    description: "Hostel fridge, works well.",
    price: 45000,
    category: "Furniture",
    status: "available",
  },
];

export function getListings(query = "", category = "") {
  const q = query.trim().toLowerCase();
  return listings.filter((item) => {
    const matchesQuery = !q || item.title.toLowerCase().includes(q);
    const matchesCategory = !category || item.category === category;
    return item.status === "available" && matchesQuery && matchesCategory;
  });
}
