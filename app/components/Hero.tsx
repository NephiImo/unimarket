export default function Hero() {
  return (
    <section className="px-6 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-[#879b7a]">
            Buy • Sell • Connect
          </p>

          <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-[#352b28] sm:text-5xl lg:text-6xl">
            Everything students need, right on campus.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-[#746963]">
            UniMarket makes it simple for students to buy, sell, and discover
            useful items within their campus community.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a
              href="/listings"
              className="rounded-full bg-[#c96f52] px-7 py-3.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#b85f45]"
            >
              Browse Listings
            </a>

            <a
              href="/sell"
              className="rounded-full border border-[#c96f52] px-7 py-3.5 text-center text-sm font-semibold text-[#c96f52] transition-colors hover:bg-[#ebc8ba]/40"
            >
              Sell an Item
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-3xl bg-[#879b7a]/20 p-8 sm:p-12">
            <div className="rounded-2xl bg-[#fffdfc] p-8 shadow-sm">
              <p className="text-sm font-medium text-[#746963]">
                What are you looking for?
              </p>

              <div className="mt-5 flex items-center gap-3 rounded-xl border border-[#ebc8ba] px-4 py-4">
                <span className="text-[#746963]">⌕</span>
                <span className="text-sm text-[#746963]">
                  Search books, electronics, fashion...
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#f6f1ea] p-4">
                  <p className="text-sm font-semibold text-[#352b28]">
                    Books
                  </p>
                  <p className="mt-1 text-xs text-[#746963]">
                    Find your next textbook
                  </p>
                </div>

                <div className="rounded-xl bg-[#f6f1ea] p-4">
                  <p className="text-sm font-semibold text-[#352b28]">
                    Electronics
                  </p>
                  <p className="mt-1 text-xs text-[#746963]">
                    Tech from students
                  </p>
                </div>

                <div className="rounded-xl bg-[#f6f1ea] p-4">
                  <p className="text-sm font-semibold text-[#352b28]">
                    Fashion
                  </p>
                  <p className="mt-1 text-xs text-[#746963]">
                    Style within reach
                  </p>
                </div>

                <div className="rounded-xl bg-[#f6f1ea] p-4">
                  <p className="text-sm font-semibold text-[#352b28]">
                    More
                  </p>
                  <p className="mt-1 text-xs text-[#746963]">
                    Explore everything
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}