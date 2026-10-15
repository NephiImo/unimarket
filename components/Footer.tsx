import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#EBC8BA] bg-[#FFFDFC]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-[#352B28] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© 2026 UniMarket. Built for students.</p>

        <nav aria-label="Footer navigation" className="flex flex-wrap gap-4">
          <Link
            href="/listings"
            className="transition-colors hover:text-[#783322] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#352B28]"
          >
            Browse Listings
          </Link>

          <Link
            href="/listings/new"
            className="transition-colors hover:text-[#783322] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#352B28]"
          >
            Sell an Item
          </Link>

          <Link
            href="/inquiries"
            className="transition-colors hover:text-[#783322] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#352B28]"
          >
            Inquiries
          </Link>
        </nav>
      </div>
    </footer>
  );
}
