import ListingCard from "./ListingCard";

const featuredListings = [
  {
    title: "Calculus Textbook",
    price: "₦8,000",
    category: "Books",
    location: "Campus",
  },
  {
    title: "Wireless Headphones",
    price: "₦25,000",
    category: "Electronics",
    location: "Campus",
  },
  {
    title: "Student Desk",
    price: "₦18,000",
    category: "Furniture",
    location: "Campus",
  },
];

export default function FeaturedListings() {
  return (
    <section className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#879b7a]">
              Discover
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#352b28]">
              Featured listings
            </h2>

            <p className="mt-3 max-w-xl text-[#746963]">
              Discover items students are currently buying and selling on
              campus.
            </p>
          </div>

          <a
            href="/listings"
            className="text-sm font-semibold text-[#c96f52] hover:underline"
          >
            Browse all listings →
          </a>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredListings.map((listing) => (
            <ListingCard key={listing.title} {...listing} />
          ))}
        </div>
      </div>
    </section>
  );
}