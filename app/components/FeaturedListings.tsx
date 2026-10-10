import Link from "next/link";
import ListingCard from "./ListingCard";
import { getListings, type Listing, } from "@/app/lib/listings/queries";

export default async function FeaturedListings() {
  let featuredListings: Listing[] = [];

  try {
    const listings = await getListings();
    featuredListings = listings.slice(0, 3);
  } catch (error) {
    console.error("Failed to load featured listings:", error);
  }

  return (
    <section className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#879B7A]">
              Discover
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#352B28]">
              Featured listings
            </h2>

            <p className="mt-3 max-w-xl text-[#746963]">
              Discover items students are currently buying and selling on
              campus.
            </p>
          </div>

         <Link
            href="/listings"
            className="text-sm font-semibold text-[#C96F52] hover:underline"
          >
            Browse all listings →
          </Link>
        </div>

        {featuredListings.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-[#D8C9C1] bg-[#FFFDFC] p-8 text-center">
            <p className="text-[#746963]">
              No listings are available yet.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                title={listing.title}
                price={`₦${Number(listing.price).toLocaleString()}`}
                category={listing.category_name ?? "Uncategorized"}
                location={listing.location}
                description={listing.description}
                seller={listing.seller_name ?? "Unknown seller"}
                image={listing.image_url}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}