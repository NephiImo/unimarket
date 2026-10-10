import ListingCard from "@/app/components/ListingCard";
import { getListings } from "@/app/lib/listings/queries";

type SearchParams = Promise<{
  query?: string;
  category?: string;
}>;

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const query = params.query?.trim() || undefined;
  const categoryName = params.category?.trim() || undefined;

  const listings = await getListings(query, categoryName);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#352B28]">
          Browse Listings
        </h1>

        <p className="mt-2 text-[#746963]">
          Find items being sold by students on UniMarket.
        </p>
      </div>

      <form
        action="/listings"
        className="mb-8 grid gap-4 rounded-2xl border border-[#EBC8BA] bg-[#FFFDFC] p-5 md:grid-cols-[1fr_220px_auto]"
      >
        <div>
          <label
            htmlFor="query"
            className="mb-2 block text-sm font-medium text-[#352B28]"
          >
            Search
          </label>

          <input
            id="query"
            name="query"
            type="search"
            defaultValue={params.query ?? ""}
            placeholder="Search by listing title"
            className="w-full rounded-lg border border-[#D8C9C1] bg-white px-3 py-2 text-[#352B28] outline-none focus:border-[#C96F52]"
          />
        </div>

        <div>
          <label
            htmlFor="category"
            className="mb-2 block text-sm font-medium text-[#352B28]"
          >
            Category
          </label>

          <select
            id="category"
            name="category"
            defaultValue={params.category ?? ""}
            className="w-full rounded-lg border border-[#D8C9C1] bg-white px-3 py-2 text-[#352B28] outline-none focus:border-[#C96F52]"
          >
            <option value="">All categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Fashion">Fashion</option>
            <option value="Books">Books</option>
            <option value="Furniture">Furniture</option>
            <option value="Vehicles">Vehicles</option>
            <option value="Food">Food</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-lg bg-[#C96F52] px-5 py-2 font-medium text-white transition-opacity hover:opacity-90"
          >
            Apply Filters
          </button>
        </div>
      </form>

      {listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D8C9C1] bg-[#FFFDFC] p-10 text-center">
          <h2 className="text-lg font-semibold text-[#352B28]">
            No listings found
          </h2>

          <p className="mt-2 text-[#746963]">
            Try a different search or category.
          </p>
        </div>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
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
        </section>
      )}
    </main>
  );
}