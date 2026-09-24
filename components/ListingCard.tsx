import Link from "next/link";
import type { Listing } from "../lib/types";

export default function ListingCard({ listing }: { listing: Listing }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">
        {listing.category}
      </p>
      <h2 className="mt-1 text-lg font-semibold text-slate-900">
        {listing.title}
      </h2>
      <p className="mt-2 text-sm text-slate-600">{listing.description}</p>
      <p className="mt-3 font-medium text-slate-900">
        N{listing.price.toLocaleString()}
      </p>
      <p className="mt-1 text-sm text-slate-500">Seller: {listing.sellerName}</p>
      <Link
        href={`/listings/${listing.id}`}
        className="mt-4 inline-block text-sm font-medium text-amber-700"
      >
        View listing
      </Link>
    </article>
  );
}
