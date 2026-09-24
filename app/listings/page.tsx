import ListingCard from "../../components/ListingCard";
import { getListings } from "../../lib/listings";

type SearchParams = Promise<{ query?: string; category?: string }>;

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = params.query ?? "";
  const category = params.category ?? "";
  const results = getListings(query, category);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-semibold text-slate-900">Campus listings</h1>
      <p className="mt-2 text-slate-600">
        Browse items students are selling. Search and filter come from the URL.
      </p>

      <form className="mt-6 flex flex-wrap gap-3" action="/listings">
        <label className="sr-only" htmlFor="query">
          Search listings
        </label>
        <input
          id="query"
          name="query"
          defaultValue={query}
          placeholder="Search by name"
          className="rounded border border-slate-300 px-3 py-2"
        />
        <label className="sr-only" htmlFor="category">
          Category
        </label>
        <select
          id="category"
          name="category"
          defaultValue={category}
          className="rounded border border-slate-300 px-3 py-2"
        >
          <option value="">All categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Books">Books</option>
          <option value="Furniture">Furniture</option>
        </select>
        <button
          type="submit"
          className="rounded bg-[#0F2A44] px-4 py-2 text-white"
        >
          Filter
        </button>
      </form>

      {results.length === 0 ? (
        <p className="mt-8 text-slate-600">No listings match those filters.</p>
      ) : (
        <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </section>
      )}
    </main>
  );
}
