
export default function Footer() {
  return (
    <footer className="border-t border-[#ebc8ba]/60 bg-[#fffdfc]">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="md:col-span-2">
            <a
              href="/"
              className="text-2xl font-bold tracking-tight text-[#352b28]"
            >
              Uni<span className="text-[#c96f52]">Market</span>
            </a>

            <p className="mt-4 max-w-md text-sm leading-6 text-[#746963]">
              A student marketplace built to make buying, selling, and
              connecting on campus easier.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#352b28]">
              Explore
            </h3>

            <div className="mt-4 flex flex-col gap-3">
              <a
                href="/"
                className="text-sm text-[#746963] transition-colors hover:text-[#c96f52]"
              >
                Home
              </a>

              <a
                href="/listings"
                className="text-sm text-[#746963] transition-colors hover:text-[#c96f52]"
              >
                Browse Listings
              </a>

              <a
                href="/sell"
                className="text-sm text-[#746963] transition-colors hover:text-[#c96f52]"
              >
                Sell an Item
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-[#ebc8ba]/60 pt-6">
          <p className="text-sm text-[#746963]">
            © {new Date().getFullYear()} UniMarket. Built for students.
          </p>
        </div>
      </div>
    </footer>
  );
}

