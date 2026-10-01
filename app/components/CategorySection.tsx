const categories = [
  {
    name: "Books",
    description: "Textbooks, novels & study materials",
    icon: "📚",
  },
  {
    name: "Electronics",
    description: "Laptops, phones & accessories",
    icon: "💻",
  },
  {
    name: "Fashion",
    description: "Clothes, shoes & accessories",
    icon: "👟",
  },
  {
    name: "Housing",
    description: "Rooms, apartments & spaces",
    icon: "🏠",
  },
  {
    name: "Food",
    description: "Meals, snacks & drinks",
    icon: "🍱",
  },
  {
    name: "Other",
    description: "Everything else students need",
    icon: "✨",
  },
];

export default function CategorySection() {
  return (
    <section className="px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#879b7a]">
              Explore
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#352b28]">
              Find what you need
            </h2>

            <p className="mt-3 max-w-xl text-[#746963]">
              Browse popular categories and discover what other students are
              buying and selling.
            </p>
          </div>

          <a
            href="/listings"
            className="text-sm font-semibold text-[#c96f52] hover:underline"
          >
            View all listings →
          </a>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <a
              key={category.name}
              href={`/listings?category=${category.name.toLowerCase()}`}
              className="group rounded-2xl border border-[#ebc8ba]/60 bg-[#fffdfc] p-6 transition-all hover:-translate-y-1 hover:border-[#c96f52]/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f6f1ea] text-2xl">
                  {category.icon}
                </span>

                <span className="text-[#746963] transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>

              <h3 className="mt-5 font-semibold text-[#352b28]">
                {category.name}
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#746963]">
                {category.description}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}