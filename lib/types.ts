export type ListingStatus = "available" | "sold" | "removed";

export type Listing = {
  id: number;
  sellerName: string;
  title: string;
  description: string;
  price: number;
  category: string;
  status: ListingStatus;
};
