import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-[#EBC8BA] bg-[#FFFDFC]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-[#352B28]"
        >
          UniMarket
        </Link>

        <nav
          aria-label="Main navigation"
          className="flex flex-wrap items-center gap-4 text-sm font-medium text-[#352B28]"
        >
          <Link
            href="/"
            className="transition-colors hover:text-[#C96F52]"
          >
            Home
          </Link>

          <Link
            href="/listings"
            className="transition-colors hover:text-[#C96F52]"
          >
            Browse
          </Link>

          <Link
            href="/dashboard"
            className="transition-colors hover:text-[#C96F52]"
          >
            Dashboard
          </Link>

          <Link
            href="/listings/new"
            className="rounded-lg bg-[#C96F52] px-4 py-2 text-[#FFFDFC] transition-opacity hover:opacity-90"
          >
            Sell an Item
          </Link>
        </nav>
      </div>
    </header>
  );
}